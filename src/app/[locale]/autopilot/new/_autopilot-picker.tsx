'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ArrowRight, CalendarClock, Coins, Wallet } from 'lucide-react';

type Mode = 'fixed' | 'roundup' | 'sweep';

export function AutopilotPicker({
  locale,
  goalId,
  labels,
}: {
  locale: string;
  goalId: string;
  labels: {
    title: string;
    sub: string;
    fixedTitle: string;
    fixedDesc: string;
    roundupTitle: string;
    roundupDesc: string;
    sweepTitle: string;
    sweepDesc: string;
    tagPopular: string;
    tagSmart: string;
    tagMax: string;
    comingSoon: string;
    cta: string;
    hint: string;
  };
}) {
  const router = useRouter();
  // Only Fixed is enabled at V4 launch.
  const [mode, setMode] = useState<Mode | null>('fixed');

  const cards: {
    id: Mode;
    icon: React.ReactNode;
    title: string;
    desc: string;
    tag: string;
    enabled: boolean;
    accent: string;
  }[] = [
    {
      id: 'fixed',
      icon: <CalendarClock size={24} aria-hidden />,
      title: labels.fixedTitle,
      desc: labels.fixedDesc,
      tag: labels.tagPopular,
      enabled: true,
      accent: 'var(--saffron)',
    },
    {
      id: 'roundup',
      icon: <Coins size={24} aria-hidden />,
      title: labels.roundupTitle,
      desc: labels.roundupDesc,
      tag: labels.tagSmart,
      enabled: false,
      accent: 'var(--trust)',
    },
    {
      id: 'sweep',
      icon: <Wallet size={24} aria-hidden />,
      title: labels.sweepTitle,
      desc: labels.sweepDesc,
      tag: labels.tagMax,
      enabled: false,
      accent: 'var(--growth)',
    },
  ];

  return (
    <main
      className="flex min-h-dvh w-full flex-col anim-screen-enter"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/goals/new`}
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

      <div className="mx-auto w-full max-w-md px-6 pt-3 text-center">
        <Image
          src="/assets/chiraiya-v2.png"
          alt=""
          width={76}
          height={62}
          priority
          style={{
            width: 76,
            height: 62,
            objectFit: 'contain',
            filter: 'drop-shadow(0 6px 14px rgba(196, 96, 42, 0.18))',
          }}
          className="anim-float mx-auto"
        />
        <h1 className="mt-2" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
          {labels.title}
        </h1>
        <p className="mt-1 text-[13.5px]" style={{ color: 'var(--muted)' }}>
          {labels.sub}
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-5 pt-5">
        {cards.map((c, i) => {
          const selected = mode === c.id;
          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              onClick={() => c.enabled && setMode(c.id)}
              disabled={!c.enabled}
              className="haptic-press relative flex items-center gap-3.5 p-4 text-left transition-all"
              style={{
                background: selected
                  ? 'linear-gradient(145deg, #FFE9D2, #FFF5EC)'
                  : 'var(--surface)',
                border: `2px solid ${selected ? c.accent : 'var(--border)'}`,
                borderRadius: 'var(--radius-card-lg)',
                boxShadow: selected ? '0 6px 18px rgba(232,101,10,0.15)' : 'var(--shadow-card)',
                opacity: c.enabled ? 1 : 0.78,
                cursor: c.enabled ? 'pointer' : 'default',
              }}
            >
              {/* Tag (right side) */}
              <span
                className="absolute right-2.5 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold"
                style={{
                  background: c.enabled ? '#FFE9D2' : '#FFF1B8',
                  color: c.enabled ? 'var(--saffron)' : '#8a6700',
                }}
              >
                {c.enabled ? c.tag : labels.comingSoon}
              </span>

              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card"
                style={{
                  background: selected ? c.accent : 'var(--bg-soft)',
                  color: selected ? '#FFF8F0' : c.accent,
                }}
                aria-hidden
              >
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--text)' }}>
                  {c.title}
                </div>
                <p
                  className="mt-0.5 text-[12.5px]"
                  style={{ color: 'var(--muted)', lineHeight: 1.45 }}
                >
                  {c.desc}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="safe-bottom mx-auto w-full max-w-md px-6 pb-2 pt-3">
        <button
          onClick={() => mode && router.push(`/${locale}/autopilot/new/amount?mode=${mode}&goal=${goalId}`)}
          disabled={!mode}
          className="haptic-press cta-primary flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[16px] font-bold disabled:opacity-50"
        >
          {labels.cta} <ArrowRight size={16} />
        </button>
        <p className="mt-2 text-center text-[11px]" style={{ color: 'var(--trust)' }}>
          {labels.hint}
        </p>
      </div>
    </main>
  );
}
