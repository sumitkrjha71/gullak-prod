// AA Provider abstraction layer.
// All AA providers implement IAAProvider. Swap Setu ↔ Finvu ↔ Mock by changing
// the factory in consent.ts — no callers change.

import type { RawTransaction } from '@/lib/khata/types';

export interface ConsentParams {
  userId:   string;
  fipIds:   string[];   // banks to connect
  purpose:  string;
  durationDays: number;
}

export interface ConsentResult {
  consentHandle: string;
  redirectUrl:   string;   // user visits this to authenticate with their bank
  expiresAt:     Date;
}

export interface ConsentStatusResult {
  consentHandle: string;
  status:        'PENDING' | 'ACTIVE' | 'REJECTED' | 'REVOKED' | 'EXPIRED';
  artefact?:     string;  // signed consent artefact JSON
  accessToken?:  string;  // token for data fetch
}

export interface DateRange {
  from: Date;
  to:   Date;
}

export interface FetchSessionResult {
  sessionId: string;
  accounts:  { accountId: string; fipId: string; accountMasked: string; accountType: string }[];
}

export interface IAAProvider {
  providerType:   string;
  createConsent(params: ConsentParams): Promise<ConsentResult>;
  getConsentStatus(consentHandle: string): Promise<ConsentStatusResult>;
  fetchFIData(accessToken: string, dateRange: DateRange): Promise<FetchSessionResult>;
  getTransactions(sessionId: string, accountId: string): Promise<RawTransaction[]>;
  revokeConsent(accessToken: string): Promise<void>;
}
