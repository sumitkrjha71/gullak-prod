'use client';

import { useState, useMemo } from 'react';

type Slice = {
  id: string;
  pct: number;
  name: string;
  sub: string;
  color: string;
  icon: string;
  body: string;
};

const DEFAULT_SLICES: Slice[] = [
  {
    id: 'govt',
    pct: 55,
    name: 'Sarkari Bonds',
    sub: 'Government of India',
    body: 'Bharat sarkar ke bonds — sabse safe instrument. Default risk almost zero. Pension funds bhi yahin lagate hain.',
    color: '#0E8C7A',
    icon: '🏛️',
  },
  {
    id: 'gold',
    pct: 25,
    name: 'Digital Sona',
    sub: 'Sovereign Gold Bonds',
    body: 'Asli sone ki value, bina locker tension. Government issued. Tax benefits bhi. Aapke parivaar ne hamesha sona sambhala — ab Gullak sambhalti hai.',
    color: '#D4A017',
    icon: '🪙',
  },
  {
    id: 'aaa',
    pct: 20,
    name: 'AAA-Rated Paper',
    sub: 'Top-rated companies',
    body: 'CRISIL/ICRA ne sabse achi rating di hai. Tata, Reliance, HDFC ke debt instruments. Default risk near-zero.',
    color: '#1A7A4A',
    icon: '📜',
  },
];

type Props = {
  size?: number;
  totalRupees?: number;
  slices?: Slice[];
};

export function InstrumentPie({ size = 220, totalRupees, slices = DEFAULT_SLICES }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [animated, setAnimated] = useState(false);
  // Trigger animation on mount
  useMemo(() => {
    if (typeof window !== 'undefined') {
      setTimeout(() => setAnimated(true), 50);
    }
  }, []);

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const innerR = size * 0.26;
  const fmt = (n: number) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n));

  // Build SVG path for each slice (donut).
  const arcs = useMemo(() => {
    let cumPct = 0;
    return slices.map((s) => {
      const startAngle = (cumPct / 100) * Math.PI * 2 - Math.PI / 2;
      cumPct += s.pct;
      const endAngle = (cumPct / 100) * Math.PI * 2 - Math.PI / 2;

      const x0 = cx + r * Math.cos(startAngle);
      const y0 = cy + r * Math.sin(startAngle);
      const x1 = cx + r * Math.cos(endAngle);
      const y1 = cy + r * Math.sin(endAngle);
      const ix0 = cx + innerR * Math.cos(startAngle);
      const iy0 = cy + innerR * Math.sin(startAngle);
      const ix1 = cx + innerR * Math.cos(endAngle);
      const iy1 = cy + innerR * Math.sin(endAngle);
      const largeArc = s.pct > 50 ? 1 : 0;

      const path = [
        `M ${x0.toFixed(2)} ${y0.toFixed(2)}`,
        `A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${largeArc} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`,
        `L ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
        `A ${innerR.toFixed(2)} ${innerR.toFixed(2)} 0 ${largeArc} 0 ${ix0.toFixed(2)} ${iy0.toFixed(2)}`,
        `Z`,
      ].join(' ');

      // Label position — midpoint of arc, halfway between r and innerR.
      const midAngle = (startAngle + endAngle) / 2;
      const labelR = (r + innerR) / 2;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);

      return { ...s, path, lx, ly };
    });
  }, [slices, cx, cy, r, innerR]);

  const activeSlice = arcs.find((a) => a.id === active);

  return (
    <div
      className="px-4 py-4"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card-lg)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="text-center">
        <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--terracotta)' }}>
          Aapka paisa kahan hai
        </div>
        <p className="mt-0.5 text-[12px]" style={{ color: 'var(--muted)' }}>
          Tap karein — har instrument ka detail dekho
        </p>
      </div>

      <div className="relative mx-auto mt-3" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            opacity: animated ? 1 : 0,
            transform: animated ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.6)',
            transition: 'opacity 0.5s ease, transform 1s var(--ease-bounce)',
          }}
        >
          {arcs.map((a) => {
            const isActive = active === a.id;
            const dim = active && active !== a.id;
            return (
              <g
                key={a.id}
                onClick={() => setActive(active === a.id ? null : a.id)}
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={a.path}
                  fill={a.color}
                  opacity={dim ? 0.4 : 1}
                  style={{
                    transformOrigin: `${cx}px ${cy}px`,
                    transform: isActive ? 'scale(1.04)' : 'scale(1)',
                    transition: 'transform 0.25s ease, opacity 0.25s ease',
                  }}
                />
                <text
                  x={a.lx}
                  y={a.ly + 4}
                  textAnchor="middle"
                  fontSize={size > 200 ? 13 : 11}
                  fontWeight="800"
                  fill="#FFF8F0"
                  pointerEvents="none"
                  style={{
                    opacity: animated ? 1 : 0,
                    transition: 'opacity 0.5s ease 0.7s',
                  }}
                >
                  {a.pct}%
                </text>
              </g>
            );
          })}
          {/* Inner circle white-out for the donut effect */}
          <circle cx={cx} cy={cy} r={innerR - 2} fill="var(--surface)" />
        </svg>

        {/* Center label — total or selected slice */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {activeSlice ? (
              <>
                <div style={{ fontSize: 26 }} aria-hidden>
                  {activeSlice.icon}
                </div>
                <div
                  className="mt-0.5 text-[12px] font-bold leading-tight"
                  style={{ color: activeSlice.color, maxWidth: innerR * 1.5 }}
                >
                  {activeSlice.name}
                </div>
              </>
            ) : (
              <>
                <div className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                  Total
                </div>
                <div className="num text-[16px] font-extrabold" style={{ color: 'var(--text)' }}>
                  {totalRupees != null ? fmt(totalRupees) : '100%'}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Legend with detail expansion */}
      <div className="mt-4 flex flex-col gap-2">
        {arcs.map((a) => {
          const isActive = active === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setActive(active === a.id ? null : a.id)}
              className="haptic-press flex flex-col items-stretch p-3 text-left transition-all"
              style={{
                background: isActive ? `${a.color}10` : 'var(--bg-soft)',
                border: `1.5px solid ${isActive ? a.color : 'var(--border)'}`,
                borderRadius: 'var(--radius-card)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-card"
                  style={{ background: a.color, color: '#FFF8F0', fontSize: 17 }}
                  aria-hidden
                >
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13.5px] font-extrabold" style={{ color: 'var(--text)' }}>
                      {a.name}
                    </span>
                    <span className="num text-[13px] font-extrabold" style={{ color: a.color }}>
                      {a.pct}%
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px]" style={{ color: 'var(--muted)' }}>
                    {a.sub}
                  </div>
                </div>
              </div>
              {isActive && (
                <p
                  className="anim-fade-in mt-2 text-[12px]"
                  style={{ color: 'var(--muted)', lineHeight: 1.55 }}
                >
                  {a.body}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
