'use client';

import { Trophy, MapPin, TrendingUp } from 'lucide-react';

type Props = {
  rank: number | null;
  scopeKey: string | null; // state code
  totalSavers: number;
  percentile: number;
  savedRupees: number;
};

const STATE_NAMES: Record<string, string> = {
  KA: 'Karnataka', TN: 'Tamil Nadu', KL: 'Kerala', AP: 'Andhra Pradesh',
  TG: 'Telangana', MH: 'Maharashtra', GJ: 'Gujarat', RJ: 'Rajasthan',
  PB: 'Punjab', HR: 'Haryana', UP: 'Uttar Pradesh', BR: 'Bihar',
  WB: 'West Bengal', OR: 'Odisha', AS: 'Assam', JH: 'Jharkhand',
  MP: 'Madhya Pradesh', CG: 'Chhattisgarh', DL: 'Delhi', HP: 'Himachal Pradesh',
  UK: 'Uttarakhand', GA: 'Goa',
};

export function RankCard({ rank, scopeKey, totalSavers, percentile, savedRupees }: Props) {
  if (!rank || !scopeKey) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          background: 'var(--bg-soft)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-card-lg)',
        }}
      >
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: 'var(--bg-highlight)', color: 'var(--saffron)' }}
        >
          <Trophy size={16} />
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>
            Bachat shuru karein → leaderboard pe aayein
          </div>
          <div className="mt-0.5 text-[11.5px]" style={{ color: 'var(--muted)' }}>
            Aapke sheher ke top savers ke saath compete karein
          </div>
        </div>
      </div>
    );
  }

  const stateName = STATE_NAMES[scopeKey] ?? scopeKey;
  const isTop10 = percentile >= 90;
  const isTop25 = percentile >= 75;

  return (
    <div
      className="px-4 py-3.5"
      style={{
        background: isTop10
          ? 'linear-gradient(145deg, #fff5d6, #ffeaae)'
          : isTop25
          ? 'linear-gradient(145deg, #FFE9D2, #FFF5EC)'
          : 'var(--surface)',
        border: `1.5px solid ${isTop10 ? '#D4A017' : isTop25 ? 'var(--saffron)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-card-lg)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
          style={{
            background: isTop10
              ? 'linear-gradient(135deg, #D4A017, #B88C0E)'
              : isTop25
              ? 'linear-gradient(135deg, #E8650A, #C4602A)'
              : 'var(--muted)',
            color: '#fff',
          }}
          aria-hidden
        >
          <Trophy size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
              {stateName} ke top
            </span>
            <span className="num text-[18px] font-extrabold" style={{ color: isTop10 ? '#9a7a00' : 'var(--saffron)' }}>
              {percentile}%
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>mein!</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px]" style={{ color: 'var(--muted)' }}>
            <MapPin size={10} aria-hidden /> Rank #{rank} of <span className="num">{totalSavers}</span> · is mahine
          </div>
        </div>
      </div>

      {isTop10 && (
        <div
          className="mt-3 flex items-center gap-2 rounded-pill px-3 py-1.5 text-[11.5px] font-bold"
          style={{ background: '#fff', color: '#9a7a00' }}
        >
          <TrendingUp size={11} aria-hidden /> Aage badhte raho — Top 5% door nahi 🚀
        </div>
      )}
    </div>
  );
}
