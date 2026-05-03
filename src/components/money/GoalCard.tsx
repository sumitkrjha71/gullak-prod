'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { AmountDisplay } from './AmountDisplay';
import { progressPct, remainingPaise } from '@/lib/goals/math';

export function GoalCard({
  href,
  title,
  savedPaise,
  targetPaise,
  munafaPaise,
  remainingLabel,
}: {
  href: string;
  title: string;
  savedPaise: number | bigint;
  targetPaise: number | bigint;
  munafaPaise: number | bigint;
  remainingLabel: string;
}) {
  const pct = progressPct(savedPaise, targetPaise);
  const rem = remainingPaise(savedPaise, targetPaise);
  return (
    <Link href={href} className="card haptic-press flex items-center gap-4 p-4 hover:bg-divider/10 transition-colors">
      <ProgressRing pct={pct} size={64} stroke={6} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-[15px] font-semibold text-text">{title}</span>
          <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <AmountDisplay paise={savedPaise} size="md" animate={false} />
        </div>
        <div className="mt-0.5 text-[12px] text-muted money">
          {remainingLabel}: <span className="text-text">₹{new Intl.NumberFormat('en-IN').format(Math.round(rem / 100))}</span>
        </div>
      </div>
    </Link>
  );
}
