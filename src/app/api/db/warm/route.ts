// Lightweight DB warm-up. Fire-and-forget after OTP login so Neon is awake
// by the time the user navigates to the first DB-backed page (name, etc.).
// Returns immediately; the actual DB call retries through the prisma middleware.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const maxDuration = 15;

export async function GET() {
  try {
    // Cheapest possible query — a count() against featureFlag so we hit the DB
    // but not any user-scoped tables.
    await prisma.featureFlag.count();
    return NextResponse.json({ ok: true });
  } catch {
    // Caller is fire-and-forget; never error out.
    return NextResponse.json({ ok: false });
  }
}
