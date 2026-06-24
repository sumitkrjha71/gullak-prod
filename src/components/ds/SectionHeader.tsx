// SectionHeader — uppercase caption + optional right-aligned action link.
//
// Used at the top of every list / data section. Replaces the inline
// `<div className="text-[12px] font-bold uppercase">` patterns sprinkled
// across the codebase.

import type { ReactNode } from 'react';

export interface SectionHeaderProps {
  /** Section caption — short, sober. e.g. "AAPKI JOURNEY", "RECENT ACTIVITY". */
  title:   string;
  /** Optional right-aligned action — typically a "See all →" link. */
  action?: ReactNode;
  /** Optional secondary line below the title for context. */
  sub?:    string;
}

export function SectionHeader({ title, action, sub }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between px-1 mb-2">
      <div className="min-w-0">
        <h2 className="text-caption" style={{ color: 'var(--ink-500)' }}>
          {title}
        </h2>
        {sub && (
          <p className="mt-0.5 text-[12px]" style={{ color: 'var(--ink-500)' }}>
            {sub}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
