'use client';

import { useState, useMemo } from 'react';

type Range = '30d' | '90d' | '365d';

type Props = {
  /** Data points for each range. Each array represents cumulative ₹ value over time. */
  series: {
    saved: { '30d': number[]; '90d': number[]; '365d': number[] };
    munafa: { '30d': number[]; '90d': number[]; '365d': number[] };
    total: { '30d': number[]; '90d': number[]; '365d': number[] };
  };
  labels?: {
    title?: string;
    saved?: string;
    munafa?: string;
    total?: string;
    days30?: string;
    days90?: string;
    days365?: string;
  };
  height?: number;
  /** Compact = dashboard inline view; full = portfolio standalone view */
  variant?: 'compact' | 'full';
};

const DEFAULT_LABELS = {
  title: 'Aapke paise ka safar',
  saved: 'Bachat',
  munafa: 'Munafa',
  total: 'Total',
  days30: '30 din',
  days90: '3 mahine',
  days365: '1 saal',
};

export function MunafaChart({ series, labels = {}, height = 140, variant = 'compact' }: Props) {
  const L = { ...DEFAULT_LABELS, ...labels };
  const [range, setRange] = useState<Range>('30d');
  const [view, setView] = useState<'saved' | 'munafa' | 'total'>('total');

  const data = series[view][range] || [];
  const fmt = (n: number) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n));

  const w = variant === 'full' ? 320 : 280;
  const h = height;
  const padX = 12;
  const padY = 14;

  const path = useMemo(() => {
    if (data.length < 2) return { line: '', fill: '', last: { x: w - padX, y: h - padY }, max: 0, min: 0 };
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const span = max - min || max || 1;
    const stepX = (w - padX * 2) / (data.length - 1);
    const points = data.map((v, i) => ({
      x: padX + i * stepX,
      y: h - padY - ((v - min) / span) * (h - padY * 2),
    }));
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const fill = `${line} L ${(w - padX).toFixed(1)} ${(h - padY).toFixed(1)} L ${padX} ${(h - padY).toFixed(1)} Z`;
    return { line, fill, last: points[points.length - 1], max, min };
  }, [data, w, h]);

  const colors = {
    saved: '#E8650A',
    munafa: '#1A7A4A',
    total: '#0E8C7A',
  };
  const color = colors[view];

  const lastValue = data[data.length - 1] ?? 0;
  const firstValue = data[0] ?? 0;
  const delta = lastValue - firstValue;
  const deltaPct = firstValue > 0 ? ((delta / firstValue) * 100).toFixed(1) : '0.0';

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
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            {L.title}
          </div>
          <div className="num mt-0.5" style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>
            {fmt(lastValue)}
          </div>
          {Math.abs(delta) > 0 && (
            <div
              className="mt-0.5 text-[11px] font-bold"
              style={{ color: delta >= 0 ? 'var(--growth)' : 'var(--warn)' }}
            >
              {delta >= 0 ? '+' : ''}
              {fmt(Math.abs(delta))} ({deltaPct}%)
            </div>
          )}
        </div>
        {/* View toggle (Saved / Munafa / Total) */}
        <div
          className="flex gap-0.5 rounded-pill p-0.5"
          style={{ background: 'var(--bg-soft)' }}
        >
          {(['saved', 'munafa', 'total'] as const).map((v) => {
            const sel = view === v;
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                className="haptic-press rounded-pill px-2.5 py-1 text-[10.5px] font-bold transition-colors"
                style={{
                  background: sel ? colors[v] : 'transparent',
                  color: sel ? '#fff' : 'var(--muted)',
                }}
              >
                {v === 'saved' ? L.saved : v === 'munafa' ? L.munafa : L.total}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG chart */}
      <div className="relative mt-3">
        <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id={`grad-${view}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Subtle grid lines */}
          {[0.25, 0.5, 0.75].map((p) => (
            <line
              key={p}
              x1={padX}
              y1={padY + (h - padY * 2) * p}
              x2={w - padX}
              y2={padY + (h - padY * 2) * p}
              stroke="#E6DDC9"
              strokeWidth={0.5}
              strokeDasharray="2 4"
            />
          ))}

          {data.length >= 2 && (
            <>
              <path d={path.fill} fill={`url(#grad-${view})`} />
              <path
                d={path.line}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 800,
                  strokeDashoffset: 800,
                  animation: 'chartDraw 1.6s ease-out forwards',
                }}
              />
              {/* Dot at last point */}
              <circle
                cx={path.last.x}
                cy={path.last.y}
                r={4}
                fill={color}
                style={{ animation: 'fadeIn 0.5s 1.4s ease-out both' }}
              />
              <circle
                cx={path.last.x}
                cy={path.last.y}
                r={8}
                fill={color}
                opacity={0.18}
                style={{ animation: 'fadeIn 0.6s 1.4s ease-out both' }}
              />
            </>
          )}

          {data.length < 2 && (
            <text
              x={w / 2}
              y={h / 2}
              textAnchor="middle"
              fill="var(--muted-light)"
              fontSize="11"
              fontWeight="600"
            >
              Bachat shuru karein — graph yahan dikhega
            </text>
          )}
        </svg>
      </div>

      {/* Range pills */}
      <div className="mt-3 flex justify-center gap-2">
        {(['30d', '90d', '365d'] as const).map((r) => {
          const sel = range === r;
          return (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="haptic-press rounded-pill px-3 py-1 text-[11px] font-bold transition-colors"
              style={{
                background: sel ? color : 'var(--bg-soft)',
                color: sel ? '#fff' : 'var(--text)',
              }}
            >
              {r === '30d' ? L.days30 : r === '90d' ? L.days90 : L.days365}
            </button>
          );
        })}
      </div>
    </div>
  );
}
