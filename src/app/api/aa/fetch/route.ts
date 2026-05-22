import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { getActiveConsent } from '@/lib/aa/consent';
import { ingestForConsent } from '@/lib/aa/ingestion';
import { initKhataPipeline } from '@/lib/khata/pipeline';

initKhataPipeline();

/** Manual trigger: re-fetch transactions for the user's active consent. */
export async function POST() {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const consent = await getActiveConsent(session.userId);
  if (!consent) {
    return NextResponse.json({ ok: false, error: 'no_active_consent' }, { status: 400 });
  }

  const result = await ingestForConsent(consent.id, session.userId);
  return NextResponse.json({ ok: true, ...result });
}
