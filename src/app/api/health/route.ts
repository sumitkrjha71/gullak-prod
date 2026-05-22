import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET() {
  const start = Date.now();
  let dbOk = false;
  let dbLatencyMs = -1;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
    dbOk = true;
  } catch {
    dbLatencyMs = Date.now() - start;
  }

  const status = dbOk ? 200 : 503;
  return NextResponse.json(
    {
      ok: dbOk,
      db: { ok: dbOk, latencyMs: dbLatencyMs },
      version: process.env.npm_package_version ?? 'unknown',
      env: process.env.NODE_ENV,
      ts: new Date().toISOString(),
    },
    { status },
  );
}
