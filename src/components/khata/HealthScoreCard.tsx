'use client';

import { motion } from 'framer-motion';
import { AlertCircle, Wrench, CheckCircle2, TrendingUp, Sparkles, type LucideIcon } from 'lucide-react';

type HealthLabel = 'fragile' | 'building' | 'stable' | 'growing' | 'thriving';

// v2 sober label map — Lucide icons + Hinglish dost copy that doesn't
// patronise. Charter Commandment 2: warm voice, mature visual.
const LABEL_MAP: Record<HealthLabel, { icon: LucideIcon; phrase: string; desc: string; color: string; track: string }> = {
  fragile:  { icon: AlertCircle,  phrase: 'Stabilise karna hai',  desc: 'Chhote chhote steps se shuru karte hain — milke',  color: 'var(--money-down)', track: 'rgba(184, 50, 50, 0.10)'  },
  building: { icon: Wrench,       phrase: 'Foundation ban rahi',  desc: 'Sahi raasta pakda hai — bas regular rakho',         color: 'var(--accent)',     track: 'rgba(232, 101, 10, 0.10)' },
  stable:   { icon: CheckCircle2, phrase: 'Solid chal raha',       desc: 'Steady ground pe ho — ab thoda aur push karein',    color: 'var(--gold)',       track: 'rgba(212, 160, 23, 0.10)' },
  growing:  { icon: TrendingUp,   phrase: 'Growth pakda hai',      desc: 'Numbers improve ho rahe — ek aur step aur top form',color: 'var(--trust)',      track: 'rgba(14, 140, 122, 0.10)' },
  thriving: { icon: Sparkles,     phrase: 'Strong position mein',  desc: 'Sab disciplined hai — ab SIP badhane ka time',      color: 'var(--money-up)',   track: 'rgba(11, 122, 69, 0.10)'  },
};

const BAND_LABELS = ['Risky', 'Build', 'Stable', 'Grow', 'Strong'] as const;

export function HealthScoreCard({
  score,
  label,
  monthsCovered,
  dataAsOf,
}: {
  score: number;
  label: HealthLabel;
  monthsCovered: number;
  dataAsOf: string | null;
}) {
  const meta    = LABEL_MAP[label] ?? LABEL_MAP.building;
  const size    = 108;
  const stroke  = 9;
  const radius  = (size - stroke) / 2;
  const circ    = 2 * Math.PI * radius;
  const offset  = circ - (score / 100) * circ;

  return (
    <div className="card p-4">
      <div className="flex items-center gap-4">
        {/* Score ring */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke={meta.track} strokeWidth={stroke}
            />
            <motion.circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke={meta.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="num text-[22px] font-extrabold leading-none" style={{ color: meta.color }}>
              {score}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'var(--muted-light)' }}>
              /100
            </span>
          </div>
        </div>

        {/* Label + desc */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <meta.icon size={18} strokeWidth={1.75} aria-hidden style={{ color: meta.color }} />
            <span className="text-[17px] font-extrabold leading-tight" style={{ color: 'var(--ink-900)' }}>
              {meta.phrase}
            </span>
          </div>
          <p className="text-[12.5px] leading-snug" style={{ color: 'var(--ink-700)' }}>
            {meta.desc}
          </p>
          <p className="mt-2 text-[10px] font-semibold" style={{ color: 'var(--ink-500)' }}>
            Pichle {monthsCovered} mahino ka data
            {dataAsOf && (
              <> · {new Date(dataAsOf).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</>
            )}
          </p>
        </div>
      </div>

      {/* Score band strip */}
      <div className="mt-3 flex rounded-full overflow-hidden h-1.5">
        {(['fragile', 'building', 'stable', 'growing', 'thriving'] as HealthLabel[]).map((l) => (
          <div
            key={l}
            className="flex-1 transition-all duration-300"
            style={{ background: l === label ? meta.color : LABEL_MAP[l].track }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between px-0.5">
        {BAND_LABELS.map((t, i) => (
          <span key={i} className="text-[8.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
