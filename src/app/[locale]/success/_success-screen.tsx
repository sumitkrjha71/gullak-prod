'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Lock, Sparkles } from 'lucide-react';
import CountUp from 'react-countup';
import { projectCorpus } from '@/lib/autopilot/calculator';

type Labels = {
  title: string;
  sub: string;
  tagline: string;
  fiveYearLabel: string;
  fiveYearSub: string;
  daily: string;
  yr1: string;
  yr5: string;
  invest: string;
  investVal: string;
  trust: string;
  cta: string;
};

export function SuccessScreen({
  locale,
  amount,
  labels,
}: {
  locale: string;
  name: string;
  amount: number;
  labels: Labels;
}) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [coinsDone, setCoinsDone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setCoinsDone(true), 2200);
    const t2 = setTimeout(() => setShowConfetti(false), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const confetti = useMemo(
    () =>
      Array.from({ length: 32 }).map((_, i) => ({
        i,
        left: Math.random() * 100,
        size: 6 + Math.random() * 7,
        color: ['#E8650A', '#D4A017', '#C4602A', '#0E8C7A', '#1A7A4A', '#F5C842'][i % 6],
        round: i % 3 === 0,
        duration: 1.6 + Math.random() * 2,
        delay: Math.random() * 0.6,
      })),
    [],
  );

  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
  const dailyPaise = amount * 100;
  const yearly = amount * 365;
  const fiveYear = Math.round(projectCorpus(dailyPaise, 5) / 100);
  const oneYear = Math.round(projectCorpus(dailyPaise, 1) / 100);

  return (
    <main
      className="relative flex min-h-dvh w-full flex-col items-center overflow-hidden px-6 pt-6 text-center"
      style={{
        background: 'linear-gradient(180deg, #FFF8F0 0%, #FFF2E5 100%)',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {/* Confetti */}
      {showConfetti && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {confetti.map((c) => (
            <span
              key={c.i}
              className="absolute"
              style={{
                top: -10,
                left: `${c.left}%`,
                width: c.size,
                height: c.size,
                background: c.color,
                borderRadius: c.round ? '50%' : 2,
                animation: `confettiFall ${c.duration}s ease-in ${c.delay}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Chiraiya celebrating */}
      <Image
        src="/assets/chiraiya-v2.png"
        alt=""
        width={64}
        height={54}
        priority
        className="absolute"
        style={{
          top: '8%',
          right: '8%',
          width: 64,
          height: 54,
          objectFit: 'contain',
          animation: 'celebFly 2s ease-in-out infinite',
          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.18))',
        }}
      />

      {/* Gullak with coins dropping in */}
      <div className="relative">
        <Image
          src="/assets/gullak-pot.png"
          alt="Gullak"
          width={130}
          height={110}
          priority
          style={{
            width: 130,
            height: 110,
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 28px rgba(212, 160, 23, 0.55))',
            animation: 'potGlow 2.6s ease-in-out infinite, gentleFloat 3s ease-in-out infinite',
          }}
        />
        {!coinsDone &&
          Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute"
              style={{
                top: -18,
                left: `${28 + i * 11}%`,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #f5d442, #D4A017)',
                border: '1.5px solid #c49a00',
                animation: `coinDrop 0.7s ease-in ${i * 0.32}s forwards`,
                opacity: 0,
                boxShadow: '0 0 6px rgba(212,160,23,0.6)',
              }}
            />
          ))}
      </div>

      <h1
        className="mt-3"
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: 'var(--text)',
          animation: 'fadeIn 0.5s ease-out 0.3s both',
          letterSpacing: -0.4,
        }}
      >
        {labels.title}
      </h1>
      <p
        className="mt-1 text-[15px] font-semibold"
        style={{ color: 'var(--terracotta)', animation: 'fadeIn 0.5s ease-out 0.5s both' }}
      >
        {labels.sub}
      </p>

      {/* THE BIG MOMENT — 5-year projection card */}
      <div
        className="mt-5 w-full max-w-md px-5 py-5"
        style={{
          background: 'linear-gradient(145deg, #FFF5EC, #FFE9D2)',
          border: '2px solid var(--saffron)',
          borderRadius: 'var(--radius-card-lg)',
          boxShadow: '0 8px 24px rgba(232, 101, 10, 0.18)',
          animation: 'fadeIn 0.5s ease-out 0.7s both',
        }}
      >
        <div
          className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-[10.5px] font-bold"
          style={{ background: 'var(--saffron)', color: '#FFF8F0', letterSpacing: 0.3 }}
        >
          <Sparkles size={11} aria-hidden /> {labels.fiveYearLabel.toUpperCase()}
        </div>
        <div
          className="num mt-2 leading-none"
          style={{ fontSize: 'clamp(40px, 11vw, 56px)', fontWeight: 900, color: 'var(--text)' }}
        >
          ₹
          <CountUp end={fiveYear} duration={2.4} separator="," />
        </div>
        <div className="mt-1 text-[12.5px]" style={{ color: 'var(--muted)' }}>
          {labels.fiveYearSub}
        </div>

        {/* 3 mini stat tiles */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label={labels.daily} value={`₹${fmt(amount)}`} />
          <Stat label={labels.yr1} value={`₹${fmt(oneYear)}`} highlight />
          <Stat label={labels.yr5} value={`₹${fmt(fiveYear)}`} highlight />
        </div>
      </div>

      {/* Trust line */}
      <div
        className="mt-4 inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[12px] font-bold"
        style={{ background: 'var(--trust-soft)', color: 'var(--trust)' }}
      >
        <BadgeCheck size={12} aria-hidden /> {labels.trust}
      </div>

      <Link
        href={`/${locale}/home`}
        className="haptic-press cta-primary mt-5 inline-flex h-14 w-full max-w-md items-center justify-center gap-2 rounded-btn text-[16px] font-bold"
      >
        {labels.cta} <ArrowRight size={16} />
      </Link>

      <p
        className="mb-2 mt-3 inline-flex items-center gap-1.5 text-[11px]"
        style={{ color: 'var(--trust)' }}
      >
        <Lock size={11} aria-hidden /> 100% Safe · RBI Regulated Partners
      </p>
    </main>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="px-2 py-2 text-left"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
      }}
    >
      <div className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
        {label}
      </div>
      <div
        className="num mt-0.5 text-[14px] font-extrabold leading-tight"
        style={{ color: highlight ? 'var(--growth)' : 'var(--text)' }}
      >
        {value}
      </div>
    </div>
  );
}
