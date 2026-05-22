import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { applyRecommendationAction } from '@/lib/khata/recommendations';
import { onRecommendationAccepted } from '@/lib/khata/pipeline';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json();
  const action = body?.action;
  if (!['accept', 'reject', 'snooze'].includes(action)) {
    return NextResponse.json({ ok: false, error: 'action must be accept|reject|snooze' }, { status: 400 });
  }

  const snoozeDays = typeof body.snoozeDays === 'number' ? body.snoozeDays : 7;

  try {
    await applyRecommendationAction(session.userId, params.id, action, snoozeDays);

    if (action === 'accept') {
      await onRecommendationAccepted(session.userId);
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'failed';
    const status = msg === 'rec_not_found' ? 404 : msg === 'rec_not_actionable' ? 409 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
