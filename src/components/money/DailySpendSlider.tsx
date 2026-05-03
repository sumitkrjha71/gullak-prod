'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';

const METAPHORS: { upTo: number; label: string; emoji: string }[] = [
  { upTo: 15, label: '1 chai', emoji: '☕' },
  { upTo: 30, label: '1 samosa', emoji: '🥟' },
  { upTo: 60, label: '1 dosa', emoji: '🥞' },
  { upTo: 120, label: '1 thali', emoji: '🍱' },
  { upTo: 250, label: '1 movie ticket', emoji: '🎟️' },
  { upTo: 500, label: '1 dinner out', emoji: '🍽️' },
];

function metaphorFor(rupees: number) {
  for (const m of METAPHORS) if (rupees <= m.upTo) return m;
  return METAPHORS[METAPHORS.length - 1];
}

/** Compounding: P × (((1+r)^n − 1) / r) for daily over years × 365 */
function projectFiveYears(rupeesPerDay: number) {
  // Annual rate ~7%, compounded daily.
  const r = 0.07 / 365;
  const n = 365 * 5;
  const fv = rupeesPerDay * (((1 + r) ** n - 1) / r);
  return Math.round(fv);
}

export function DailySpendSlider({
  initial = 30,
  ctaLabel = 'Start your Gullak',
  onCta,
  metaphorLabel = 'roughly',
  fiveYearLabel = 'In 5 years',
  perDay = '/ day',
  bg = 'card',
}: {
  initial?: number;
  ctaLabel?: string;
  onCta?: (rupees: number) => void;
  metaphorLabel?: string;
  fiveYearLabel?: string;
  perDay?: string;
  bg?: 'card' | 'transparent';
}) {
  const [v, setV] = useState(initial);
  const meta = useMemo(() => metaphorFor(v), [v]);
  const fv = useMemo(() => projectFiveYears(v), [v]);
  const fillPct = useMemo(() => Math.min(100, Math.round(((v - 10) / (500 - 10)) * 100)), [v]);

  return (
    <div className={bg === 'card' ? 'card p-5' : ''}>
      {/* Mini Gullak that visually fills as the slider grows */}
      <div className="relative mx-auto h-20 w-24">
        <Image
          src="/assets/gullak-pot.png"
          alt=""
          width={96}
          height={80}
          style={{ width: 96, height: 80, objectFit: 'contain' }}
        />
        {/* Gold "fill" overlay — stacked coins that scale with value */}
        <div
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            bottom: 6,
            width: 40,
            height: 4 + (fillPct / 100) * 28,
            background: 'linear-gradient(180deg, #f5d442, #D4A017)',
            opacity: 0.55,
            transition: 'height 240ms cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>

      <div className="mt-3 text-center">
        <div className="flex items-baseline justify-center gap-1.5 tabular-nums">
          <span className="text-[24px] font-bold text-muted">₹</span>
          <span className="text-[44px] font-extrabold leading-none text-text">
            <CountUp end={v} duration={0.25} preserveValue useEasing={false} />
          </span>
          <span className="text-[13px] font-semibold text-terracotta">{perDay}</span>
        </div>
        <div className="mt-1 inline-flex items-center gap-1 text-[12px] text-muted">
          <span aria-hidden>{meta.emoji}</span>
          <span>{metaphorLabel} {meta.label}</span>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={10}
        max={500}
        step={5}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        className="mt-4 w-full appearance-none"
        style={{
          height: 6,
          background: `linear-gradient(90deg, var(--saffron) 0%, var(--saffron) ${fillPct}%, var(--border) ${fillPct}%, var(--border) 100%)`,
          borderRadius: 999,
          outline: 'none',
          accentColor: 'var(--saffron)',
        }}
        aria-label="Daily save amount"
      />
      <div className="mt-1 flex justify-between text-[10px] text-muted-light">
        <span>₹10</span>
        <span>₹500</span>
      </div>

      {/* 5-year projection */}
      <motion.div
        key={Math.round(fv / 1000)}
        initial={{ opacity: 0.5, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-4 rounded-card-lg p-3.5 text-center"
        style={{ background: 'linear-gradient(135deg, #f0f7e6, #e6f7f4)' }}
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider text-trust">{fiveYearLabel}</div>
        <div className="mt-0.5 flex items-baseline justify-center gap-1 tabular-nums">
          <span className="text-[18px] font-bold text-growth">₹</span>
          <span className="text-[28px] font-extrabold leading-none text-growth">
            <CountUp end={fv} duration={0.3} separator="," preserveValue useEasing={false} />
          </span>
        </div>
        <p className="mt-1 text-[10px] text-muted">* Projected at ~7% in AAA-rated securities</p>
      </motion.div>

      {onCta && (
        <button
          onClick={() => onCta(v)}
          className="haptic-press cta-primary mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-btn text-[15px] font-bold"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
