'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Auto-detect OS-level prefers-reduced-motion; prop override wins when explicit.
function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefers(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return prefers;
}

/**
 * Gullak-break withdrawal animation.
 * Phase 1 (0-0.6s): Chiraiya approaches with a beak-tap, single thump impact.
 * Phase 2 (0.6-1.4s): Crack overlay grows on the pot.
 * Phase 3 (1.4-2.5s): Pot shatters into 4 polygon shards that rotate-and-fall, coins burst out.
 * Skippable on tap. Auto-respects OS prefers-reduced-motion (vestibular safety).
 *
 * Total duration: 2.5s (or ~0.8s in reduced-motion mode).
 */
export function GullakBreak({
  onDone,
  reducedMotion,
  amountRupees,
}: {
  onDone?: () => void;
  reducedMotion?: boolean;
  amountRupees: number;
}) {
  const osPrefersReduced = usePrefersReducedMotion();
  const reduce = reducedMotion ?? osPrefersReduced;
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (reduce) {
      const t = setTimeout(() => onDone?.(), 800);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => onDone?.(), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone, reduce]);

  if (reduce) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <Image
          src="/assets/gullak-pot.png"
          alt=""
          width={120}
          height={100}
          style={{ width: 120, height: 100, objectFit: 'contain' }}
        />
        <div className="text-[16px] font-bold tabular-nums text-text">₹{new Intl.NumberFormat('en-IN').format(amountRupees)}</div>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-64 items-center justify-center"
      onClick={() => onDone?.()}
      role="img"
      aria-label="Gullak breaking open"
    >
      {/* Phase 0/1: Whole Gullak with Chiraiya approaching */}
      {phase < 2 && (
        <>
          <Image
            src="/assets/gullak-pot.png"
            alt=""
            width={140}
            height={120}
            style={{
              width: 140,
              height: 120,
              objectFit: 'contain',
              filter:
                phase === 1
                  ? 'drop-shadow(0 0 20px rgba(212,160,23,0.6))'
                  : 'drop-shadow(0 6px 14px rgba(0,0,0,0.2))',
              transition: 'filter 0.3s ease',
              animation: phase === 0 ? 'gentleFloat 1s ease-in-out infinite' : 'none',
            }}
          />
          {/* Chiraiya beak-tap motion */}
          <Image
            src="/assets/chiraiya-v2.png"
            alt=""
            width={50}
            height={42}
            className="absolute"
            style={{
              width: 50,
              height: 42,
              objectFit: 'contain',
              top: '20%',
              right: phase === 0 ? '10%' : '38%',
              transform: phase === 0 ? 'scaleX(-1) rotate(-8deg)' : 'scaleX(-1) rotate(8deg)',
              transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            }}
          />
          {/* Crack overlay appears in phase 1 */}
          {phase >= 1 && (
            <motion.svg
              className="absolute"
              width={140}
              height={120}
              viewBox="0 0 140 120"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{ pointerEvents: 'none' }}
            >
              <path
                d="M 70 30 L 65 50 L 75 60 L 60 78 L 80 90 L 70 100"
                fill="none"
                stroke="#3E1F00"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <path d="M 75 60 L 90 55 L 95 75" fill="none" stroke="#3E1F00" strokeWidth={1.5} strokeLinecap="round" />
            </motion.svg>
          )}
        </>
      )}

      {/* Phase 2: shatter — 4 polygon shards rotate-and-fall + coins/notes burst */}
      {phase >= 2 && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
              animate={{
                opacity: 0,
                x: (i - 1.5) * 80,
                y: 200,
                rotate: (i - 1.5) * 180,
              }}
              transition={{ duration: 1.1, ease: [0.55, 0.06, 0.68, 0.19] }}
              className="absolute"
              style={{
                width: 60,
                height: 60,
                background: 'linear-gradient(135deg, #C4602A, #8B4513)',
                clipPath:
                  i === 0
                    ? 'polygon(0 0, 60% 0, 30% 100%)'
                    : i === 1
                      ? 'polygon(60% 0, 100% 30%, 50% 100%)'
                      : i === 2
                        ? 'polygon(0 30%, 50% 100%, 0 100%)'
                        : 'polygon(100% 30%, 100% 100%, 50% 100%)',
                left: '50%',
                top: '40%',
              }}
            />
          ))}
          {/* Coin burst */}
          {Array.from({ length: 14 }).map((_, i) => {
            const angle = (i / 14) * Math.PI * 2;
            const dist = 90 + Math.random() * 60;
            return (
              <motion.span
                key={i}
                aria-hidden
                className="absolute rounded-full"
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                animate={{
                  x: Math.cos(angle) * dist,
                  y: Math.sin(angle) * dist + 80,
                  opacity: 0,
                  scale: 1,
                  rotate: 540,
                }}
                transition={{ duration: 1.1 + Math.random() * 0.5, ease: 'easeOut' }}
                style={{
                  width: 12,
                  height: 12,
                  background: 'radial-gradient(circle at 35% 35%, #f5d442, #D4A017)',
                  border: '1.5px solid #c49a00',
                  boxShadow: '0 0 6px rgba(212,160,23,0.6)',
                  left: '50%',
                  top: '50%',
                }}
              />
            );
          })}
          {/* Celebrating Chiraiya */}
          <motion.div
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -30, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <Image
              src="/assets/chiraiya-v2.png"
              alt=""
              width={60}
              height={50}
              style={{
                width: 60,
                height: 50,
                objectFit: 'contain',
                animation: 'celebFly 1.6s ease-in-out infinite',
                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))',
              }}
            />
          </motion.div>
        </>
      )}
    </div>
  );
}
