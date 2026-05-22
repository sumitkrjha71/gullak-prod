'use client';

import { motion } from 'framer-motion';

type HealthLabel = 'fragile' | 'building' | 'stable' | 'growing' | 'thriving';

const LABEL_MAP: Record<HealthLabel, { emoji: string; phrase: string; desc: string; color: string; track: string }> = {
  fragile:  { emoji: '⚠️', phrase: 'Dhyan chahiye',      desc: 'Kuch steps lene hain abhi',     color: 'var(--warn)',   track: 'rgba(192,57,43,0.12)'  },
  building: { emoji: '🏗️', phrase: 'Build ho raha hai',  desc: 'Sahi direction mein hai tera',  color: 'var(--saffron)', track: 'rgba(232,101,10,0.12)' },
  stable:   { emoji: '✅', phrase: 'Stable chal raha',   desc: 'Solid footing pe hai tu',        color: 'var(--gold)',   track: 'rgba(212,160,23,0.12)'  },
  growing:  { emoji: '🌱', phrase: 'Growing chal raha',  desc: 'Badiya progress ho rahi hai',   color: 'var(--trust)',  track: 'rgba(14,140,122,0.12)'  },
  thriving: { emoji: '🚀', phrase: 'Mast chal raha!',    desc: 'Top form mein hai teri finance', color: 'var(--growth)', track: 'rgba(26,122,74,0.12)'   },
};

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
            <span style={{ fontSize: 18 }}>{meta.emoji}</span>
            <span className="text-[17px] font-extrabold leading-tight" style={{ color: 'var(--text)' }}>
              {meta.phrase}
            </span>
          </div>
          <p className="text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>
            {meta.desc}
          </p>
          <p className="mt-2 text-[10px] font-semibold" style={{ color: 'var(--muted-light)' }}>
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
        {(['Naaazuk', 'Build', 'Stable', 'Grow', 'Mast'] as const).map((t, i) => (
          <span key={i} className="text-[8px] font-semibold" style={{ color: 'var(--muted-light)' }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
