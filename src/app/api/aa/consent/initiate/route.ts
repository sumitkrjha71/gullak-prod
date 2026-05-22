import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { initiateConsent, SUPPORTED_FIPS } from '@/lib/aa/consent';
import { initKhataPipeline } from '@/lib/khata/pipeline';

initKhataPipeline();

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { fipIds } = await req.json();
  if (!Array.isArray(fipIds) || fipIds.length === 0) {
    return NextResponse.json({ ok: false, error: 'fipIds_required' }, { status: 400 });
  }

  const validFips = new Set(SUPPORTED_FIPS.map(f => f.id));
  for (const id of fipIds) {
    if (typeof id !== 'string' || !validFips.has(id)) {
      return NextResponse.json({ ok: false, error: `unsupported_fip: ${id}` }, { status: 400 });
    }
  }

  try {
    const result = await initiateConsent(session.userId, fipIds);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}
