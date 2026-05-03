'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Check } from 'lucide-react';

export function SalaryDayForm({
  locale,
  labels,
}: {
  locale: string;
  labels: { title: string; sub: string; skip: string; cta: string };
}) {
  const router = useRouter();
  const [day, setDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (d: number | null) => {
    setLoading(true);
    try {
      await fetch('/api/me/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ salaryDay: d, isSalaried: d !== null, locale }),
      });
      router.push(`/${locale}/trust`);
    } finally {
      setLoading(false);
    }
  };

  // Full 30-day calendar: 5 cols × 6 rows = 30 days
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <main
      className="flex min-h-dvh w-full flex-col anim-screen-enter"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/onboarding/name`}
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
            width={84}
            height={70}
            priority
            style={{
              width: 84,
              height: 70,
              objectFit: 'contain',
              animation: 'gentleFloat 3s ease-in-out infinite',
              filter: 'drop-shadow(0 6px 14px rgba(196, 96, 42, 0.18))',
            }}
          />
          <h1
            className="mt-3"
            style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.25, color: 'var(--text)' }}
          >
            {labels.title}
          </h1>
          <p className="mt-1.5 text-[14px]" style={{ color: 'var(--muted)' }}>
            {labels.sub}
          </p>
        </div>

        {/* Full 30-day calendar grid */}
        <div className="mt-7 grid grid-cols-5 gap-2">
          {days.map((d) => {
            const selected = day === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d)}
                aria-pressed={selected}
                className="haptic-press num flex aspect-square items-center justify-center text-[15px] font-bold transition-all"
                style={{
                  borderRadius: 12,
                  border: `2px solid ${selected ? 'var(--growth)' : 'var(--border)'}`,
                  background: selected ? 'var(--growth)' : 'var(--surface)',
                  color: selected ? '#FFF8F0' : 'var(--text)',
                  boxShadow: selected
                    ? '0 4px 14px rgba(26, 122, 74, 0.28)'
                    : 'var(--shadow-card)',
                  transform: selected ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {d}
              </button>
            );
          })}
        </div>

        {day !== null && (
          <div
            className="anim-fade-in mt-4 rounded-pill px-4 py-2 text-center text-[12.5px]"
            style={{ background: 'var(--growth-soft)', color: 'var(--growth)', fontWeight: 700 }}
          >
            <span aria-hidden>✓ </span>
            <span className="num">Tarikh {day}</span> — har mahine yahi din save shuru hoga
          </div>
        )}

        <button
          onClick={() => submit(day)}
          disabled={day === null || loading}
          className="haptic-press cta-primary mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[16px] font-bold disabled:opacity-50"
        >
          {labels.cta} <Check size={16} />
        </button>
        <button
          onClick={() => submit(null)}
          className="haptic-press mt-3 flex h-12 w-full items-center justify-center rounded-btn text-[14px] font-semibold hover:bg-border/30"
          style={{ color: 'var(--muted)' }}
        >
          {labels.skip}
        </button>
      </div>
    </main>
  );
}
