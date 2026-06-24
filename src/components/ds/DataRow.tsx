// DataRow — left label + right value, with optional caption + icon + chevron.
//
// The bread-and-butter primitive of every list screen: settings, transactions,
// fund holdings, disclosures. Replaces ad-hoc flex-row patterns sprinkled
// across the codebase.

import { ChevronRight } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';

export interface DataRowProps {
  /** Primary label on the left. */
  label:        string;
  /** Optional secondary line below the label (institution name, date, etc.). */
  caption?:     string;
  /** Right-aligned value. Pass a string for tabular money, or any React node. */
  value?:       ReactNode;
  /** Optional secondary value line below the right value. */
  valueCaption?: ReactNode;
  /** Optional Lucide icon component to render in a circle on the left. */
  icon?:        ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
  /** When true, render a chevron and the row is clickable. */
  href?:        string;
  onClick?:     () => void;
  /** When true, render with red-tinted icon + value for danger actions (sign out, delete). */
  danger?:      boolean;
  /** When true, drop the bottom border (last item in a group). */
  isLast?:      boolean;
}

export function DataRow({
  label,
  caption,
  value,
  valueCaption,
  icon: Icon,
  href,
  onClick,
  danger = false,
  isLast = false,
}: DataRowProps) {
  const isInteractive = Boolean(href || onClick);
  const Tag: 'a' | 'button' | 'div' =
    href ? 'a' : onClick ? 'button' : 'div';

  const body = (
    <>
      {Icon && (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card"
          style={{
            background: danger ? 'rgba(184, 50, 50, 0.10)' : 'var(--ink-100)',
            color:      danger ? 'var(--money-down)'     : 'var(--ink-700)',
          }}
          aria-hidden
        >
          <Icon size={18} strokeWidth={1.75} />
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div
          className="text-[14px] font-semibold leading-tight truncate"
          style={{ color: danger ? 'var(--money-down)' : 'var(--ink-900)' }}
        >
          {label}
        </div>
        {caption && (
          <div className="mt-0.5 text-[12px] truncate" style={{ color: 'var(--ink-500)' }}>
            {caption}
          </div>
        )}
      </div>
      {value !== undefined && (
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <div
            className="num text-[14px] font-bold"
            style={{ color: danger ? 'var(--money-down)' : 'var(--ink-900)' }}
          >
            {value}
          </div>
          {valueCaption && (
            <div className="text-[11px]" style={{ color: 'var(--ink-500)' }}>
              {valueCaption}
            </div>
          )}
        </div>
      )}
      {isInteractive && (
        <ChevronRight
          size={16}
          strokeWidth={1.75}
          aria-hidden
          style={{ color: 'var(--ink-300)' }}
        />
      )}
    </>
  );

  const className = [
    'flex items-center gap-3 px-4 py-3 w-full text-left',
    isInteractive ? 'haptic-press' : '',
    isLast ? '' : 'border-b',
  ].join(' ');

  const style: React.CSSProperties = isLast ? {} : { borderColor: 'var(--ink-100)' };

  if (Tag === 'a') {
    return <a href={href} className={className} style={style}>{body}</a>;
  }
  if (Tag === 'button') {
    return <button onClick={onClick} className={className} style={style}>{body}</button>;
  }
  return <div className={className} style={style}>{body}</div>;
}
