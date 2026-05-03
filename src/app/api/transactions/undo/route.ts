import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { undoTransaction } from '@/lib/undo/window';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { transactionId } = await req.json();
  const r = await undoTransaction({ userId: session.userId, transactionId });
  if (!('ok' in r) || !r.ok) return NextResponse.json(r, { status: 400 });
  return NextResponse.json({ ok: true });
}
