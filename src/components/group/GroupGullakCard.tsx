'use client';

import Link from 'next/link';
import { Users, ChevronRight } from 'lucide-react';

// Group Gullak entry card — restrained v2.
//
// Previous treatment screamed for attention with pulsing glow + shimmer +
// sparkles + bouncing arrow + NAYA badge. That signalled gacha-game UX in
// a fintech context.
//
// Now: a confident, single-affordance card. The icon, the headline, the
// subtext, and a quiet chevron. No infinite animations. Optional NAYA chip
// kept as a small ink-100 pill (information, not attention-bait).

const MEMBERS = ['👨', '👩', '🧑‍🦱'] as const;

export function GroupGullakCard({ locale }: { locale: string }) {
  return (
    <Link
      href={`/${locale}/group-gullak/new`}
      aria-label="Group Gullak shuru karein"
      className="card-elev haptic-press relative flex items-center gap-3 px-4 py-4"
    >
      {/* Subtle 'Naya' pill — top right, no animation */}
      <span
        className="absolute right-3 top-3 rounded-pill px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
        style={{
          background: 'var(--ink-100)',
          color:      'var(--ink-700)',
          letterSpacing: 0.06,
        }}
      >
        Naya
      </span>

      {/* Icon — saffron accent reserved for this one moment per screen */}
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
        style={{
          background: 'var(--accent)',
          color:      '#FFFFFF',
        }}
        aria-hidden
      >
        <Users size={22} strokeWidth={1.75} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="text-[15.5px] font-extrabold leading-tight" style={{ color: 'var(--ink-900)' }}>
          Group Gullak
        </div>
        <div
          className="mt-0.5 text-[12.5px] leading-tight"
          style={{ color: 'var(--ink-500)', fontWeight: 500 }}
        >
          Saath bachat — saath manzil
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            {MEMBERS.map((emoji, i) => (
              <span
                key={i}
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                style={{
                  background: 'var(--surface-elev)',
                  border:     '1px solid var(--ink-100)',
                }}
                aria-hidden
              >
                {emoji}
              </span>
            ))}
          </div>
          <span
            style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-500)' }}
          >
            Kitty · Trip · Cricket · Festival
          </span>
        </div>
      </div>

      <ChevronRight
        size={18}
        strokeWidth={1.75}
        aria-hidden
        style={{ color: 'var(--ink-300)' }}
      />
    </Link>
  );
}
