// Mandate authorisation. Single DB write — audit log + lifecycle transition
// side-effects removed from the request path so we don't stack 4-5 sequential
// cold-start retries and exceed the function timeout. The mandate row itself
// is the only thing that needs to land for downstream logic to work.

import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { ensureKYC } from '@/lib/kyc/gate';
import { logger } from '@/lib/logger';

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const kycGate = await ensureKYC(session.userId);
  if (kycGate) return kycGate;

  const { ruleId } = await req.json();
  if (typeof ruleId !== 'string' || ruleId.length === 0) {
    return NextResponse.json({ ok: false, error: 'bad_input' }, { status: 400 });
  }

  try {
    const rule = await prisma.autopilotRule.findUnique({ where: { id: ruleId } });
    if (!rule || rule.userId !== session.userId) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
    // Cap = max(amountPaise * 5, ₹2000) so daily debits comfortably pass.
    const cap = rule.amountPaise && rule.amountPaise > 0n ? rule.amountPaise * 5n : 200000n;
    await prisma.mandate.upsert({
      where: { ruleId: rule.id },
      update: { maxPerDebitPaise: cap, revokedAt: null, authorisedAt: new Date() },
      create: {
        userId: session.userId,
        ruleId: rule.id,
        maxPerDebitPaise: cap,
        cap: rule.mode === 'sweep' ? 'monthly' : 'daily',
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ route: 'autopilot/mandate', err: (err as Error)?.message }, 'mandate_failed');
    return NextResponse.json({ ok: false, error: 'mandate_failed' }, { status: 500 });
  }
}
