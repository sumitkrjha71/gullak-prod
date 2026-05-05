'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ArrowRight, Sparkles } from 'lucide-react';

export function GroupGullakCard({ locale }: { locale: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{
        opacity: 1,
        y: [0, -3, 0],
        scale: 1,
      }}
      transition={{
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
        y: {
          duration: 2.4,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }}
    >
      <Link
        href={`/${locale}/group-gullak/new`}
        className="haptic-press relative flex items-center gap-3 overflow-hidden px-4 py-3.5 transition-all"
        style={{
          background:
            'linear-gradient(120deg, #f0f7e6 0%, #e6f7f4 50%, #FFF5EC 100%)',
          border: '2px solid var(--growth)',
          borderRadius: 'var(--radius-card-lg)',
          boxShadow: '0 8px 24px rgba(26,122,74,0.18)',
        }}
      >
        {/* Faint sparkle decoration */}
        <div
          className="pointer-events-none absolute right-2 top-2 opacity-40"
          aria-hidden
        >
          <Sparkles size={12} style={{ color: 'var(--growth)' }} />
        </div>

        {/* Icon — pulses gently */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
          style={{
            background: 'var(--growth)',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(26,122,74,0.30)',
          }}
          aria-hidden
        >
          <Users size={22} />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div
            className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest"
            style={{ color: 'var(--growth)' }}
          >
            ✨ Naya Feature
          </div>
          <div
            className="mt-0.5 text-[15px] font-extrabold leading-tight"
            style={{ color: 'var(--text)' }}
          >
            Group Gullak shuru karein
          </div>
          <div
            className="mt-0.5 text-[11.5px] leading-tight"
            style={{ color: 'var(--muted)' }}
          >
            Kitty · Committee · Trip · Cricket — saath bachat
          </div>
        </div>

        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: 'var(--surface)', color: 'var(--growth)' }}
          aria-hidden
        >
          <ArrowRight size={16} />
        </motion.div>
      </Link>
    </motion.div>
  );
}
