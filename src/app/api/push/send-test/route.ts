// V5 M11 — POST /api/push/send-test — fires a test push to all of the user's
// subscriptions. For the demo / settings preview.

import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { sendPush } from '@/lib/push/vapid';

export async function POST() {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauth' }, { status: 401 });

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: session.userId },
  });

  if (subs.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'no_subscriptions', hint: 'Pehle subscribe karein, phir test bhejein.' },
      { status: 400 },
    );
  }

  const results = await Promise.all(
    subs.map((s) =>
      sendPush({
        endpoint: s.endpoint,
        p256dh: s.p256dh,
        auth: s.auth,
        payload: {
          title: 'Mubarak ho! 🎉',
          body: 'Aapka Gullak push working hai — abhi se reminders milenge.',
          url: '/',
        },
      }),
    ),
  );

  const ok = results.some((r) => r.ok);
  const reasons = results.filter((r) => !r.ok).map((r) => r.reason).filter(Boolean);

  return NextResponse.json({ ok, fired: subs.length, reasons });
}
