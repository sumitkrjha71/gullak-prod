'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Lock } from 'lucide-react';

type Row = { title: string; body: string };
type BreakdownRow = { label: string; value: number; pct: number; color: string };

export function Transparency({
  locale,
  total,
  breakdown,
  labels,
}: {
  locale: string;
  total: number;
  breakdown: BreakdownRow[];
  labels: { title: string; sub: string; cta: string; rrTitle: string; rows: Row[] };
}) {
  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  return (
    <main className="flex min-h-dvh w-full flex-col bg-bg" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/home`}
          aria-label="Back"
          className="haptic-press flex h-9 w-9 items-center justify-center rounded-full text-text/70 hover:bg-border/40"
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="text-[11px] font-bold text-trust">100% Safe · RBI</span>
        <span className="h-9 w-9" />
      </header>

      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-5 pt-3 pb-6">
        <div className="text-center">
          <div className="relative mx-auto inline-block">
            <Image
              src="/assets/gullak-pot.png"
              alt=""
              width={80}
              height={68}
              priority
              className="anim-float"
              style={{ width: 80, height: 68, objectFit: 'contain' }}
            />
            <Image
              src="/assets/chiraiya-v2.png"
              alt=""
              width={42}
              height={36}
              className="absolute -right-6 -top-2"
              style={{
                width: 42,
                height: 36,
                objectFit: 'contain',
                animation: 'gentleFloat 2.5s ease-in-out infinite',
                transform: 'scaleX(-1)',
              }}
            />
          </div>
          <h1 className="mt-2 text-[22px] font-extrabold text-text">{labels.title}</h1>
          <p className="mt-1 text-[13px] text-muted">{labels.sub}</p>
        </div>

        {/* Total + bar breakdown */}
        <div className="card mt-5 p-4">
          <div className="text-[12px] uppercase tracking-wider text-muted">Total invested</div>
          <div className="mt-1 text-[28px] font-extrabold tabular-nums text-text">₹{fmt(total)}</div>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full">
            {breakdown.map((b, i) => (
              <span key={i} style={{ width: `${b.pct}%`, background: b.color }} aria-hidden />
            ))}
          </div>
          <div className="mt-3 grid gap-2">
            {breakdown.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} aria-hidden />
                  <span className="text-[13px] text-text">{b.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-bold tabular-nums text-text">₹{fmt(b.value)}</div>
                  <div className="text-[10px] text-muted">{b.pct}%</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* RRTTLLU */}
        <h2 className="mt-6 text-[16px] font-extrabold text-text">{labels.rrTitle}</h2>
        <div className="mt-2 grid gap-2">
          {labels.rows.map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card p-3.5"
            >
              <div className="text-[13px] font-bold text-text">{row.title}</div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{row.body}</p>
            </motion.div>
          ))}
        </div>

        <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-trust">
          <Lock size={11} aria-hidden /> 100% Safe · RBI Regulated Partners
        </p>
      </div>

      <div className="safe-bottom mx-auto w-full max-w-md px-6 pb-2">
        <Link
          href={`/${locale}/home`}
          className="haptic-press cta-primary flex h-14 w-full items-center justify-center rounded-btn text-[16px] font-bold"
        >
          {labels.cta}
        </Link>
      </div>
    </main>
  );
}
