'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ArrowRight, Sparkles } from 'lucide-react';

// Hero-grade dashboard CTA. Demands attention through:
//  - pulsing outer glow ring (saffron + growth)
//  - gradient that shimmers slowly L→R
//  - Sparkle motif fading in/out
//  - "NAYA" badge with shimmer
//  - 3 floating member-avatars stacked (social proof)
//  - "Tap karein →" pill that bounces horizontally
//  - subtle vertical bob for the whole card
//
// Goal: investor opening the demo cannot scroll past without noticing.

const MEMBER_AVATARS = ['👨', '👩', '🧑‍🦱'] as const;

export function GroupGullakCard({ locale }: { locale: string }) {
  return (
    <Link
      href={`/${locale}/group-gullak/new`}
      aria-label="Group Gullak shuru karein"
      className="block"
    >
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{
          opacity: 1,
          y: [0, -4, 0],
          scale: 1,
        }}
        transition={{
          opacity: { duration: 0.5 },
          scale: { duration: 0.5 },
          y: {
            duration: 2.6,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
        className="relative"
      >
        {/* Pulsing outer glow ring */}
        <motion.div
          className="pointer-events-none absolute -inset-1.5 rounded-[28px]"
          aria-hidden
          animate={{
            opacity: [0.55, 0.85, 0.55],
            scale: [1, 1.015, 1],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background:
              'linear-gradient(120deg, rgba(232,101,10,0.45) 0%, rgba(26,122,74,0.45) 50%, rgba(232,101,10,0.45) 100%)',
            filter: 'blur(14px)',
            zIndex: 0,
          }}
        />

        {/* Card body */}
        <div
          className="relative haptic-press flex items-center gap-3 overflow-hidden px-4 py-4"
          style={{
            background:
              'linear-gradient(120deg, #FFF5EC 0%, #f0f7e6 35%, #e6f7f4 70%, #FFF5EC 100%)',
            backgroundSize: '200% 200%',
            border: '2.5px solid var(--saffron)',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow:
              '0 12px 28px rgba(232,101,10,0.20), 0 4px 10px rgba(26,122,74,0.15)',
            zIndex: 1,
          }}
        >
          {/* Animated gradient shimmer overlay */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            style={{
              background:
                'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              opacity: 0.6,
            }}
          />

          {/* NAYA badge — top right */}
          <div
            className="absolute right-2.5 top-2.5 rounded-pill px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-widest"
            style={{
              background: 'var(--saffron)',
              color: '#fff',
              boxShadow: '0 2px 6px rgba(232,101,10,0.35)',
            }}
          >
            ✨ Naya
          </div>

          {/* Sparkles — top left of icon */}
          <motion.div
            className="pointer-events-none absolute left-3 top-3"
            aria-hidden
            animate={{ opacity: [0.3, 1, 0.3], rotate: [0, 14, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles size={12} style={{ color: 'var(--gold)' }} />
          </motion.div>

          {/* Pulsing icon */}
          <motion.div
            animate={{ scale: [1, 1.10, 1], rotate: [0, 4, 0, -4, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: 'linear-gradient(145deg, var(--saffron), var(--growth))',
              color: '#fff',
              boxShadow:
                '0 6px 16px rgba(232,101,10,0.35), 0 2px 6px rgba(26,122,74,0.25)',
            }}
            aria-hidden
          >
            <Users size={26} />
          </motion.div>

          {/* Body text */}
          <div className="flex-1 min-w-0">
            <div
              className="text-[16.5px] font-extrabold leading-tight"
              style={{ color: 'var(--text)' }}
            >
              Group Gullak
            </div>
            <div
              className="mt-0.5 text-[12px] leading-tight"
              style={{ color: 'var(--text)', fontWeight: 600 }}
            >
              Saath bachat — saath manzil
            </div>

            {/* Avatars + social proof */}
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {MEMBER_AVATARS.map((emoji, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: -4, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[12px]"
                    style={{
                      background: 'var(--surface)',
                      border: '1.5px solid var(--saffron)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }}
                    aria-hidden
                  >
                    {emoji}
                  </motion.span>
                ))}
              </div>
              <span
                className="text-[10.5px] font-bold"
                style={{ color: 'var(--terracotta)' }}
              >
                Kitty · Trip · Cricket · Festival
              </span>
            </div>
          </div>

          {/* Bouncing CTA chip on right */}
          <motion.div
            animate={{ x: [0, 6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-1"
            aria-hidden
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                background: 'var(--saffron)',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(232,101,10,0.40)',
              }}
            >
              <ArrowRight size={18} />
            </div>
            <span
              className="text-[9.5px] font-extrabold uppercase tracking-wider"
              style={{ color: 'var(--saffron)' }}
            >
              Tap
            </span>
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
}
