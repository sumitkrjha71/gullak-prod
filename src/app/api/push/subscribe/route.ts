// V5 M11 — POST /api/push/subscribe — saves a Web Push subscription for the user.
// Idempotent — re-subscribing with the same endpoint updates the existing row.

import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { PUBLIC_VAPID_KEY } from '@/lib/push/vapid';

export async function GET() {
  // Returns the public VAPID key so the client can subscribe.
  return NextResponse.json({
    ok: true,
    publicKey: PUBLIC_VAPID_KEY,
    available: PUBLIC_VAPID_KEY.length > 0,
  });
}

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauth' }, { status: 401 });

  const { endpoint, keys } = await req.json().catch(() => ({}));
  if (typeof endpoint !== 'string' || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ ok: false, error: 'bad_input' }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: session.userId },
    create: { userId: session.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauth' }, { status: 401 });

  const { endpoint } = await req.json().catch(() => ({}));
  if (typeof endpoint !== 'string') {
    return NextResponse.json({ ok: false, error: 'bad_input' }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.userId },
  });
  return NextResponse.json({ ok: true });
}
