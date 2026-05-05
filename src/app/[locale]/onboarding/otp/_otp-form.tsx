'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Lock, ArrowRight, Sparkles } from 'lucide-react';

const DEMO_OTP = '123456';

export function OtpForm({
  locale,
  phone,
  labels,
}: {
  locale: string;
  phone: string;
  labels: {
    title: string;
    sub: string;
    demoHint: string;
    verify: string;
    verifying: string;
    wrong: string;
    why: string;
    whyLabel: string;
    resend: string;
    encrypted: string;
  };
}) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const submittedRef = useRef(false);
  const valid = /^\d{6}$/.test(code);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const submit = async (codeOverride?: string) => {
    const finalCode = codeOverride ?? code;
    if (!/^\d{6}$/.test(finalCode) || submittedRef.current) return;
    submittedRef.current = true;
    setError(null);
    setLoading(true);
    // V5 M9 — pass-through referral code captured by phone form
    let referralCode: string | null = null;
    try {
      referralCode = sessionStorage.getItem('gullak_referral_code');
    } catch {
      // ignore
    }
    try {
      const r = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone, code: finalCode, locale, referralCode }),
      });
      let j: { ok?: boolean } = {};
      try { j = await r.json(); } catch { /* non-JSON response */ }
      if (!r.ok || !j.ok) {
        setError(labels.wrong);
        setCode('');
        submittedRef.current = false;
        return;
      }
      // Fire-and-forget DB warm-up so Neon is awake by the time the next page
      // loads. We don't await — the navigation should happen immediately.
      try { fetch('/api/db/warm', { method: 'GET' }); } catch { /* ignore */ }
      router.push(`/${locale}/onboarding/name`);
    } catch {
      setError(labels.wrong);
      setCode('');
      submittedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && !loading && !submittedRef.current) {
      const t = setTimeout(() => submit(code), 250);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <main
      className="flex min-h-dvh w-full flex-col anim-screen-enter"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/onboarding/phone`}
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
              animation: loading ? 'streakHop 0.9s ease-in-out infinite' : 'gentleFloat 3s ease-in-out infinite',
              filter: 'drop-shadow(0 6px 14px rgba(196, 96, 42, 0.18))',
            }}
          />
          <h1 className="mt-3" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
            {labels.title}
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--muted)' }}>
            {labels.sub} <span className="num font-semibold">+91 {phone}</span>
          </p>
        </div>

        <div className="mt-6">
          {/* DEMO OTP BANNER — prominent, click-to-fill */}
          <button
            type="button"
            onClick={() => {
              setCode(DEMO_OTP);
              setError(null);
            }}
            disabled={loading}
            className="haptic-press mb-4 flex w-full items-center gap-3 px-4 py-3 text-left transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(145deg, #FFF5EC, #FFE9D2)',
              border: '2px dashed var(--saffron)',
              borderRadius: 'var(--radius-card-lg)',
            }}
          >
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
              style={{ background: 'var(--saffron)', color: '#fff' }}
              aria-hidden
            >
              <Sparkles size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--saffron)' }}>
                Demo OTP — Tap to fill
              </div>
              <div className="num mt-0.5 text-[20px] font-extrabold tracking-[0.4em]" style={{ color: 'var(--text)' }}>
                {DEMO_OTP}
              </div>
            </div>
            <ArrowRight size={18} style={{ color: 'var(--saffron)' }} aria-hidden />
          </button>

          <div
            className="px-4"
            style={{
              background: 'var(--surface)',
              border: `2px solid ${error ? 'var(--warn)' : code.length === 6 ? 'var(--growth)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-card-lg)',
              boxShadow: code.length > 0 ? '0 4px 14px rgba(26,122,74,0.08)' : 'var(--shadow-card)',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="● ● ● ● ● ●"
              aria-invalid={!!error}
              className="num w-full bg-transparent py-3.5 text-center text-[24px] font-extrabold tracking-[0.5em] outline-none"
              style={{ color: 'var(--text)' }}
            />
          </div>
          {error && (
            <p className="mt-2 text-center text-[12.5px]" style={{ color: 'var(--warn)' }}>
              {error}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between text-[12px]" style={{ color: 'var(--muted)' }}>
            <span className="inline-flex items-center gap-1">
              <Lock size={11} aria-hidden /> Demo OTP: <span className="num font-bold">{DEMO_OTP}</span>
            </span>
            <button
              type="button"
              onClick={() => setResendTimer(30)}
              disabled={resendTimer > 0}
              className="font-semibold disabled:opacity-50"
              style={{ color: 'var(--saffron)' }}
            >
              {labels.resend}
              {resendTimer > 0 && <span className="num"> ({resendTimer}s)</span>}
            </button>
          </div>

          <button
            onClick={() => submit()}
            disabled={!valid || loading}
            className="haptic-press cta-primary mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[16px] font-bold disabled:opacity-50"
          >
            {loading ? labels.verifying : labels.verify}
            {!loading && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </main>
  );
}
