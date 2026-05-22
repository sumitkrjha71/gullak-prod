// Consent lifecycle manager — provider-agnostic.
// Handles: initiate, activate, renew, revoke, status-poll.
// Also triggers the ingestion + intelligence pipeline on CONSENT_GRANTED.

import { prisma } from '@/lib/db/client';
import { writeAudit } from '@/lib/audit/log';
import { logger } from '@/lib/logger';
import { emit } from '@/lib/events/bus';
import { MockAAProvider } from './mock';
import { SetuAAProvider } from './setu';
import type { IAAProvider } from './provider';

const isAAReal = process.env.AA_REAL === 'true';

export function getProvider(): IAAProvider {
  if (isAAReal) return new SetuAAProvider();
  return new MockAAProvider();
}

export const SUPPORTED_FIPS = [
  { id: 'HDFC',       name: 'HDFC Bank',          logo: '🏦', popular: true },
  { id: 'ICICI',      name: 'ICICI Bank',          logo: '🏦', popular: true },
  { id: 'SBI',        name: 'State Bank of India', logo: '🏦', popular: true },
  { id: 'AXIS',       name: 'Axis Bank',           logo: '🏦', popular: false },
  { id: 'KOTAK',      name: 'Kotak Mahindra Bank', logo: '🏦', popular: false },
  { id: 'INDUSIND',   name: 'IndusInd Bank',       logo: '🏦', popular: false },
  // Mock FIPs for dev
  { id: 'MOCK_HDFC',  name: 'HDFC Bank',           logo: '🏦', popular: true  },
  { id: 'MOCK_ICICI', name: 'ICICI Bank',           logo: '🏦', popular: true  },
  { id: 'MOCK_SBI',   name: 'State Bank of India',  logo: '🏦', popular: true  },
];

export async function initiateConsent(userId: string, fipIds: string[]): Promise<{
  consentHandle: string;
  redirectUrl: string;
  mode: string;
}> {
  const provider = getProvider();
  const result = await provider.createConsent({
    userId,
    fipIds,
    purpose: 'To provide personalized saving and investment recommendations via Gullak',
    durationDays: 365,
  });

  // In mock mode: immediately mark ACTIVE and store
  const status = isAAReal ? 'PENDING' : 'ACTIVE';
  const dataExpiresAt = new Date(result.expiresAt.getTime() + 30 * 86400000);

  await prisma.aAConsent.create({
    data: {
      userId,
      fipId: fipIds[0] ?? 'MOCK_HDFC',
      providerType: provider.providerType,
      consentHandle: result.consentHandle,
      status,
      purpose: 'Wealth Management',
      fiTypes: 'DEPOSIT',
      expiresAt: result.expiresAt,
      dataExpiresAt,
      fetchedAt: isAAReal ? null : new Date(),
    },
  });

  await prisma.user.update({ where: { id: userId }, data: { aaConsentLinkedAt: new Date() } });

  await writeAudit({ userId, eventType: 'AA_CONSENT_INITIATED', payload: { fipIds, mode: provider.providerType, status }, source: 'user' });

  if (!isAAReal) {
    // Mock: immediately emit CONSENT_GRANTED to trigger the pipeline
    const consent = await prisma.aAConsent.findFirst({ where: { userId, consentHandle: result.consentHandle } });
    if (consent) {
      await emit({ type: 'CONSENT_GRANTED', userId, consentId: consent.id });
    }
  }

  logger.info({ userId, consentHandle: result.consentHandle, mode: provider.providerType }, 'consent_initiated');
  return { consentHandle: result.consentHandle, redirectUrl: result.redirectUrl, mode: provider.providerType };
}

export async function activateConsent(consentHandle: string): Promise<void> {
  const provider = getProvider();
  const statusResult = await provider.getConsentStatus(consentHandle);

  if (statusResult.status !== 'ACTIVE') {
    logger.warn({ consentHandle, status: statusResult.status }, 'consent_not_active');
    return;
  }

  const consent = await prisma.aAConsent.update({
    where: { consentHandle },
    data: {
      status: 'ACTIVE',
      consentArtefact: statusResult.artefact ?? null,
      encryptedToken: statusResult.accessToken ?? null,
      fetchedAt: new Date(),
    },
  });

  await writeAudit({ userId: consent.userId, eventType: 'AA_CONSENT_ACTIVATED', payload: { consentHandle }, source: 'system' });
  await emit({ type: 'CONSENT_GRANTED', userId: consent.userId, consentId: consent.id });
}

export async function revokeConsent(userId: string, consentHandle: string): Promise<void> {
  const consent = await prisma.aAConsent.findUnique({ where: { consentHandle } });
  if (!consent || consent.userId !== userId) throw new Error('consent_not_found');

  const provider = getProvider();
  if (consent.encryptedToken) {
    try { await provider.revokeConsent(consent.encryptedToken); } catch { /* provider revoke is best-effort */ }
  }

  await prisma.aAConsent.update({
    where: { consentHandle },
    data: { status: 'REVOKED', encryptedToken: null },
  });

  await writeAudit({ userId, eventType: 'AA_CONSENT_REVOKED', payload: { consentHandle }, source: 'user' });
  await emit({ type: 'CONSENT_REVOKED', userId, consentId: consent.id });

  logger.info({ userId, consentHandle }, 'consent_revoked');
}

export async function getActiveConsent(userId: string) {
  return prisma.aAConsent.findFirst({ where: { userId, status: 'ACTIVE' }, orderBy: { createdAt: 'desc' } });
}

export async function checkExpiringConsents(): Promise<void> {
  const in7Days = new Date(Date.now() + 7 * 86400000);
  const expiring = await prisma.aAConsent.findMany({
    where: { status: 'ACTIVE', expiresAt: { lte: in7Days } },
  });
  for (const c of expiring) {
    const daysLeft = Math.ceil((c.expiresAt.getTime() - Date.now()) / 86400000);
    await emit({ type: 'CONSENT_EXPIRING', userId: c.userId, daysLeft });
  }
}
