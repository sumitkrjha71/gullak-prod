'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Check, Lock, Building2 } from 'lucide-react';

type Labels = {
  title: string;
  sub: string;
  daily: string;
  freq: string;
  freqVal: string;
  mode: string;
  modeVal: string;
  cancel: string;
  cancelVal: string;
  flowTitle: string;
  bank: string;
  gullak: string;
  agreeTemplate: string;
  cta: string;
  trust: string;
  failure: string;
};

export function MandateScreen({
  locale,
  ruleId,
  labels,
}: {
  locale: string;
  ruleId: string;
  labels: Labels;
}) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // Daily amount from sessionStorage (set by /autopilot/new/amount). Default ₹20.
  const [amount, setAmount] = useState(20);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('gullak_pending_rule');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.dailyRupees === 'number' && parsed.dailyRupees > 0) {
          setAmount(parsed.dailyRupees);
        }
      }
    } catch {
      // ignore — keep ₹20 default
    }
  }, []);
  const agreeText = labels.agreeTemplate.replace(/__AMOUNT__/g, String(amount));

  const flightRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(120);

  useEffect(() => {
    function measure() {
      if (!flightRef.current) return;
      const w = flightRef.current.getBoundingClientRect().width;
      setDistance(Math.max(80, w - 40));
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const authorise = async () => {
    if (loading) return;
    setError(false);
    setLoading(true);
    try {
      const res = await fetch('/api/autopilot/mandate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ruleId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        setError(true);
        setLoading(false);
        return;
      }
      // Cache for the success screen which displays it.
      try {
        const raw = sessionStorage.getItem('gullak_pending_rule');
        const obj = raw ? JSON.parse(raw) : {};
        sessionStorage.setItem(
          'gullak_pending_rule',
          JSON.stringify({ ...obj, mandateAuthorised: true, dailyRupees: amount }),
        );
      } catch {
        // ignore
      }
      router.push(`/${locale}/success?rule=${ruleId}`);
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  return (
    <main
      className="flex min-h-dvh w-full flex-col anim-screen-enter"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/home`}
          aria-label="Back"
          className="haptic-press flex h-9 w-9 items-center justify-center rounded-full hover:bg-border/40"
          style={{ color: 'var(--muted)' }}
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="text-[11px] font-bold" style={{ color: 'var(--trust)' }}>
          100% Safe · RBI
        </span>
        <span className="h-9 w-9" />
      </header>

      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-6 pt-3">
        <div className="text-center">
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{labels.title}</h1>
          <p className="mt-1 text-[13.5px]" style={{ color: 'var(--muted)' }}>
            {labels.sub}
          </p>
        </div>

        {/* Plain-language details card */}
        <div
          className="mt-5 px-4 py-3"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {[
            [labels.daily, `₹${fmt(amount)}`],
            [labels.freq, labels.freqVal],
            [labels.mode, labels.modeVal],
            [labels.cancel, labels.cancelVal],
          ].map(([l, v], i) => (
            <div
              key={l}
              className={`flex items-center justify-between py-2.5 ${i < 3 ? 'border-b' : ''}`}
              style={{ borderColor: 'var(--border-light)' }}
            >
              <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
                {l}
              </span>
              <span className="num text-[14px] font-bold" style={{ color: 'var(--text)' }}>
                {v}
              </span>
            </div>
          ))}
        </div>

        {/* Bank → Chiraiya carries coin → Gullak — proper projectile flight */}
        <div
          className="mt-5 overflow-hidden px-4 py-5 text-center"
          style={{
            background: 'linear-gradient(135deg, var(--bg-highlight), var(--bg))',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card-lg)',
          }}
        >
          <p
            className="mb-3 text-[12.5px] font-bold"
            style={{ color: 'var(--terracotta)', letterSpacing: 0.2 }}
          >
            {labels.flowTitle}
          </p>

          <div className="flex items-center justify-between gap-2">
            {/* Bank — proper SVG-tinted card, not emoji */}
            <div
              className="flex flex-col items-center gap-1 px-3 py-3"
              style={{
                background: 'linear-gradient(180deg, #e6f0ff, #cfdcf5)',
                border: '1px solid #b8c6dd',
                borderRadius: 12,
                minWidth: 64,
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <Building2 size={22} aria-hidden style={{ color: '#1f3a6e' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1f3a6e' }}>{labels.bank}</span>
            </div>

            {/* Flight path */}
            <div
              ref={flightRef}
              className="relative mx-2 h-14 flex-1"
              style={{ ['--carry-distance' as never]: `${distance}px` }}
            >
              <Image
                src="/assets/chiraiya-v2.png"
                alt=""
                width={42}
                height={36}
                style={{
                  width: 42,
                  height: 36,
                  objectFit: 'contain',
                  position: 'absolute',
                  top: 6,
                  left: 0,
                  animation: 'birdProjectile 2.4s ease-in-out infinite',
                  filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.18))',
                }}
              />
              <span
                aria-hidden
                className="absolute"
                style={{
                  top: 18,
                  left: 18,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #f5d442, #D4A017)',
                  border: '1.5px solid #c49a00',
                  animation: 'coinProjectile 2.4s ease-in-out infinite',
                  boxShadow: '0 0 6px rgba(212,160,23,0.6)',
                }}
              />
            </div>

            {/* Gullak — receiver, glowing */}
            <Image
              src="/assets/gullak-pot.png"
              alt=""
              width={72}
              height={62}
              style={{
                width: 72,
                height: 62,
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 16px rgba(212,160,23,0.45)) drop-shadow(0 4px 8px rgba(196, 96, 42, 0.18))',
              }}
            />
          </div>
        </div>

        {/* Agreement checkbox */}
        <button
          onClick={() => setAgreed((a) => !a)}
          className="haptic-press mt-5 flex w-full items-start gap-3 text-left"
          aria-pressed={agreed}
        >
          <span
            className="mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md transition-colors"
            style={{
              border: `2px solid var(--saffron)`,
              background: agreed ? 'var(--saffron)' : 'transparent',
            }}
          >
            {agreed && <Check size={14} className="text-white" />}
          </span>
          <span className="text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {agreeText}
          </span>
        </button>

        {error && (
          <div
            className="mt-4 rounded-card-lg p-3"
            style={{ border: '1px solid rgba(192, 57, 43, 0.25)', background: 'rgba(192, 57, 43, 0.05)' }}
          >
            <p className="text-[13px] font-semibold" style={{ color: 'var(--warn)' }}>
              ⚠ {labels.failure}
            </p>
          </div>
        )}
      </div>

      <div className="safe-bottom mx-auto w-full max-w-md px-6 pb-2 pt-3">
        <button
          onClick={authorise}
          disabled={!agreed || loading}
          className="haptic-press cta-primary flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[16px] font-bold disabled:opacity-40"
        >
          {loading ? '…' : labels.cta} <Check size={16} />
        </button>
        <p
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 text-center text-[11px]"
          style={{ color: 'var(--trust)' }}
        >
          <Lock size={11} aria-hidden /> {labels.trust}
        </p>
      </div>
    </main>
  );
}
