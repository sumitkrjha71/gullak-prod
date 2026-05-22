'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const REC_COPY: Record<string, { icon: string; title: string }> = {
  adjust_save_amount:  { icon: '⚖️', title: 'Autopilot amount adjust karo' },
  pause_autopilot:     { icon: '⏸️', title: 'Autopilot thodi der ke liye pause karo' },
  resume_autopilot:    { icon: '▶️', title: 'Autopilot resume karo' },
  build_emergency_fund:{ icon: '🛡️', title: 'Emergency fund banana shuru karo' },
  start_sip:           { icon: '📈', title: 'SIP shuru karne ka time aa gaya' },
  increase_sip:        { icon: '🚀', title: 'SIP amount badhao' },
  reduce_sip:          { icon: '📉', title: 'SIP thoda kam karo' },
  allocate_surplus:    { icon: '💰', title: 'Surplus invest karo' },
  debt_paydown:        { icon: '🏦', title: 'Koi EMI preclosure karo' },
};

function inrCompact(paise: string | null): string {
  if (!paise) return '';
  const r = parseInt(paise, 10) / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000)   return `₹${(r / 1000).toFixed(0)}K`;
  return `₹${Math.round(r)}`;
}

export function RecommendationNudge({
  id,
  recType,
  currentValuePaise,
  suggestedValuePaise,
  reasoning,
  confidenceScore,
}: {
  id: string;
  recType: string;
  currentValuePaise: string | null;
  suggestedValuePaise: string | null;
  reasoning: string;
  confidenceScore: number;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const router = useRouter();
  const copy = REC_COPY[recType] ?? { icon: '💡', title: 'Ek suggestion hai' };

  async function act(action: 'accept' | 'snooze') {
    setStatus('loading');
    await fetch(`/api/recommendations/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, snoozeDays: 7 }),
    });
    setStatus('done');
    if (action === 'accept') router.refresh();
  }

  if (status === 'done') return null;

  return (
    <div
      className="card p-4 relative overflow-hidden"
      style={{ borderColor: 'var(--saffron)', borderWidth: 1.5 }}
    >
      {/* Confidence badge */}
      <div
        className="absolute top-3 right-3 rounded-pill px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide"
        style={{ background: 'var(--bg-soft)', color: 'var(--muted-light)' }}
      >
        {confidenceScore}% sure
      </div>

      <div className="flex items-start gap-3 pr-14">
        <span style={{ fontSize: 22 }}>{copy.icon}</span>
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider mb-0.5" style={{ color: 'var(--saffron)' }}>
            Aaj ka Nudge
          </p>
          <p className="text-[14px] font-bold leading-snug" style={{ color: 'var(--text)' }}>
            {copy.title}
          </p>
        </div>
      </div>

      {/* Amount change chip */}
      {suggestedValuePaise && (
        <div className="flex items-center gap-2 mt-3 ml-9">
          {currentValuePaise && (
            <>
              <span className="num text-[13px] font-bold line-through" style={{ color: 'var(--muted-light)' }}>
                {inrCompact(currentValuePaise)}
              </span>
              <span style={{ color: 'var(--muted-light)', fontSize: 12 }}>→</span>
            </>
          )}
          <span
            className="num text-[15px] font-extrabold"
            style={{ color: 'var(--growth)' }}
          >
            {inrCompact(suggestedValuePaise)}
          </span>
        </div>
      )}

      {/* Reasoning */}
      <p className="mt-2 ml-9 text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        {reasoning}
      </p>

      {/* CTAs */}
      <div className="mt-3 ml-9 flex items-center gap-2">
        <button
          disabled={status === 'loading'}
          onClick={() => act('accept')}
          className="haptic-press cta-primary rounded-btn px-4 py-2 text-[12px] font-extrabold"
        >
          {status === 'loading' ? '...' : 'Theek hai! ✅'}
        </button>
        <button
          disabled={status === 'loading'}
          onClick={() => act('snooze')}
          className="haptic-press rounded-btn px-4 py-2 text-[12px] font-semibold"
          style={{ background: 'var(--bg-soft)', color: 'var(--muted)' }}
        >
          Baad mein 🔕
        </button>
      </div>
    </div>
  );
}
