// Cron: runs financial analysis for all users who have bank transactions.
// Also cleans up data for revoked consents past their dataExpiresAt date.
// Scheduled daily at 3 AM IST via vercel.json cron.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { runFullAnalysis } from '@/lib/khata/pipeline';
import { writeAudit } from '@/lib/audit/log';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.CRON_SECRET &&
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const results = { analyzed: 0, errors: 0, deleted: 0 };

  // ── Step 1: Re-analyze active users ──────────────────────────────────────
  const activeUserIds = await prisma.bankTransaction.findMany({
    distinct: ['userId'],
    select:   { userId: true },
  });

  for (const { userId } of activeUserIds) {
    try {
      await runFullAnalysis(userId);
      results.analyzed++;
    } catch (err) {
      logger.error({ userId, err: (err as Error).message }, 'cron_khata_analysis_error');
      results.errors++;
    }
  }

  // ── Step 2: Delete data for expired/revoked consents (DPDP Act 2023) ────
  const expiredConsents = await prisma.aAConsent.findMany({
    where: {
      status:       { in: ['REVOKED', 'EXPIRED'] },
      dataExpiresAt: { lte: new Date() },
    },
    select: { id: true, userId: true },
  });

  for (const consent of expiredConsents) {
    try {
      // Cascade deletes BankAccount → BankTransaction via Prisma onDelete: Cascade
      await prisma.aAConsent.delete({ where: { id: consent.id } });
      await writeAudit({
        userId:    consent.userId,
        eventType: 'AA_DATA_DELETED',
        payload:   { consentId: consent.id, reason: 'data_expires_at_passed' },
        source:    'system',
      });
      results.deleted++;
    } catch (err) {
      logger.error({ consentId: consent.id, err: (err as Error).message }, 'cron_data_delete_error');
      results.errors++;
    }
  }

  logger.info(results, 'cron_khata_analysis_complete');
  return NextResponse.json({ ok: true, ...results });
}
