'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Flame } from 'lucide-react';
import { tierForStreak, nextTier, daysToNextTier, tierProgressPct, TIERS } from '@/lib/streaks/tiers';
import { UnlockModal } from './UnlockModal';

const SEEN_TIER_KEY = 'gullak_seen_tier_v1';

export function TierCard({ streakDays }: { streakDays: number }) {
  const t = useTranslations('tiers');
  const cur = tierForStreak(streakDays);
  const next = nextTier(streakDays);
  const progressPct = tierProgressPct(streakDays);
  const daysLeft = daysToNextTier(streakDays);

  // Tier-up celebration: when current tier > last-seen tier, show modal once.
  const [unlockedTierId, setUnlockedTierId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(SEEN_TIER_KEY) || 'beginner';
      if (cur.id !== seen) {
        const seenIdx = TIERS.findIndex((x) => x.id === seen);
        const curIdx = TIERS.findIndex((x) => x.id === cur.id);
        if (curIdx > seenIdx) setUnlockedTierId(cur.id);
        // Save the highest seen so we never re-celebrate on regression
        if (curIdx > seenIdx) {
          window.localStorage.setItem(SEEN_TIER_KEY, cur.id);
        }
      }
    } catch {
      // localStorage unavailable — silent
    }
  }, [cur.id]);

  return (
    <>
      <div
        className="px-4 py-3.5"
        style={{
          background: cur.bg,
          border: `1.5px solid ${cur.color}33`,
          borderRadius: 'var(--radius-card-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: '#fff', fontSize: 24 }}
            aria-hidden
          >
            {cur.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                {t(cur.id + '.name' as never)}
              </span>
              {streakDays > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold"
                  style={{ color: 'var(--saffron)' }}
                >
                  <Flame size={11} aria-hidden />
                  <span className="num">{streakDays}</span>
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[11.5px]" style={{ color: 'var(--muted)' }}>
              {next ? (
                <>
                  <span className="num font-bold" style={{ color: cur.color }}>
                    {daysLeft}
                  </span>{' '}
                  din aur — phir <span style={{ fontWeight: 700 }}>{t(next.id + '.name' as never)}</span> 🚀
                </>
              ) : (
                <span style={{ fontWeight: 700, color: cur.color }}>Sabse oonche tier mein! 🌟</span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {next && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
            <div
              className="h-full transition-all"
              style={{
                width: `${progressPct}%`,
                background: cur.color,
              }}
            />
          </div>
        )}
      </div>

      {unlockedTierId && (
        <UnlockModal
          tierId={unlockedTierId}
          onClose={() => setUnlockedTierId(null)}
        />
      )}
    </>
  );
}
