'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  locales,
  localeLabels,
  localeGreetings,
  localeNativeNames,
  type Locale,
} from '@/lib/i18n/config';

const ENGLISH_NAMES: Record<Locale, string> = {
  en: 'English',
  hi: 'Hindi',
  pa: 'Punjabi',
  kn: 'Kannada',
  mr: 'Marathi',
};

export function LanguageSelectScreen({
  currentLocale,
  labels,
}: {
  currentLocale: string;
  labels: { title: string; sub: string; continue: string };
}) {
  // First-launch policy: default selection is en or hi only. If the URL locale
  // is something else (pa/kn/mr), fall back to 'en' — user can still pick any
  // language explicitly from the list below.
  const initialPick: Locale =
    currentLocale === 'hi' ? 'hi' : 'en';
  const [picked, setPicked] = useState<Locale>(initialPick);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  function handleContinue() {
    setSubmitting(true);
    document.cookie = `NEXT_LOCALE=${picked}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.push(`/${picked}/savestment`);
  }

  return (
    <main
      className="relative flex min-h-dvh w-full flex-col items-center px-5 anim-screen-enter"
      style={{ background: 'var(--bg)' }}
    >
      {/* Floating Chiraiya at top */}
      <div className="mt-8 flex w-full justify-center">
        <Image
          src="/assets/chiraiya-v2.png"
          alt=""
          width={88}
          height={72}
          priority
          style={{
            width: 88,
            height: 72,
            objectFit: 'contain',
            animation: 'gentleFloat 3s ease-in-out infinite',
            filter: 'drop-shadow(0 6px 14px rgba(196, 96, 42, 0.18))',
          }}
        />
      </div>

      {/* Headline */}
      <div className="mt-3 max-w-[380px] text-center">
        <h1
          className="font-tiro"
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: 0.3,
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {labels.title}
        </h1>
        <p
          className="mt-2 text-[14px]"
          style={{ color: 'var(--muted)', lineHeight: 1.55 }}
        >
          {labels.sub}
        </p>
      </div>

      {/* 5-card picker */}
      <div className="mt-7 grid w-full max-w-[420px] grid-cols-1 gap-3">
        {locales.map((loc) => {
          const isSelected = picked === loc;
          return (
            <button
              key={loc}
              type="button"
              onClick={() => setPicked(loc)}
              aria-pressed={isSelected}
              className="haptic-press text-left transition-all"
              style={{
                position: 'relative',
                background: isSelected
                  ? 'linear-gradient(135deg, #FFF5EC, #FFE9D2)'
                  : 'var(--surface)',
                border: `2px solid ${isSelected ? '#E8650A' : 'var(--border)'}`,
                borderRadius: 'var(--radius-card-lg)',
                boxShadow: isSelected
                  ? '0 6px 18px rgba(232, 101, 10, 0.18)'
                  : 'var(--shadow-card)',
                padding: '14px 16px',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                alignItems: 'center',
                gap: 14,
              }}
            >
              {/* Greeting bubble */}
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected
                    ? 'linear-gradient(135deg, #E8650A, #C4602A)'
                    : 'var(--bg-soft)',
                  color: isSelected ? '#FFF8F0' : 'var(--terracotta)',
                  fontFamily: "'Tiro Devanagari Hindi', 'Hind', serif",
                  fontSize: 16,
                  fontWeight: 700,
                  textAlign: 'center',
                  lineHeight: 1.05,
                  padding: 4,
                  transition: 'all 0.2s ease',
                }}
              >
                {localeGreetings[loc]}
              </div>

              {/* Names */}
              <div>
                <div
                  className="font-tiro"
                  style={{
                    fontSize: 19,
                    fontWeight: 700,
                    color: 'var(--text)',
                    lineHeight: 1.1,
                  }}
                >
                  {localeNativeNames[loc]}
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
                  {ENGLISH_NAMES[loc]}
                </div>
              </div>

              {/* Radio dot */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: `2px solid ${isSelected ? '#E8650A' : '#cfc4b3'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                {isSelected && (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#E8650A',
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Continue CTA */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={submitting}
        className="cta-primary haptic-press mt-7 inline-flex w-full max-w-[420px] items-center justify-center rounded-pill py-4 text-[16px] font-bold disabled:opacity-70"
        style={{ borderRadius: 'var(--radius-pill)' }}
      >
        {submitting ? '…' : labels.continue} →
      </button>

      <div
        className="mt-6 text-center text-[11px] tracking-[0.16em]"
        style={{ color: 'var(--muted-light)', textTransform: 'uppercase' }}
      >
        SAVESTMENT · BHAROSE KE SAATH
      </div>
    </main>
  );
}
