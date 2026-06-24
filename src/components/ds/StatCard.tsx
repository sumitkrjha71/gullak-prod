// StatCard — number-hero + label + optional delta chip + optional caption.
//
// Used wherever a single statistic needs to stand alone: profile streak,
// portfolio P&L, Khata score, MF total. Replaces the three-emoji-stat-box
// gamification pattern (🔥 Streak / 🏆 Longest / 💰 Munafa) with sober
// label-above-number typography.

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatCardProps {
  label:      string;             // "Streak", "Munafa", "Score"
  value:      string;             // pre-formatted display string
  /** Optional money + direction. */
  delta?: {
    text: string;                 // pre-formatted, e.g. "+₹420"
    positive: boolean;
  };
  /** Optional secondary line under the value (e.g. "Pichle hafte", "din"). */
  caption?:   string;
  /** Click handler for tappable stats (Khata health, etc.) */
  onClick?:   () => void;
  /** Force a tonal hint — defaults to ink. */
  tone?:      'ink' | 'up' | 'down';
}

export function StatCard({
  label,
  value,
  delta,
  caption,
  onClick,
  tone = 'ink',
}: StatCardProps) {
  const Tag = onClick ? 'button' : 'div';
  const valueColor =
    tone === 'up'   ? 'var(--money-up)' :
    tone === 'down' ? 'var(--money-down)' :
                      'var(--ink-900)';

  return (
    <Tag
      onClick={onClick}
      className={
        'card-elev px-4 py-3 text-left w-full ' +
        (onClick ? 'haptic-press cursor-pointer' : '')
      }
    >
      <div className="text-caption" style={{ fontSize: 10 }}>
        {label}
      </div>
      <div
        className="mt-1 num"
        style={{
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: -0.005,
          color: valueColor,
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>

      {(delta || caption) && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {delta && (
            <span
              className="num inline-flex items-center gap-0.5"
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: delta.positive ? 'var(--money-up)' : 'var(--money-down)',
              }}
            >
              {delta.positive
                ? <ArrowUpRight size={10} strokeWidth={2.25} aria-hidden />
                : <ArrowDownRight size={10} strokeWidth={2.25} aria-hidden />}
              {delta.text}
            </span>
          )}
          {caption && (
            <span style={{ fontSize: 10.5, color: 'var(--ink-500)', fontWeight: 500 }}>
              {caption}
            </span>
          )}
        </div>
      )}
    </Tag>
  );
}
