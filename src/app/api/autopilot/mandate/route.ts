// Mandate authorisation.
// Mock mode: DB write only — mandate is immediately PENDING/usable for simulator.
// Real mode (isRazorpayEnabled): creates a Razorpay Plan + Subscription, returns
// short_url for the user to complete UPI Autopay authorisation in their UPI app.
// The mandate status moves PENDING → ACTIVE when subscription.authenticated fires.

import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { ensureKYC } from '@/lib/kyc/gate';
import { isRazorpayEnabled, createPlan, createSubscription } from '@/lib/payments/razorpay';
import { writeAudit } from '@/lib/audit/log';
import { logger } from '@/lib/logger';

export const maxDuration = 15;

// Maps rule frequency/mode to Razorpay plan period.
function toPlanPeriod(mode: string, frequency: string | null): 'daily' | 'weekly' | 'monthly' {
  if (mode === 'sweep') return 'monthly';
  if (frequency === 'weekly') return 'weekly';
  return 'daily';
}

// Next IST 6 AM as a Unix timestamp — first debit fires after overnight auth.
function nextIst6amUnix(): number {
  const now = new Date();
  // IST = UTC+5:30 → offset 330 min
  const istNow = new Date(now.getTime() + 330 * 60 * 1000);
  const tomorrow = new Date(istNow);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 30, 0, 0); // 06:00 IST = 00:30 UTC
  return Math.floor(tomorrow.getTime() / 1000);
}

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
    const period = toPlanPeriod(rule.mode, rule.frequency);

    let pspSubscriptionId: string | null = null;
    let shortUrl: string | null = null;

    if (isRazorpayEnabled && rule.amountPaise && rule.amountPaise > 0n) {
      // Create Razorpay Plan + Subscription for UPI Autopay.
      const notes = {
        userId:  session.userId,
        ruleId:  rule.id,
        goalId:  rule.goalId,
        source:  rule.mode,
      };
      const { planId } = await createPlan(Number(rule.amountPaise), period, notes);
      const sub = await createSubscription(planId, nextIst6amUnix(), notes);
      pspSubscriptionId = sub.subscriptionId;
      shortUrl = sub.shortUrl;
      logger.info({ ruleId: rule.id, subscriptionId: pspSubscriptionId }, 'mandate_subscription_created');
    }

    await prisma.mandate.upsert({
      where:  { ruleId: rule.id },
      update: {
        maxPerDebitPaise:  cap,
        revokedAt:         null,
        authorisedAt:      new Date(),
        status:            isRazorpayEnabled ? 'PENDING' : 'ACTIVE',
        pspSubscriptionId: pspSubscriptionId ?? undefined,
        activatedAt:       isRazorpayEnabled ? null : new Date(),
      },
      create: {
        userId:            session.userId,
        ruleId:            rule.id,
        maxPerDebitPaise:  cap,
        cap:               rule.mode === 'sweep' ? 'monthly' : (rule.frequency === 'weekly' ? 'weekly' : 'daily'),
        status:            isRazorpayEnabled ? 'PENDING' : 'ACTIVE',
        pspSubscriptionId: pspSubscriptionId ?? null,
        activatedAt:       isRazorpayEnabled ? null : new Date(),
      },
    });

    await writeAudit({
      userId:    session.userId,
      eventType: 'MANDATE_CREATED',
      payload:   { ruleId, pspSubscriptionId, mode: isRazorpayEnabled ? 'real' : 'mock' },
      source:    'user',
    });

    return NextResponse.json({
      ok:       true,
      mode:     isRazorpayEnabled ? 'real' : 'mock',
      // shortUrl present only in real mode — frontend should redirect user here.
      shortUrl: shortUrl ?? null,
    });

  } catch (err) {
    logger.error({ route: 'autopilot/mandate', err: (err as Error)?.message }, 'mandate_failed');
    return NextResponse.json({ ok: false, error: 'mandate_failed' }, { status: 500 });
  }
}
