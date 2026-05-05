'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Users, Sparkles } from 'lucide-react';

type Theme = {
  type: string;
  emoji: string;
  label: string;
  sub: string;
  suggestedTargetPaise: number;
  typicalMembers: string;
};

export function GroupPicker({ locale, themes }: { locale: string; themes: Theme[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async (theme: Theme) => {
    if (creating) return;
    setSelected(theme.type);
    setCreating(true);
    setError(null);
    try {
      const r = await fetch('/api/group-gullak', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: theme.type,
          title: theme.label,
          targetPaise: theme.suggestedTargetPaise,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        setError('Abhi nahi ho paya — phir try karein');
        setCreating(false);
        return;
      }
      router.push(`/${locale}/goals/${j.goalId}/family`);
    } catch {
      setError('Abhi nahi ho paya — phir try karein');
      setCreating(false);
    }
  };

  return (
    <main
      className="flex min-h-dvh w-full flex-col anim-screen-enter"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <header
        className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3"
      >
        <Link
          href={`/${locale}/home`}
          aria-label="Back"
          className="haptic-press flex h-9 w-9 items-center justify-center rounded-full hover:bg-border/40"
          style={{ color: 'var(--muted)' }}
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: 'var(--growth)' }}>
          <Users size={11} aria-hidden /> GROUP GULLAK
        </span>
        <span className="h-9 w-9" />
      </header>

      <div className="mx-auto w-full max-w-md px-6 pt-3 text-center">
        <div
          className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            background: 'linear-gradient(145deg, #FFE9D2, #f0f7e6)',
            border: '2px solid var(--growth)',
            boxShadow: '0 6px 16px rgba(26,122,74,0.15)',
          }}
          aria-hidden
        >
          <Users size={28} style={{ color: 'var(--growth)' }} />
        </div>
        <h1
          className="mt-3 font-tiro"
          style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.3 }}
        >
          Saath bachat — saath manzil
        </h1>
        <p className="mt-1 text-[13.5px]" style={{ color: 'var(--muted)' }}>
          Group ki <span className="font-extrabold" style={{ color: 'var(--growth)' }}>kya manzil</span> hai?
        </p>
        <div
          className="mx-auto mt-2 inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[10.5px] font-bold"
          style={{ background: 'var(--bg-highlight)', color: 'var(--saffron)' }}
        >
          <Sparkles size={10} aria-hidden />
          Kitty · Committee · Trip · Cricket — sab kuch
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-md flex-1 grid-cols-2 gap-2.5 overflow-y-auto px-5 pt-4 pb-6">
        {themes.map((t, i) => {
          const isSelected = selected === t.type;
          return (
            <motion.button
              key={t.type}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => choose(t)}
              disabled={creating}
              className="haptic-press flex flex-col items-start gap-1.5 px-3.5 py-3.5 text-left transition-all disabled:opacity-50"
              style={{
                background: isSelected
                  ? 'linear-gradient(145deg, #f0f7e6, #e6f7f4)'
                  : 'var(--surface)',
                border: `2px solid ${isSelected ? 'var(--growth)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-card-lg)',
                boxShadow: isSelected
                  ? '0 6px 16px rgba(26,122,74,0.15)'
                  : 'var(--shadow-card)',
                transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                minHeight: 110,
              }}
            >
              <span className="text-[28px]" aria-hidden>
                {t.emoji}
              </span>
              <span
                className="text-[13px] leading-tight"
                style={{ color: 'var(--text)', fontWeight: 800 }}
              >
                {t.label}
              </span>
              <span
                className="text-[10.5px] leading-tight"
                style={{
                  color: isSelected ? 'var(--growth)' : 'var(--muted-light)',
                  fontWeight: 600,
                  fontStyle: 'italic',
                }}
              >
                {t.sub}
              </span>
              <span
                className="mt-auto text-[10px]"
                style={{ color: 'var(--muted)', fontWeight: 700 }}
              >
                {t.typicalMembers}
              </span>
            </motion.button>
          );
        })}
      </div>

      {error && (
        <p
          className="mx-auto mb-2 w-full max-w-md px-6 text-center text-[12px]"
          style={{ color: 'var(--warn)' }}
        >
          {error}
        </p>
      )}
      <p
        className="safe-bottom mx-auto w-full max-w-md px-6 pb-2 text-center text-[11px]"
        style={{ color: 'var(--trust)' }}
      >
        🤝 Group ki bachat · invite link · combined progress
      </p>
    </main>
  );
}
