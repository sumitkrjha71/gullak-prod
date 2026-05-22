// DPDP Act 2023 consent management.
// Every accept/revoke action is append-only — never update, only insert.

import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export type ConsentType = 'TERMS' | 'PRIVACY' | 'MANDATE' | 'AA' | 'MARKETING';

// Bump this when the document changes — users who accepted an older version
// will be prompted again.
export const CURRENT_VERSIONS: Record<ConsentType, string> = {
  TERMS:     'v1.0',
  PRIVACY:   'v1.0',
  MANDATE:   'v1.0',
  AA:        'v1.0',
  MARKETING: 'v1.0',
};

export async function recordConsent(args: {
  userId: string;
  consentType: ConsentType;
  action: 'ACCEPTED' | 'REVOKED';
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await prisma.userConsent.create({
    data: {
      userId:          args.userId,
      consentType:     args.consentType,
      documentVersion: CURRENT_VERSIONS[args.consentType],
      action:          args.action,
      ipAddress:       args.ipAddress ?? null,
      userAgent:       args.userAgent ?? null,
    },
  });
  logger.info({ userId: args.userId, consentType: args.consentType, action: args.action }, 'consent_recorded');
}

// Returns the latest action for each required consent type.
// Returns null for types the user hasn't acted on yet.
export async function getConsentStatus(userId: string): Promise<Record<ConsentType, 'ACCEPTED' | 'REVOKED' | null>> {
  const rows = await prisma.userConsent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const types: ConsentType[] = ['TERMS', 'PRIVACY', 'MANDATE', 'AA', 'MARKETING'];
  const result = {} as Record<ConsentType, 'ACCEPTED' | 'REVOKED' | null>;

  for (const type of types) {
    const latest = rows.find(r => r.consentType === type);
    result[type] = (latest?.action as 'ACCEPTED' | 'REVOKED') ?? null;
  }

  return result;
}

// True only if user has ACCEPTED the current version of TERMS and PRIVACY.
// These two are mandatory before KYC can proceed.
export async function hasMandatoryConsents(userId: string): Promise<boolean> {
  const required: ConsentType[] = ['TERMS', 'PRIVACY'];
  for (const type of required) {
    const latest = await prisma.userConsent.findFirst({
      where: {
        userId,
        consentType: type,
        documentVersion: CURRENT_VERSIONS[type],
        action: 'ACCEPTED',
      },
    });
    if (!latest) return false;
  }
  return true;
}
