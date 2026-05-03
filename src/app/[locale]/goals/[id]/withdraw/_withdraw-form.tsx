'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ArrowRight, BadgeCheck, Lock } from 'lucide-react';
import { GullakBreak } from '@/components/animations/GullakBreak';

export function WithdrawForm({
  locale,
  goalId,
  goalTitle,
  maxRupees,
  labels,
}: {
  locale: string;
  goalId: string;
  goalTitle: string;
  maxRupees: number;
  labels: {
    title: string;
    sub: string;
    amountLabel: string;
    max: string;
    preview: string;
    cta: string;
    confirming: string;
    successTitle: string;
    successSubTpl: string;
    successBank: string;
    home: string;
  };
}) {
  const router = useRouter();
  const [rupees, setRupees] = useState<number>(Math.min(500, maxRupees));
  const [loading, setLoading] = useState(false);
  const [breaking, setBreaking] = useState(false);
  const [done, setDone] = useState(false);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  const submit = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ goalId, amountPaise: rupees * 100 }),
      });
      if (!r.ok) throw new Error('failed');
      setBreaking(true);
    } finally {
      setLoading(false);
    }
  };

  if (breaking && !done) {
    return (
      <main
        className="flex min-h-dvh w-full flex-col items-center justify-center px-6 text-center"
        style={{
          background: 'linear-gradient(180deg, #FFF8F0 0%, #FFF2E5 100%)',
          fontFamily: "'Nunito', sans-serif",
        }}
      >
        <GullakBreak amountRupees={rupees} onDone={() => setDone(true)} />
        <p className="mt-3 text-[12px] text-muted">Tap to skip</p>
      </main>
    );
  }

  if (done) {
    return (
      <main
        className="flex min-h-dvh w-full flex-col items-center justify-center px-6 text-center"
        style={{
          background: 'linear-gradient(180deg, #FFF8F0 0%, #FFF2E5 100%)',
          fontFamily: "'Nunito', sans-serif",
        }}
      >
        <BadgeCheck size={56} className="text-growth" aria-hidden />
        <h1 className="mt-3 text-[24px] font-extrabold text-text">{labels.successTitle}</h1>
        <p className="mt-2 text-[15px] font-bold text-terracotta">
          {labels.successSubTpl.replace('__AMT__', fmt(rupees))}
        </p>
        <p className="mt-1 text-[12px] text-muted">{labels.successBank}</p>
        <Link
          href={`/${locale}/home`}
          className="haptic-press cta-primary mt-6 flex h-14 w-full max-w-md items-center justify-center gap-2 rounded-btn text-[16px] font-bold"
        >
          {labels.home} <ArrowRight size={16} />
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh w-full flex-col bg-bg" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/goals/${goalId}`}
          aria-label="Back"
          className="haptic-press flex h-9 w-9 items-center justify-center rounded-full text-text/70 hover:bg-border/40"
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="text-[11px] font-bold text-trust">100% Safe · RBI</span>
        <span className="h-9 w-9" />
      </header>

      <div className="mx-auto w-full max-w-md flex-1 px-6 pt-3">
        <div className="text-center">
          <h1 className="text-[20px] font-extrabold text-text">{labels.title}</h1>
          <p className="mt-1 text-[13px] text-muted">{labels.sub}</p>
        </div>

        <div className="card mt-5 px-5 py-6 text-center">
          <div className="text-[11px] uppercase tracking-wider text-muted">{labels.amountLabel}</div>
          <div className="mt-1 flex items-baseline justify-center gap-1">
            <span className="text-[24px] font-bold text-muted">₹</span>
            <input
              type="text"
              inputMode="numeric"
              value={rupees ? fmt(rupees) : ''}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, ''));
                setRupees(Number.isFinite(n) ? Math.min(n, maxRupees) : 0);
              }}
              className="w-full max-w-[240px] bg-transparent text-center text-[40px] font-extrabold tabular-nums text-text outline-none"
            />
          </div>
          <div className="mt-1 text-[11px] text-muted-light">{labels.max}</div>
          <input
            type="range"
            min={100}
            max={maxRupees}
            step={50}
            value={rupees}
            onChange={(e) => setRupees(Number(e.target.value))}
            className="mt-3 w-full appearance-none"
            style={{
              height: 6,
              background: `linear-gradient(90deg, var(--saffron) 0%, var(--saffron) ${(rupees / maxRupees) * 100}%, var(--border) ${(rupees / maxRupees) * 100}%, var(--border) 100%)`,
              borderRadius: 999,
              accentColor: 'var(--saffron)',
            }}
          />
        </div>

        <div className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-[11px] text-trust">
          <Lock size={11} aria-hidden /> {labels.preview}
        </div>
      </div>

      <div className="safe-bottom mx-auto w-full max-w-md px-6 pb-2">
        <button
          onClick={submit}
          disabled={loading || rupees <= 0 || rupees > maxRupees}
          className="haptic-press cta-primary flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[16px] font-bold disabled:opacity-50"
        >
          {loading ? labels.confirming : labels.cta} 🏺
        </button>
      </div>
    </main>
  );
}
