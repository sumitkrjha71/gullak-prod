// Diagnostic endpoint — confirms which env vars + DB connection are live in production.
// Returns ZERO sensitive values, only lengths + boolean states.
// Hit it at /api/debug to see what's actually working in your deploy.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET() {
  const out: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    env: process.env.NODE_ENV,
    vercelRegion: process.env.VERCEL_REGION ?? null,
    vercelDeploymentUrl: process.env.VERCEL_URL ?? null,
    envVars: {
      DATABASE_URL_set: !!process.env.DATABASE_URL,
      DATABASE_URL_starts: process.env.DATABASE_URL?.slice(0, 20) ?? null,
      AUTH_SECRET_set: !!process.env.AUTH_SECRET,
      AUTH_SECRET_len: process.env.AUTH_SECRET?.length ?? 0,
      OTP_DEMO_CODE_raw: process.env.OTP_DEMO_CODE ?? null,
      OTP_DEMO_CODE_len: process.env.OTP_DEMO_CODE?.length ?? 0,
    },
    db: { reachable: false, error: null as string | null, userCount: null as number | null },
  };

  try {
    const userCount = await prisma.user.count();
    out.db = { reachable: true, error: null, userCount };
  } catch (err) {
    out.db = {
      reachable: false,
      error: (err as Error)?.message ?? 'unknown',
      userCount: null,
    };
  }

  return NextResponse.json(out, { status: 200 });
}
