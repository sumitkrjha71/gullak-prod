// Prisma client. Every query goes through a $use middleware that auto-retries
// on Neon free-tier cold-starts (compute auto-suspends after ~5 min idle).
// This makes every read/write throughout the app survive cold starts without
// each route having to wrap calls itself.

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function isColdStartError(err: unknown): boolean {
  const e = err as { name?: string; code?: string; message?: string };
  if (!e) return false;
  if (e.name === 'PrismaClientInitializationError') return true;
  // P1001 = Can't reach database server, P1017 = Server has closed the connection
  if (e.code === 'P1001' || e.code === 'P1017') return true;
  const msg = String(e.message ?? '');
  return /can't reach database|connection refused|ECONNREFUSED|ETIMEDOUT|server has closed/i.test(msg);
}

function buildClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
  // Cold-start retry: 1.5s, 3s, 4.5s. Total worst-case ~9s for warm-up.
  client.$use(async (params, next) => {
    const delays = [1500, 3000, 4500];
    let lastErr: unknown;
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        return await next(params);
      } catch (err) {
        lastErr = err;
        if (!isColdStartError(err) || attempt === delays.length) {
          throw err;
        }
        const wait = delays[attempt];
        // Use console.warn here (not logger) — logger imports prisma, which would circular.
        console.warn(`[prisma] cold-start retry ${attempt + 1}/${delays.length} for ${params.model}.${params.action} in ${wait}ms`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
    throw lastErr;
  });
  return client;
}

export const prisma = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
