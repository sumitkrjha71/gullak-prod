// Gold price cache backed by Upstash Redis.
// TTL: 60 seconds — balances API quota with freshness.
// Falls back to SafeGold API on cache miss; falls back to mock price if Redis absent.

import { getRedis } from '@/lib/redis';
import { fetchLiveGoldPrice, MOCK_BUY_PAISE_PER_GRAM, MOCK_SELL_PAISE_PER_GRAM } from './safegold';
import type { GoldPrice } from './safegold';

const CACHE_KEY = 'gold:price:live';
const CACHE_TTL = 60; // seconds

type CachedPrice = {
  buyPaisePerGram:  string; // BigInt serialised as string for JSON
  sellPaisePerGram: string;
  fetchedAt:        string;
};

export async function getGoldPrice(): Promise<GoldPrice> {
  const redis = getRedis();

  // 1. Try cache
  if (redis) {
    try {
      const cached = await redis.get<CachedPrice>(CACHE_KEY);
      if (cached) {
        return {
          buyPaisePerGram:  BigInt(cached.buyPaisePerGram),
          sellPaisePerGram: BigInt(cached.sellPaisePerGram),
          fetchedAt:        cached.fetchedAt,
        };
      }
    } catch {
      // Redis error — fall through to live fetch
    }
  }

  // 2. Cache miss → fetch live price
  let price: GoldPrice;
  try {
    price = await fetchLiveGoldPrice();
  } catch {
    // API error in real mode — serve stale mock to avoid hard failure
    price = {
      buyPaisePerGram:  MOCK_BUY_PAISE_PER_GRAM,
      sellPaisePerGram: MOCK_SELL_PAISE_PER_GRAM,
      fetchedAt:        new Date().toISOString(),
    };
  }

  // 3. Store in cache (best-effort, never throw)
  if (redis) {
    try {
      const payload: CachedPrice = {
        buyPaisePerGram:  price.buyPaisePerGram.toString(),
        sellPaisePerGram: price.sellPaisePerGram.toString(),
        fetchedAt:        price.fetchedAt,
      };
      await redis.set(CACHE_KEY, payload, { ex: CACHE_TTL });
    } catch {
      // Ignore cache write errors
    }
  }

  return price;
}
