'use client';

import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import type { Festival } from '@/lib/festivals/calendar';
import { festivalDailySaveRupees } from '@/lib/festivals/calendar';

type Props = {
  festival: Festival;
  daysAway: number;
  locale: string;
};

export function FestivalNudge({ festival, daysAway, locale }: Props) {
  const dailySave = festivalDailySaveRupees(festival.defaultTargetRupees, daysAway);
  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  // Build a deep link to goal-creation pre-filled for festival type.
  const createGoalUrl = `/${locale}/goals/new/amount?type=festival`;

  return (
    <Link
      href={createGoalUrl}
      className="haptic-press flex items-center gap-3 px-4 py-3.5"
      style={{
        background: 'linear-gradient(145deg, #fff5d6, #fff0c4)',
        border: '1.5px solid #f0c842',
        borderRadius: 'var(--radius-card-lg)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          background: 'linear-gradient(135deg, #D4A017, #B88C0E)',
          fontSize: 24,
        }}
        aria-hidden
      >
        {festival.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[14px] font-extrabold" style={{ color: 'var(--text)' }}>
            {festival.headline}
          </span>
          <span
            className="num inline-flex items-center gap-0.5 rounded-pill px-1.5 py-0.5 text-[10px] font-bold"
            style={{ background: '#fff', color: '#9a7a00' }}
          >
            <Calendar size={9} aria-hidden />
            {daysAway} din
          </span>
        </div>
        <div className="mt-0.5 text-[12px]" style={{ color: 'var(--muted)', lineHeight: 1.4 }}>
          {festival.sub}
        </div>
        <div className="mt-1 text-[11.5px]" style={{ color: 'var(--text)' }}>
          <span className="num font-extrabold" style={{ color: '#9a7a00' }}>
            ₹{fmt(dailySave)}/din
          </span>
          {' '}
          se{' '}
          <span className="num font-bold">₹{fmt(festival.defaultTargetRupees)}</span>
          {' '}
          ka festival fund pakka
        </div>
      </div>
      <ArrowRight size={16} style={{ color: '#9a7a00' }} aria-hidden />
    </Link>
  );
}
