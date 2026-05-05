// Goal creation. Accepts a client-provided `id` so the client can navigate
// immediately without waiting for the API to assign one. Fire-and-forget on
// the client side.
//
// Single DB write only — count/dispatch/transitionUser side-effects removed
// from the request path. They were causing 5x sequential Prisma calls on a
// potentially cold Neon, blowing past Vercel's 10s function timeout. Those
// side-effects are non-essential for the user flow.

import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { id, type, title, targetPaise, deadline } = await req.json();
  if (!type || !title || typeof targetPaise !== 'number' || targetPaise <= 0) {
    return NextResponse.json({ ok: false, error: 'bad_input' }, { status: 400 });
  }

  try {
    const goal = await prisma.goal.create({
      data: {
        ...(typeof id === 'string' && id.length > 0 ? { id } : {}),
        userId: session.userId,
        type,
        title,
        targetPaise: BigInt(Math.round(targetPaise)),
        deadline: deadline ? new Date(deadline) : null,
      },
    });
    return NextResponse.json({ ok: true, id: goal.id });
  } catch (err) {
    console.error('[api/goals] create failed:', (err as Error)?.message);
    return NextResponse.json({ ok: false, error: 'create_failed' }, { status: 500 });
  }
}
