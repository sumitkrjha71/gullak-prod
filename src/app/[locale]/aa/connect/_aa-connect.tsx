'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, Lock, BadgeCheck, Building2, ArrowRight } from 'lucide-react';

type Fip = { id: string; name: string };

export function AAConnect({
  locale,
  alreadyConnected,
  fips,
  labels,
}: {
  locale: string;
  alreadyConnected: boolean;
  fips: Fip[];
  labels: {
    title: string;
    sub: string;
    explainTitle: string;
    explain1: string;
    explain2: string;
    explain3: string;
    selectFip: string;
    connectCta: string;
    connecting: string;
    connected: string;
    demoNote: string;
    alreadyConnected: string;
  };
}) {
  const router = useRouter();
  const [selectedFip, setSelectedFip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(alreadyConnected);

  const connect = async () => {
    if (!selectedFip) return;
    setLoading(true);
    try {
      const r = await fetch('/api/aa/connect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fipId: selectedFip }),
      });
      if (!r.ok) throw new Error('failed');
      setDone(true);
      setTimeout(() => router.push(`/${locale}/credit`), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh w-full flex-col bg-bg" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/credit`}
          aria-label="Back"
          className="haptic-press flex h-9 w-9 items-center justify-center rounded-full text-text/70 hover:bg-border/40"
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="text-[11px] font-bold text-trust">RBI · AA Framework</span>
        <span className="h-9 w-9" />
      </header>

      <div className="mx-auto w-full max-w-md flex-1 px-6 pt-3">
        <div className="text-center">
          <Image
            src="/assets/chiraiya-v2.png"
            alt=""
            width={70}
            height={56}
            priority
            className="anim-float mx-auto"
            style={{ width: 70, height: 56, objectFit: 'contain' }}
          />
          <h1 className="mt-2 text-[20px] font-extrabold text-text">{labels.title}</h1>
          <p className="mt-1 text-[13px] text-muted">{labels.sub}</p>
        </div>

        {/* Why we ask */}
        <div className="card mt-5 p-4">
          <div className="text-[12px] font-bold text-text">{labels.explainTitle}</div>
          <ul className="mt-2 space-y-2 text-[12px] leading-relaxed text-muted">
            <li className="flex items-start gap-2">
              <Lock size={12} className="mt-1 shrink-0 text-trust" aria-hidden /> {labels.explain1}
            </li>
            <li className="flex items-start gap-2">
              <Lock size={12} className="mt-1 shrink-0 text-trust" aria-hidden /> {labels.explain2}
            </li>
            <li className="flex items-start gap-2">
              <Lock size={12} className="mt-1 shrink-0 text-trust" aria-hidden /> {labels.explain3}
            </li>
          </ul>
        </div>

        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex items-center gap-2 rounded-card-lg bg-growth-soft p-4 text-[13px] font-bold text-growth"
          >
            <BadgeCheck size={16} aria-hidden /> {labels.connected}
          </motion.div>
        ) : (
          <>
            <div className="mt-5 text-[12px] font-bold text-text">{labels.selectFip}</div>
            <div className="mt-2 grid gap-2">
              {fips.map((f) => (
                <motion.button
                  key={f.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedFip(f.id)}
                  className="haptic-press flex items-center gap-3 rounded-card-lg border-2 bg-surface px-3.5 py-3 text-left"
                  style={{
                    borderColor: selectedFip === f.id ? 'var(--saffron)' : 'var(--border)',
                  }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card bg-bg text-trust">
                    <Building2 size={16} />
                  </div>
                  <span className="flex-1 text-[13px] font-bold text-text">{f.name}</span>
                  {selectedFip === f.id && <BadgeCheck size={16} className="text-saffron" aria-hidden />}
                </motion.button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="safe-bottom mx-auto w-full max-w-md px-6 pb-2">
        {!done && (
          <button
            onClick={connect}
            disabled={!selectedFip || loading}
            className="haptic-press cta-primary flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[16px] font-bold disabled:opacity-50"
          >
            {loading ? labels.connecting : labels.connectCta} {!loading && <ArrowRight size={16} />}
          </button>
        )}
        <p className="mt-2 inline-flex w-full items-center justify-center gap-1.5 text-center text-[11px] text-trust">
          <Lock size={11} aria-hidden /> {labels.demoNote}
        </p>
      </div>
    </main>
  );
}
