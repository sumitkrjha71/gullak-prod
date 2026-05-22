'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const FIPS = [
  { id: 'MOCK_HDFC',  name: 'HDFC Bank',           icon: '🏦' },
  { id: 'MOCK_ICICI', name: 'ICICI Bank',           icon: '🏛️' },
  { id: 'MOCK_SBI',   name: 'State Bank of India',  icon: '🏦' },
];

const TRUST_CHIPS = [
  { icon: '🔒', text: 'RBI regulated AA framework' },
  { icon: '🚫', text: 'Data kabhi bhi sell nahi hoga' },
  { icon: '↩️',  text: 'Kabhi bhi disconnect karo' },
];

// Sample blurred insight previews to create FOMO
const SAMPLE_INSIGHTS = [
  { icon: '💡', text: '₹22K bacha raha hai — Gullak mein daalo' },
  { icon: '⚠️', text: 'EMI thoda high hai — FOIR 43%' },
  { icon: '🎉', text: 'Regular saving chal rahi hai — 80% months' },
];

export function BankConnectPrompt({ locale }: { locale: string }) {
  const [step, setStep]       = useState<'intro' | 'pick'>('intro');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError]     = useState('');
  const router                = useRouter();

  async function connect(fipId: string) {
    setLoading(fipId);
    setError('');
    try {
      const res = await fetch('/api/aa/consent/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fipIds: [fipId] }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed');
      // Mock mode: immediately done — refresh to show data
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Kuch gadbad ho gayi, dobara try karo');
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Teaser: blurred sample insights */}
      <div className="relative rounded-card-lg overflow-hidden" style={{ background: 'var(--surface)' }}>
        <div className="p-4 space-y-2.5">
          {SAMPLE_INSIGHTS.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-card p-3"
              style={{
                background: 'var(--bg-soft)',
                filter: 'blur(4px)',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{s.text}</span>
            </div>
          ))}
        </div>

        {/* Overlay CTA */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
          style={{ background: 'rgba(255,248,240,0.85)', backdropFilter: 'blur(2px)' }}
        >
          <span style={{ fontSize: 36 }}>📒</span>
          <p className="text-[17px] font-extrabold leading-snug" style={{ color: 'var(--text)' }}>
            Apni financial picture dekho
          </p>
          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Bank connect karo — hum dikhayenge paisa kahan jaata hai, kitna bacha sakta hai, aur kya fix karna chahiye.
          </p>
          <button
            onClick={() => setStep('pick')}
            className="haptic-press cta-primary rounded-btn px-6 py-2.5 text-[13px] font-extrabold mt-1"
          >
            Bank connect karo 🔗
          </button>
        </div>
      </div>

      {/* Trust chips */}
      <div className="flex flex-wrap gap-2 justify-center">
        {TRUST_CHIPS.map((c) => (
          <div
            key={c.text}
            className="flex items-center gap-1.5 rounded-pill px-3 py-1.5"
            style={{ background: 'var(--trust-soft)', border: '1px solid rgba(14,140,122,0.15)' }}
          >
            <span style={{ fontSize: 12 }}>{c.icon}</span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--trust)' }}>{c.text}</span>
          </div>
        ))}
      </div>

      {/* FIP picker sheet */}
      {step === 'pick' && (
        <div className="card p-4 space-y-3 anim-slide-up">
          <p className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>
            Kaunsa bank connect karein?
          </p>
          {FIPS.map((f) => (
            <button
              key={f.id}
              disabled={!!loading}
              onClick={() => connect(f.id)}
              className="haptic-press w-full flex items-center gap-3 rounded-card p-3 text-left transition-colors"
              style={{
                background: loading === f.id ? 'var(--trust-soft)' : 'var(--bg-soft)',
                border: `1px solid ${loading === f.id ? 'var(--trust)' : 'var(--border)'}`,
              }}
            >
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <span className="flex-1 text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                {f.name}
              </span>
              {loading === f.id ? (
                <span className="text-[11px] font-semibold" style={{ color: 'var(--trust)' }}>Connect ho raha...</span>
              ) : (
                <span style={{ color: 'var(--muted-light)', fontSize: 16 }}>→</span>
              )}
            </button>
          ))}
          <button
            onClick={() => setStep('intro')}
            className="w-full text-center text-[11px] font-semibold pt-1"
            style={{ color: 'var(--muted-light)' }}
          >
            Wapas jaao
          </button>
          {error && (
            <p className="text-[11px] text-center" style={{ color: 'var(--warn)' }}>{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
