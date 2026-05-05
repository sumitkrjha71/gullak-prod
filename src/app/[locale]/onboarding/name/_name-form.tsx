'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ArrowRight } from 'lucide-react';

export function NameForm({
  locale,
  labels,
}: {
  locale: string;
  labels: { title: string; sub: string; placeholder: string; cta: string; skip: string };
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const submittedRef = useRef(false);

  const submit = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setLoading(true);
    try {
      await fetch('/api/me/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || null, locale }),
      });
      router.push(`/${locale}/onboarding/salary-day`);
    } finally {
      setLoading(false);
    }
  };

  // Friendly greeting toast — appears after pause once name is typed
  useEffect(() => {
    if (name.trim().length >= 2) {
      const t = setTimeout(() => setShowGreeting(true), 600);
      return () => clearTimeout(t);
    }
    setShowGreeting(false);
  }, [name]);

  return (
    <main
      className="flex min-h-dvh w-full flex-col anim-screen-enter"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/onboarding/chiraiya`}
          aria-label="Back"
          className="haptic-press flex h-9 w-9 items-center justify-center rounded-full hover:bg-border/40"
          style={{ color: 'var(--muted)' }}
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="text-[11px] font-bold" style={{ color: 'var(--trust)' }}>100% Safe · RBI</span>
        <span className="h-9 w-9" />
      </header>

      <div className="mx-auto w-full max-w-md flex-1 px-6 pt-6">
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
              animation: showGreeting
                ? 'streakHop 1.2s ease-in-out infinite'
                : 'gentleFloat 3s ease-in-out infinite',
              transform: showGreeting ? 'rotate(-2deg)' : 'rotate(2deg)',
              transition: 'transform 0.4s ease',
              filter: 'drop-shadow(0 6px 14px rgba(196, 96, 42, 0.18))',
            }}
          />
          <h1 className="mt-3" style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>
            {labels.title}
          </h1>
          <p className="mt-1.5 text-[14px]" style={{ color: 'var(--muted)' }}>
            {labels.sub}
          </p>
        </div>

        <div className="mt-8">
          <input
            autoFocus
            autoComplete="given-name"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={labels.placeholder}
            className="w-full px-5 py-4 text-[18px] font-semibold outline-none"
            style={{
              background: 'var(--surface)',
              border: `2px solid ${name.trim().length >= 2 ? 'var(--saffron)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-card-lg)',
              boxShadow: name.length > 0 ? '0 4px 14px rgba(232,101,10,0.08)' : 'var(--shadow-card)',
              color: 'var(--text)',
              transition: 'all 0.2s ease',
            }}
          />

          {showGreeting && (
            <div
              className="anim-fade-in mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
              style={{
                background: 'var(--trust-soft)',
                color: 'var(--trust)',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <span aria-hidden>🙏</span> Namaste, {name.trim().split(' ')[0]}!
            </div>
          )}

          <button
            onClick={submit}
            disabled={name.trim().length < 2 || loading}
            className="haptic-press cta-primary mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[16px] font-bold disabled:opacity-50"
          >
            {loading ? '…' : labels.cta}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </main>
  );
}
