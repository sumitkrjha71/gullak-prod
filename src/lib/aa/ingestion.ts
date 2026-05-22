// Transaction ingestion pipeline.
// Fetches raw transactions from the AA provider, normalizes, deduplicates,
// classifies, and stores into BankAccount + BankTransaction tables.
// Called after CONSENT_GRANTED event.

import crypto from 'crypto';
import { prisma } from '@/lib/db/client';
import { writeAudit } from '@/lib/audit/log';
import { logger } from '@/lib/logger';
import { emit } from '@/lib/events/bus';
import { getProvider } from './consent';
import { generateMockTransactions } from './mock';
import { classifyTransaction } from '@/lib/khata/classify';
import type { RawTransaction } from '@/lib/khata/types';

const isAAReal = process.env.AA_REAL === 'true';

/** Mask narration: keep first 20 chars, strip digits that look like account/phone numbers */
function maskNarration(narration: string): string {
  return narration
    .slice(0, 20)
    .replace(/\d{6,}/g, 'XXXXXX')
    .trim();
}

/** Dedup hash: stable per (accountId + date + amount + narration prefix) */
function makeDedupHash(accountId: string, txn: RawTransaction): string {
  const dateStr = txn.txnDate.toISOString().slice(0, 10);
  const narPfx  = txn.narration.slice(0, 12).toUpperCase();
  const key = `${accountId}|${dateStr}|${txn.amountPaise}|${txn.txnType}|${narPfx}`;
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 32);
}

export interface IngestionResult {
  accountsProcessed: number;
  txnsIngested:      number;
  txnsDuped:         number;
  errors:            number;
}

export async function ingestForConsent(consentId: string, userId: string): Promise<IngestionResult> {
  const result: IngestionResult = { accountsProcessed: 0, txnsIngested: 0, txnsDuped: 0, errors: 0 };
  const consent = await prisma.aAConsent.findUnique({ where: { id: consentId } });
  if (!consent || consent.status !== 'ACTIVE') {
    logger.warn({ consentId, userId }, 'ingest_skipped_no_active_consent');
    return result;
  }

  const provider = getProvider();
  const now = new Date();
  const from = new Date(now.getTime() - 365 * 86400000);

  let accounts: { accountId: string; fipId: string; accountMasked: string; accountType: string }[] = [];
  let sessionId = '';

  try {
    const session = isAAReal && consent.encryptedToken
      ? await provider.fetchFIData(consent.encryptedToken, { from, to: now })
      : { sessionId: `mock-session-${userId}`, accounts: [{ accountId: 'mock-acc-1', fipId: consent.fipId, accountMasked: 'XXXX4321', accountType: 'SAVINGS' }] };

    accounts  = session.accounts;
    sessionId = session.sessionId;
  } catch (err) {
    logger.error({ consentId, err: (err as Error)?.message }, 'ingest_fetch_session_failed');
    result.errors++;
    return result;
  }

  for (const acc of accounts) {
    result.accountsProcessed++;

    // Upsert the BankAccount row
    const bankAccount = await prisma.bankAccount.upsert({
      where: { userId_accountMasked_fipId: { userId, accountMasked: acc.accountMasked, fipId: acc.fipId } },
      create: { userId, consentId, fipId: acc.fipId, accountMasked: acc.accountMasked, accountType: acc.accountType, isActive: true },
      update: { isActive: true, consentId },
    });

    let rawTxns: RawTransaction[] = [];
    try {
      rawTxns = isAAReal
        ? await provider.getTransactions(sessionId, acc.accountId)
        : generateMockTransactions(userId, bankAccount.id);
    } catch (err) {
      logger.error({ consentId, accountId: bankAccount.id, err: (err as Error)?.message }, 'ingest_txn_fetch_failed');
      result.errors++;
      continue;
    }

    // Process each transaction
    let lastMonthKey = '';
    for (const txn of rawTxns) {
      const dedupHash = makeDedupHash(bankAccount.id, txn);

      // Skip duplicates
      const existing = await prisma.bankTransaction.findUnique({ where: { dedupHash } });
      if (existing) { result.txnsDuped++; continue; }

      // Classify
      const cls = classifyTransaction(txn.narration, txn.txnType, txn.amountPaise, txn.txnDate);

      try {
        await prisma.bankTransaction.create({
          data: {
            userId,
            accountId:       bankAccount.id,
            dedupHash,
            txnDate:         txn.txnDate,
            valueDate:       txn.valueDate ?? txn.txnDate,
            amountPaise:     txn.amountPaise,
            txnType:         txn.txnType,
            narrationMasked: maskNarration(txn.narration),
            balance:         txn.balance ?? null,
            category:        cls.category,
            subCategory:     cls.subCategory ?? null,
            classifiedBy:    cls.confidence >= 85 ? 'rules' : 'rules',
            confidence:      cls.confidence,
            isRecurring:     cls.isRecurring,
            recurringGroup:  cls.recurringGroup ?? null,
            flags:           JSON.stringify(cls.flags),
          },
        });
        result.txnsIngested++;

        // Emit TRANSACTIONS_FETCHED per month-batch for pipeline efficiency
        const monthKey = txn.txnDate.toISOString().slice(0, 7);
        if (monthKey !== lastMonthKey) {
          lastMonthKey = monthKey;
          await emit({ type: 'TRANSACTIONS_FETCHED', userId, accountId: bankAccount.id, count: result.txnsIngested });
        }
      } catch {
        result.errors++;
      }
    }
  }

  // Update consent fetchedAt
  await prisma.aAConsent.update({ where: { id: consentId }, data: { fetchedAt: now, fetchedUntil: from } });

  await writeAudit({ userId, eventType: 'AA_DATA_FETCHED', payload: { consentId, ...result }, source: 'system' });
  logger.info({ userId, consentId, ...result }, 'ingest_complete');

  return result;
}
