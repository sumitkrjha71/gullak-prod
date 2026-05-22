import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readSession } from '@/lib/auth/session';
import { verifyPAN } from '@/lib/kyc/pan';
import { hasMandatoryConsents } from '@/lib/kyc/consent';
import { logger } from '@/lib/logger';

const schema = z.object({
  pan: z.string().trim().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    // Consent gate — TERMS + PRIVACY must be accepted before KYC
    const hasConsents = await hasMandatoryConsents(session.userId);
    if (!hasConsents) {
      return NextResponse.json({ ok: false, error: 'consent_required' }, { status: 403 });
    }

    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ ok: false, error: 'invalid_pan', details: body.error.flatten() }, { status: 400 });
    }

    const result = await verifyPAN(session.userId, body.data.pan);

    if (!result.ok) {
      const status = result.reason === 'already_verified' ? 200 : 422;
      return NextResponse.json({ ok: false, error: result.reason }, { status });
    }

    return NextResponse.json({ ok: true, name: result.name, maskedPan: result.maskedPan });
  } catch (err) {
    logger.error({ route: 'kyc/pan', err: (err as Error)?.message }, 'uncaught_error');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
