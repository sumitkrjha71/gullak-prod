'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { TIERS, type Tier } from '@/lib/streaks/tiers';
import { Sparkles } from 'lucide-react';

export function UnlockModal({ tierId, onClose }: { tierId: string; onClose: () => void }) {
  const t = useTranslations('tiers');
  const tier: Tier | undefined = TIERS.find((x) => x.id === tierId);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(onClose, 250);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  // Confetti — themed to tier color.
  const confetti = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        i,
        left: Math.random() * 100,
        size: 5 + Math.random() * 6,
        duration: 1.6 + Math.random() * 1.4,
        delay: Math.random() * 0.4,
      })),
    [],
  );

  if (!tier) return null;

  const close = () => setOpen(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(15,17,21,0.55)', backdropFilter: 'blur(3px)' }}
          onClick={close}
        >
          {/* Confetti rain */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {confetti.map((c) => (
              <span
                key={c.i}
                className="absolute"
                aria-hidden
                style={{
                  top: -10,
                  left: `${c.left}%`,
                  width: c.size,
                  height: c.size,
                  background: tier.color,
                  borderRadius: c.i % 2 ? '50%' : 2,
                  animation: `confettiFall ${c.duration}s ease-in ${c.delay}s forwards`,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.7, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="relative w-full max-w-xs px-6 py-7 text-center"
            style={{
              background: tier.bg,
              border: `2.5px solid ${tier.color}`,
              borderRadius: 24,
              boxShadow: '0 20px 60px rgba(15,17,21,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="mx-auto inline-flex items-center gap-1 rounded-pill px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider"
              style={{ background: tier.color, color: '#fff' }}
            >
              <Sparkles size={10} aria-hidden /> Naya Tier Unlocked
            </div>

            <div
              className="mt-3 inline-flex h-24 w-24 items-center justify-center rounded-full"
              style={{
                background: '#fff',
                fontSize: 48,
                boxShadow: `0 0 28px ${tier.color}55`,
                animation: 'dropIn 0.7s ease-out',
              }}
              aria-hidden
            >
              {tier.emoji}
            </div>

            <h2
              className="mt-3 text-balance"
              style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: -0.3 }}
            >
              {t(tier.id + '.name' as never)}
            </h2>
            <p
              className="mt-2 text-[13.5px]"
              style={{ color: 'var(--text)', opacity: 0.85, lineHeight: 1.5 }}
            >
              {t(tier.id + '.celebrate' as never)}
            </p>

            <button
              onClick={close}
              className="haptic-press mt-5 inline-flex h-12 w-full items-center justify-center rounded-btn px-6 text-[14.5px] font-bold"
              style={{
                background: tier.color,
                color: '#fff',
              }}
            >
              Mubarak ho! 🎉
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
