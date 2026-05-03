'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

type Card = { type: string; emoji: string; name: string; range: string; sub: string };

export function GoalPicker({
  locale,
  cards,
  labels,
}: {
  locale: string;
  cards: Card[];
  labels: { title: string; sub: string };
}) {
  const router = useRouter();
  const [hov, setHov] = useState<string | null>(null);

  const choose = (type: string) => {
    router.push(`/${locale}/goals/new/amount?type=${type}`);
  };

  return (
    <main
      className="flex min-h-dvh w-full flex-col anim-screen-enter"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/trust`}
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

      <div className="mx-auto w-full max-w-md px-6 pt-4 text-center">
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
        <h1
          className="mt-2"
          style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.3 }}
        >
          {labels.title}
        </h1>
        <p className="mt-1 text-[13.5px]" style={{ color: 'var(--muted)' }}>
          {labels.sub}
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-md flex-1 grid-cols-3 gap-2.5 overflow-y-auto px-5 pt-4 pb-6">
        {cards.map((c, i) => {
          const active = hov === c.type;
          return (
            <motion.button
              key={c.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => choose(c.type)}
              onMouseEnter={() => setHov(c.type)}
              onMouseLeave={() => setHov(null)}
              className="haptic-press flex flex-col items-center gap-1 px-2 py-3.5 text-center transition-all"
              style={{
                background: active
                  ? 'linear-gradient(145deg, #FFE9D2, #FFF5EC)'
                  : 'var(--surface)',
                border: `2px solid ${active ? 'var(--saffron)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-card-lg)',
                boxShadow: active ? '0 6px 16px rgba(232,101,10,0.15)' : 'var(--shadow-card)',
                transform: active ? 'translateY(-2px)' : 'translateY(0)',
                minHeight: 100,
              }}
            >
              <span className="text-[28px]" aria-hidden>
                {c.emoji}
              </span>
              <span
                className="text-[12.5px] leading-tight"
                style={{ color: 'var(--text)', fontWeight: 800 }}
              >
                {c.name}
              </span>
              <span
                className="text-[10px] leading-tight"
                style={{
                  color: active ? 'var(--terracotta)' : 'var(--muted-light)',
                  fontWeight: 600,
                  fontStyle: 'italic',
                }}
              >
                {c.sub}
              </span>
            </motion.button>
          );
        })}
      </div>

      <p
        className="safe-bottom mx-auto w-full max-w-md px-6 pb-2 text-center text-[11px]"
        style={{ color: 'var(--trust)' }}
      >
        🔒 100% Safe · RBI Regulated Partners
      </p>
    </main>
  );
}
