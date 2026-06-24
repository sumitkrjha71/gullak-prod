'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, ChevronLeft, ArrowRight, Gift } from 'lucide-react';

export function PhoneForm({
  locale,
  demoMode,
  labels,
}: {
  locale: string;
  demoMode: boolean;
  labels: {
    title: string;
    sub: string;
    placeholder: string;
    why: string;
    whyLabel: string;
    send: string;
    sending: string;
    invalid: string;
    demoHint: string;
    sendError: string;
    encrypted: string;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const valid = /^[6-9]\d{9}$/.test(phone);

  // V5 M9 — capture ?ref= referral code from URL on first render. Stash in
  // sessionStorage so the OTP screen can pass it along to verify.
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && /^[A-Z0-9]{4,12}$/i.test(ref)) {
      const upper = ref.toUpperCase();
      setReferralCode(upper);
      try {
        sessionStorage.setItem('gullak_referral_code', upper);
      } catch {
        // ignore
      }
    } else {
      try {
        const stored = sessionStorage.getItem('gullak_referral_code');
        if (stored) setReferralCode(stored);
      } catch {
        // ignore
      }
    }
  }, [searchParams]);

  const submit = async () => {
    setError(null);
    if (!valid) {
      setError(labels.invalid);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.ok === false) {
        // Differentiate: 400 invalid_phone -> "10 digits chahiye"; 429 rate
        // limited / 502 provider_failure -> "phir try karein".
        if (r.status === 400) setError(labels.invalid);
        else                  setError(labels.sendError);
        return;
      }
      router.push(`/${locale}/onboarding/otp?phone=${encodeURIComponent(phone)}`);
    } catch {
      setError(labels.sendError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="flex min-h-dvh w-full flex-col anim-screen-enter"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/savestment`}
          aria-label="Back"
          className="haptic-press flex h-9 w-9 items-center justify-center rounded-full hover:bg-border/40"
          style={{ color: 'var(--muted)' }}
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="text-[11px] font-bold" style={{ color: 'var(--trust)' }}>100% Safe · RBI</span>
        <span className="h-9 w-9" />
      </header>

      <div className="mx-auto w-full max-w-md px-6 pt-6">
        <div className="flex flex-col items-center text-center">
          {/* Chiraiya in 'inviting' pose — gentle wing-tilt */}
          <Image
            src="/assets/chiraiya-v2.png"
            alt=""
            width={92}
            height={76}
            priority
            style={{
              width: 92,
              height: 76,
              objectFit: 'contain',
              transform: 'rotate(-3deg)',
              animation: 'gentleFloat 3s ease-in-out infinite',
              filter: 'drop-shadow(0 6px 14px rgba(196, 96, 42, 0.18))',
            }}
          />
          <h1
            className="mt-3"
            style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2, color: 'var(--text)', letterSpacing: -0.3 }}
          >
            {labels.title}
          </h1>
          <p className="mt-1.5 text-[14.5px]" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
            {labels.sub}
          </p>
        </div>

        <div className="mt-8">
          <div
            className="flex items-center px-4"
            style={{
              background: 'var(--surface-elev)',
              border: `2px solid ${error ? 'var(--money-down)' : phone.length === 10 ? 'var(--ink-900)' : 'var(--ink-100)'}`,
              borderRadius: 'var(--radius-card-lg)',
              boxShadow: phone.length > 0 ? '0 1px 2px rgba(15,17,21,0.04)' : 'none',
              transition: 'border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <span
              className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: 'var(--bg-soft)', color: 'var(--text)', fontWeight: 700, fontSize: 14 }}
            >
              +91
            </span>
            <input
              type="tel"
              autoFocus
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder={labels.placeholder}
              aria-invalid={!!error}
              className="flex-1 bg-transparent py-3.5 text-[18px] font-semibold outline-none num"
              style={{ color: 'var(--text)' }}
            />
          </div>
          {error && (
            <p className="mt-2 text-[12.5px]" style={{ color: 'var(--warn)' }}>
              {error}
            </p>
          )}
          <p className="mt-2 text-[11.5px]" style={{ color: 'var(--muted)' }}>
            <span aria-hidden>🔒 </span>
            {labels.why}
          </p>

          {referralCode && (
            <div
              className="mt-3 flex items-center gap-2 rounded-card-lg px-3 py-2.5"
              style={{ background: 'var(--growth-soft)', border: '1px solid #cfe5d4' }}
            >
              <Gift size={14} style={{ color: 'var(--growth)' }} aria-hidden />
              <span className="text-[12px]" style={{ color: 'var(--text)' }}>
                Referral code <span className="num font-bold" style={{ color: 'var(--growth)' }}>{referralCode}</span> — signup ke baad ₹100 milega!
              </span>
            </div>
          )}

          <button
            onClick={submit}
            disabled={!valid || loading}
            className="haptic-press cta-primary-v2 mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[16px] font-bold transition-opacity disabled:opacity-40"
          >
            {loading ? labels.sending : labels.send}
            {!loading && <ArrowRight size={16} strokeWidth={2} />}
          </button>

          {demoMode && (
            <div
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-pill px-3 py-2 text-[11.5px]"
              style={{ background: 'var(--bg-soft)', color: 'var(--muted)' }}
            >
              <Lock size={11} aria-hidden /> {labels.demoHint}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
