'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';

type Item = { titleKey: string; descKey: string; bg: string; icon: string; info?: string };
type Labels = {
  badge: string;
  titleTemplate: string;
  cta: string;
  footer: string;
  items: Item[];
};

export function TrustCheckpoint({ locale, labels }: { locale: string; labels: Labels }) {
  const router = useRouter();
  const [infoOpen, setInfoOpen] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  // Resolve user's name from sessionStorage (set by name form). Falls back to 'Dost'.
  const [title, setTitle] = useState(() =>
    labels.titleTemplate.replace(/__NAME__/g, 'Dost'),
  );
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('gullak_user_name');
      const name = stored && stored.trim().length > 0 ? stored.trim() : 'Dost';
      setTitle(labels.titleTemplate.replace(/__NAME__/g, name));
    } catch {
      // ignore — keep 'Dost' fallback
    }
  }, [labels.titleTemplate]);

  const accept = () => {
    if (loading) return;
    setLoading(true);
    // Fire-and-forget — never block onward navigation on the lifecycle PATCH.
    try {
      fetch('/api/me/lifecycle', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ to: 'TRUST_ACKNOWLEDGED' }),
      }).catch(() => {});
    } catch {
      // ignore
    }
    router.push(`/${locale}/goals/new`);
  };

  return (
    <main
      className="flex min-h-dvh w-full flex-col"
      style={{
        background: 'linear-gradient(180deg, #FFF8F0 0%, #FFF2E5 100%)',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div className="mx-auto w-full max-w-md px-6 pt-8 text-center safe-top">
        <div className="inline-flex items-center gap-1.5 rounded-pill bg-trust-soft px-3.5 py-1.5 text-[12px] font-bold text-trust">
          <Shield size={12} aria-hidden /> {labels.badge}
        </div>
        <h1 className="mt-3 text-[22px] font-extrabold leading-tight text-text">{title}</h1>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-2.5 overflow-y-auto px-5 py-4">
        {labels.items.map((it, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="card flex items-start gap-3 p-4"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card text-[18px]"
              style={{ background: it.bg }}
              aria-hidden
            >
              {it.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[14px] font-bold text-text">
                <span>{it.titleKey}</span>
                {it.info && (
                  <button
                    onClick={() => setInfoOpen(infoOpen === i ? null : i)}
                    aria-label="More info"
                    className="haptic-press flex h-[18px] w-[18px] items-center justify-center rounded-full bg-trust text-[11px] font-extrabold text-white"
                  >
                    i
                  </button>
                )}
              </div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{it.descKey}</p>
              <AnimatePresence>
                {it.info && infoOpen === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 overflow-hidden rounded-card border bg-trust-soft px-3 py-2 text-[11px] font-medium leading-relaxed text-trust"
                    style={{ borderColor: '#b8e6dc' }}
                  >
                    {it.info}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="safe-bottom mx-auto w-full max-w-md px-6 pb-2">
        <button
          onClick={accept}
          disabled={loading}
          className="haptic-press cta-primary flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[15px] font-bold disabled:opacity-50"
        >
          {labels.cta} <ArrowRight size={16} />
        </button>
        <p className="mt-2 text-center text-[11px] text-trust">{labels.footer}</p>
      </div>
    </main>
  );
}
