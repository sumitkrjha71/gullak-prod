import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readSession } from '@/lib/auth/session';
import { recordConsent, type ConsentType } from '@/lib/kyc/consent';
import { logger } from '@/lib/logger';

const schema = z.object({
  consentType: z.enum(['TERMS', 'PRIVACY', 'MANDATE', 'AA', 'MARKETING']),
  action: z.enum(['ACCEPTED', 'REVOKED']),
});

export async function POST(req: NextRequest) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 });
    }

    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') ?? undefined;
    const ua = req.headers.get('user-agent') ?? undefined;

    await recordConsent({
      userId: session.userId,
      consentType: body.data.consentType as ConsentType,
      action: body.data.action,
      ipAddress: ip,
      userAgent: ua,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ route: 'kyc/consent', err: (err as Error)?.message }, 'uncaught_error');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
