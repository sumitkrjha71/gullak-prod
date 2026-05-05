// Lightweight DB warm-up + demo-user self-heal.
// Called fire-and-forget by the OTP form right after login.
// Also called by /home as a backstop if the user record is missing.
//
// Two responsibilities:
//   1. Warm Neon (cheap touch query) so subsequent calls aren't cold-start.
//   2. Ensure the demo user exists. The build-time seed is best-effort and
//      can be skipped if Neon is asleep at deploy time. This route guarantees
//      the user exists before the user's first onboarding write hits.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { readSession } from '@/lib/auth/session';
import { ensureDemoUser } from '@/lib/seed/ensure';

export const maxDuration = 20;

export async function GET() {
  try {
    // Warm-up touch.
    await prisma.featureFlag.count();
    // Self-heal demo user if a session is present.
    const session = await readSession();
    if (session) {
      await ensureDemoUser({
        userId: session.userId,
        phone: session.phone,
        locale: 'en',
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    // Caller is fire-and-forget; never error out.
    return NextResponse.json({ ok: false });
  }
}
