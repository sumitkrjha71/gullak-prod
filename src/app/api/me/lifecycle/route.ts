import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { transitionUser, type LifecycleState } from '@/lib/state-machine/user';

const allowed: LifecycleState[] = [
  'ONBOARDING',
  'TRUST_ACKNOWLEDGED',
  'GOAL_CREATED',
  'AUTOPILOT_CONFIGURED',
  'MANDATE_PENDING',
  'ACTIVE',
  'PAUSED',
];

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { to } = await req.json();
  if (!allowed.includes(to)) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    await transitionUser(session.userId, to);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'failed' }, { status: 400 });
  }
}
