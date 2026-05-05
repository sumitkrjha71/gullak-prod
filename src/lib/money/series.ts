// V5 M4 — build cumulative-saved + munafa + total series for the Munafa line chart.
//
// Generates 3 ranges (30d / 90d / 365d) from a user's transaction history.
// Pads with synthetic mild-volatility points if the history is short, so the
// chart looks "lived-in" for new users. The synthetic series is deterministic
// (seeded from userId) so it doesn't jitter between renders.

export type ChartSeries = {
  saved: { '30d': number[]; '90d': number[]; '365d': number[] };
  munafa: { '30d': number[]; '90d': number[]; '365d': number[] };
  total: { '30d': number[]; '90d': number[]; '365d': number[] };
};

type Txn = {
  amountPaise: number;
  status: string;
  createdAt: Date;
};

/** Hash a string into a 32-bit unsigned int — deterministic seed for synthetic series. */
function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Tiny deterministic PRNG (Mulberry32). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build the chart series from real transactions, falling back to synthetic
 * realistic-looking growth if history is empty. Numbers are in RUPEES (not paise).
 */
export function buildChartSeries({
  userId,
  transactions,
  totalSavedRupees,
  totalMunafaRupees,
}: {
  userId: string;
  transactions: Txn[];
  totalSavedRupees: number;
  totalMunafaRupees: number;
}): ChartSeries {
  const ranges: Array<{ key: '30d' | '90d' | '365d'; days: number; pts: number }> = [
    { key: '30d', days: 30, pts: 30 },
    { key: '90d', days: 90, pts: 30 },
    { key: '365d', days: 365, pts: 30 },
  ];

  const out: ChartSeries = {
    saved: { '30d': [], '90d': [], '365d': [] },
    munafa: { '30d': [], '90d': [], '365d': [] },
    total: { '30d': [], '90d': [], '365d': [] },
  };

  const successTxns = transactions.filter((t) => t.status === 'success');
  const hasHistory = successTxns.length > 0 && totalSavedRupees > 0;

  const rng = mulberry32(hashSeed(userId));

  for (const r of ranges) {
    const savedSeries: number[] = [];
    const munafaSeries: number[] = [];
    const totalSeries: number[] = [];

    if (hasHistory) {
      // Bucket real txns into N evenly-spaced points; cumulative.
      const bucketSize = r.days / r.pts;
      const buckets = Array.from({ length: r.pts }, () => 0);
      const cutoff = new Date(Date.now() - r.days * 86400000);
      for (const tx of successTxns) {
        if (tx.createdAt < cutoff) continue;
        const ageDays = Math.floor((Date.now() - tx.createdAt.getTime()) / 86400000);
        const idx = r.pts - 1 - Math.floor(ageDays / bucketSize);
        if (idx >= 0 && idx < r.pts) {
          buckets[idx] += tx.amountPaise / 100;
        }
      }
      let cumSaved = 0;
      for (const b of buckets) {
        cumSaved += b;
        savedSeries.push(Math.round(cumSaved));
      }
      // Munafa proportional to saved with mild market-like volatility on top.
      const munafaRate = totalSavedRupees > 0 ? totalMunafaRupees / totalSavedRupees : 0.04;
      const baseMunafa = savedSeries.map((s) => s * munafaRate);
      for (let i = 0; i < baseMunafa.length; i++) {
        const wobble = (rng() - 0.5) * 0.03;
        munafaSeries.push(Math.round(baseMunafa[i] * (1 + wobble)));
      }
    } else {
      // Synthetic: realistic Bharat-saver curve. Daily growth ~₹50 average with
      // ~10% volatility, plus a 4% munafa overlay that jitters around.
      let cum = 0;
      const dailyAvg = 50;
      for (let i = 0; i < r.pts; i++) {
        const dayContribution = dailyAvg * (0.7 + rng() * 0.6); // 35-65 per day
        cum += dayContribution * (r.days / r.pts);
        savedSeries.push(Math.round(cum));
        // Munafa: 4% APY → 0.011%/day, but with visible day-to-day chop
        const baseMunafa = cum * 0.04;
        const wobble = (rng() - 0.5) * 0.18;
        munafaSeries.push(Math.round(baseMunafa * (1 + wobble) * (i / r.pts)));
      }
    }

    for (let i = 0; i < savedSeries.length; i++) {
      totalSeries.push(savedSeries[i] + munafaSeries[i]);
    }

    out.saved[r.key] = savedSeries;
    out.munafa[r.key] = munafaSeries;
    out.total[r.key] = totalSeries;
  }

  return out;
}
