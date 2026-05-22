// Shared Upstash Redis client for caching (not rate limiting).
// Returns null when UPSTASH_REDIS_REST_URL is not set — callers must handle gracefully.

import { Redis } from '@upstash/redis';

function buildRedis(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// Singleton — one connection per serverless cold start.
let _client: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (_client === undefined) _client = buildRedis();
  return _client;
}
