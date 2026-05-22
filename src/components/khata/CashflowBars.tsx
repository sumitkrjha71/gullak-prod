'use client';

import { motion } from 'framer-motion';

export interface CashflowMonth {
  monthKey:     string;   // "2026-04"
  creditPaise:  string;
  debitPaise:   string;
  surplusPaise: string;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function inrCompact(paise: number): string {
  const r = paise / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000)   return `₹${(r / 1000).toFixed(0)}K`;
  return `₹${Math.round(r)}`;
}

export function CashflowBars({ months }: { months: CashflowMonth[] }) {
  if (months.length === 0) return null;

  // Sort chronologically
  const sorted = [...months].sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  // Find max for scale
  const maxPaise = sorted.reduce((m, s) => Math.max(m, parseInt(s.creditPaise, 10), parseInt(s.debitPaise, 10)), 0);

  const BAR_H  = 72;   // max bar height px
  const BAR_W  = 14;   // each bar width
  const GAP    = 3;    // gap between credit/debit pair
  const COL_W  = BAR_W * 2 + GAP + 12; // column width including label spacing

  const totalW = sorted.length * COL_W;

  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <span className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>Pichle mahine</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-2 w-3 rounded-sm" style={{ background: 'var(--trust)' }} />
            <span className="text-[9px] font-semibold" style={{ color: 'var(--muted-light)' }}>Aaya</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-3 rounded-sm" style={{ background: 'var(--saffron)', opacity: 0.7 }} />
            <span className="text-[9px] font-semibold" style={{ color: 'var(--muted-light)' }}>Gaya</span>
          </div>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${totalW} ${BAR_H + 24}`} preserveAspectRatio="xMidYMid meet">
        {sorted.map((m, i) => {
          const credit  = parseInt(m.creditPaise, 10);
          const debit   = parseInt(m.debitPaise, 10);
          const surplus = parseInt(m.surplusPaise, 10);
          const cH = maxPaise > 0 ? (credit / maxPaise) * BAR_H : 0;
          const dH = maxPaise > 0 ? (debit  / maxPaise) * BAR_H : 0;

          const x       = i * COL_W;
          const cX      = x;
          const dX      = x + BAR_W + GAP;
          const [yr, mo] = m.monthKey.split('-').map(Number);
          const monthLabel = MONTH_SHORT[(mo - 1) % 12] ?? '';
          const isCurrentMonth = m.monthKey === sorted[sorted.length - 1]?.monthKey;
          const surplusPositive = surplus >= 0;

          return (
            <g key={m.monthKey}>
              {/* Credit bar */}
              <motion.rect
                x={cX} y={BAR_H - cH} width={BAR_W} height={cH}
                rx={3} ry={3}
                fill={isCurrentMonth ? 'var(--trust)' : 'var(--trust-soft)'}
                stroke={isCurrentMonth ? 'var(--trust)' : 'none'}
                strokeWidth={1}
                initial={{ scaleY: 0, transformOrigin: `0 ${BAR_H}px` }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
              {/* Debit bar */}
              <motion.rect
                x={dX} y={BAR_H - dH} width={BAR_W} height={dH}
                rx={3} ry={3}
                fill={isCurrentMonth ? 'var(--saffron)' : '#f5dcd0'}
                initial={{ scaleY: 0, transformOrigin: `0 ${BAR_H}px` }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.06 + 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
              {/* Surplus dot */}
              {Math.abs(surplus) > 0 && (
                <circle
                  cx={x + BAR_W + GAP / 2}
                  cy={BAR_H - Math.max(cH, dH) - 5}
                  r={3}
                  fill={surplusPositive ? 'var(--growth)' : 'var(--warn)'}
                />
              )}
              {/* Month label */}
              <text
                x={x + BAR_W + GAP / 2}
                y={BAR_H + 14}
                textAnchor="middle"
                fontSize={8}
                fontWeight={isCurrentMonth ? 700 : 500}
                fill={isCurrentMonth ? 'var(--text)' : 'var(--muted-light)'}
              >
                {monthLabel}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Summary strip */}
      {sorted.length > 0 && (() => {
        const last = sorted[sorted.length - 1]!;
        const surplus = parseInt(last.surplusPaise, 10);
        return (
          <div
            className="mt-2 flex items-center justify-between rounded-card px-3 py-2"
            style={{ background: surplus >= 0 ? 'var(--growth-soft)' : '#fef2f1' }}
          >
            <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
              Is mahine bacha
            </span>
            <span
              className="num text-[13px] font-extrabold"
              style={{ color: surplus >= 0 ? 'var(--growth)' : 'var(--warn)' }}
            >
              {surplus >= 0 ? '+' : ''}{inrCompact(surplus)}
            </span>
          </div>
        );
      })()}
    </div>
  );
}
