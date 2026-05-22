// Setu AA (Account Aggregator) adapter.
// Real mode: calls Setu's AA REST API (https://aa.setu.co/).
// Mock mode: falls through — SetuAAProvider is only instantiated when AA_REAL=true.
// Setu auth: JWT bearer token obtained via client_credentials flow.

import type { IAAProvider, ConsentParams, ConsentResult, ConsentStatusResult, DateRange, FetchSessionResult } from './provider';
import type { RawTransaction } from '@/lib/khata/types';
import { logger } from '@/lib/logger';

const SETU_BASE = process.env.SETU_AA_BASE_URL ?? 'https://aa.setu.co/api/v2';
const CLIENT_ID     = process.env.SETU_AA_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.SETU_AA_CLIENT_SECRET ?? '';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 30_000) return cachedToken;
  const res = await fetch(`${SETU_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientID: CLIENT_ID, secret: CLIENT_SECRET }),
  });
  if (!res.ok) throw new Error(`setu_token_failed: ${res.status}`);
  const data = await res.json() as { accessToken: string; expiresIn: number };
  cachedToken = data.accessToken;
  tokenExpiresAt = Date.now() + data.expiresIn * 1000;
  return cachedToken;
}

async function setuFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${SETU_BASE}${path}`, {
    ...init,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    logger.error({ path, status: res.status, body }, 'setu_api_error');
    throw new Error(`setu_api_error:${res.status}`);
  }
  return res.json() as Promise<T>;
}

export class SetuAAProvider implements IAAProvider {
  readonly providerType = 'setu';

  async createConsent(params: ConsentParams): Promise<ConsentResult> {
    const now = new Date();
    const body = {
      consentDuration: { unit: 'DAY', value: params.durationDays },
      dataRange: { from: new Date(now.getTime() - 365 * 86400000).toISOString(), to: now.toISOString() },
      context: [{ key: 'accounttype', value: 'SAVINGS' }],
      purpose: { category: { type: 'string' }, code: '13', text: params.purpose, refUri: 'https://gullak.app' },
      fiTypes: params.fipIds.length > 0 ? ['DEPOSIT'] : ['DEPOSIT'],
      fetchType: 'PERIODIC',
      frequency: { unit: 'MONTH', value: 1 },
      consentTypes: ['TRANSACTIONS', 'PROFILE', 'SUMMARY'],
    };
    const data = await setuFetch<{ id: string; url: string; expiry: string }>('/consents', {
      method: 'POST', body: JSON.stringify(body),
    });
    return { consentHandle: data.id, redirectUrl: data.url, expiresAt: new Date(data.expiry) };
  }

  async getConsentStatus(consentHandle: string): Promise<ConsentStatusResult> {
    const data = await setuFetch<{ status: string; signedConsent?: string; accessToken?: string }>(
      `/consents/${consentHandle}`,
    );
    return {
      consentHandle,
      status: data.status as ConsentStatusResult['status'],
      artefact: data.signedConsent,
      accessToken: data.accessToken,
    };
  }

  async fetchFIData(accessToken: string, dateRange: DateRange): Promise<FetchSessionResult> {
    const data = await setuFetch<{ sessionId: string; fip: { accounts: { accountId: string; fipId: string; maskedAccNumber: string; accountType: string }[] } }>(
      '/sessions',
      { method: 'POST', body: JSON.stringify({ consentId: accessToken, from: dateRange.from.toISOString(), to: dateRange.to.toISOString() }) },
    );
    return {
      sessionId: data.sessionId,
      accounts: data.fip.accounts.map(a => ({
        accountId: a.accountId, fipId: a.fipId,
        accountMasked: `XXXX${a.maskedAccNumber.slice(-4)}`,
        accountType: a.accountType,
      })),
    };
  }

  async getTransactions(sessionId: string, accountId: string): Promise<RawTransaction[]> {
    const data = await setuFetch<{ fiData: { account: { transactions: { txnId: string; amount: string; type: string; mode: string; currentBalance: string; transactionTimestamp: string; narration: string }[] } }[] }>(
      `/sessions/${sessionId}`,
    );
    const txns: RawTransaction[] = [];
    for (const fi of data.fiData ?? []) {
      for (const t of fi.account?.transactions ?? []) {
        txns.push({
          externalId:  t.txnId,
          accountId,
          txnDate:     new Date(t.transactionTimestamp),
          amountPaise: BigInt(Math.round(parseFloat(t.amount) * 100)),
          txnType:     t.type === 'CREDIT' ? 'CREDIT' : 'DEBIT',
          narration:   t.narration ?? '',
          balance:     t.currentBalance ? BigInt(Math.round(parseFloat(t.currentBalance) * 100)) : undefined,
        });
      }
    }
    return txns;
  }

  async revokeConsent(accessToken: string): Promise<void> {
    await setuFetch(`/consents/${accessToken}/revoke`, { method: 'POST' });
  }
}
