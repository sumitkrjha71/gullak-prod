// Retry wrapper for Neon free-tier cold-starts.
// Compute auto-suspends after ~5 min; first query fails while it wakes up (~2-3s).
// We retry up to 3 times with exponential-ish backoff before surfacing the error.

type PrismaInitError = Error & { name?: string; code?: string };

function isColdStartError(err: unknown): boolean {
  const e = err as PrismaInitError;
  if (!e) return false;
  if (e.name === 'PrismaClientInitializationError') return true;
  // P1001 = Can't reach database server, P1017 = server closed the connection
  if (e.code === 'P1001' || e.code === 'P1017') return true;
  const msg = String(e.message ?? '');
  return /can't reach database|connection refused|ECONNREFUSED|ETIMEDOUT|server has closed/i.test(msg);
}

/**
 * Wraps a Prisma call so Neon cold-starts retry transparently.
 * Retries up to 3 times with delays: 1500ms, 3000ms, 4500ms.
 */
export async function withDbRetry<T>(fn: () => Promise<T>, label = 'db'): Promise<T> {
  const delays = [1500, 3000, 4500];
  let lastErr: unknown;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isColdStartError(err) || attempt === delays.length) {
        throw err;
      }
      const wait = delays[attempt];
      console.warn(`[${label}] cold-start retry ${attempt + 1}/${delays.length} in ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}
