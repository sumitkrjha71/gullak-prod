'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, Check } from 'lucide-react';
import { DailySpendSlider } from '@/components/money/DailySpendSlider';

type Slide = { title: string; body: string; chip: string };
type Labels = {
  title: string;
  skip: string;
  next: string;
  start: string;
  slides: Slide[];
  slide4Bullets: string[];
};

export function SavestmentDeck({ locale, labels }: { locale: string; labels: Labels }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const total = labels.slides.length;
  const slide = labels.slides[idx];
  const last = idx === total - 1;

  const next = () => {
    if (last) router.push(`/${locale}/onboarding/phone`);
    else setIdx((i) => i + 1);
  };
  const prev = () => {
    if (idx === 0) router.push(`/${locale}/language-select`);
    else setIdx((i) => i - 1);
  };

  return (
    <main className="relative flex min-h-dvh w-full flex-col" style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 pt-3">
        <button
          onClick={prev}
          aria-label="Back"
          className="haptic-press flex h-9 w-9 items-center justify-center rounded-full hover:bg-border/40"
          style={{ color: 'var(--muted)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-1 items-center justify-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className="h-1 rounded-full transition-all"
              style={{
                width: i === idx ? 28 : 12,
                background: i <= idx ? 'var(--saffron)' : 'var(--border)',
              }}
            />
          ))}
        </div>
        <Link
          href={`/${locale}/onboarding/phone`}
          className="haptic-press text-[12px] font-semibold"
          style={{ color: 'var(--muted)' }}
        >
          {labels.skip}
        </Link>
      </header>

      {/* Slide stage */}
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center overflow-y-auto px-6 pt-4 pb-2">
        <SlideArtwork idx={idx} />

        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 w-full text-center"
          >
            <h1
              className="text-balance"
              style={{
                fontSize: 'clamp(20px, 5.6vw, 24px)',
                fontWeight: 800,
                lineHeight: 1.25,
                color: 'var(--text)',
                letterSpacing: -0.2,
              }}
            >
              {slide.title}
            </h1>

            {slide.body && (
              <p
                className="mt-3 mx-auto max-w-[360px] text-balance"
                style={{
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: 'var(--muted)',
                }}
              >
                {slide.body}
              </p>
            )}

            {slide.chip && idx !== 3 && (
              <div
                className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
                style={{
                  background: idx === 0 ? '#FFE9D2' : idx === 1 ? 'var(--trust-soft)' : 'var(--growth-soft)',
                  color: idx === 0 ? '#9A4500' : idx === 1 ? 'var(--trust)' : 'var(--growth)',
                  fontSize: 12.5,
                  fontWeight: 700,
                  letterSpacing: 0.1,
                }}
              >
                {idx === 1 && <span aria-hidden>🔒</span>}
                {slide.chip}
              </div>
            )}

            {/* Slide 4: bullet list with green ticks */}
            {idx === 3 && (
              <ul className="mx-auto mt-5 flex max-w-[360px] flex-col gap-2.5 text-left">
                {labels.slide4Bullets.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5"
                    style={{
                      animation: `slideUp 0.5s var(--ease-calm) ${0.15 + i * 0.12}s both`,
                    }}
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ background: 'var(--growth)', color: '#fff' }}
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span
                      style={{
                        fontSize: 14.5,
                        lineHeight: 1.45,
                        color: 'var(--text)',
                        fontWeight: 600,
                      }}
                    >
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Final slide includes the interactive Daily-Spend Slider — the conversion moment */}
        {last && (
          <div className="mt-5 w-full">
            <DailySpendSlider initial={30} />
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="safe-bottom mx-auto w-full max-w-md px-6 pb-2">
        <button
          onClick={next}
          className="haptic-press cta-primary flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[16px] font-bold"
        >
          {last ? labels.start : labels.next}
          <ArrowRight size={16} />
        </button>
        <p className="mt-3 text-center text-[11px]" style={{ color: 'var(--trust)' }}>
          100% Safe · RBI Regulated Partners
        </p>
      </div>
    </main>
  );
}

/* === Slide Artworks === */

function SlideArtwork({ idx }: { idx: number }) {
  return (
    <div className="relative mx-auto flex h-52 w-full items-center justify-center" key={`art-${idx}`}>
      {idx === 0 && <Slide0 />}
      {idx === 1 && <Slide1 />}
      {idx === 2 && <Slide2 />}
      {idx === 3 && <Slide3 />}
    </div>
  );
}

/** Slide 0 — Money sits idle. Coin drops in then bounces back out (escape metaphor). */
function Slide0() {
  return (
    <motion.div
      key="s0"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative"
    >
      <Image
        src="/assets/gullak-pot.png"
        alt=""
        width={150}
        height={130}
        priority
        style={{
          width: 150,
          height: 130,
          objectFit: 'contain',
          filter: 'drop-shadow(0 6px 14px rgba(196, 96, 42, 0.18))',
        }}
        className="anim-float"
      />
      {/* Coin: drops in, then ESCAPES (rises out + fades) — illustrates idle money */}
      <span
        aria-hidden
        className="absolute"
        style={{
          top: 40,
          left: '50%',
          width: 18,
          height: 18,
          marginLeft: -9,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #f5d442, #D4A017, #a07800)',
          border: '1.5px solid #c49a00',
          boxShadow: '0 0 6px rgba(212,160,23,0.45)',
          animation: 'coinDrop 2.4s ease-in-out infinite',
        }}
      />
    </motion.div>
  );
}

/** Slide 1 — Bank → Chiraiya carries coin → Gullak. Uses fixed birdProjectile. */
function Slide1() {
  const flightRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(120);

  useEffect(() => {
    function measure() {
      if (!flightRef.current) return;
      const w = flightRef.current.getBoundingClientRect().width;
      setDistance(Math.max(80, w - 30));
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <motion.div
      key="s1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative flex w-full items-center justify-between px-2"
    >
      {/* Bank */}
      <div
        className="flex flex-col items-center gap-1 px-3 py-3"
        style={{
          background: 'linear-gradient(180deg, #e6f0ff, #cfdcf5)',
          border: '1px solid #b8c6dd',
          borderRadius: 14,
          boxShadow: 'var(--shadow-card)',
          minWidth: 64,
        }}
      >
        <span aria-hidden style={{ fontSize: 26 }}>🏦</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1f3a6e' }}>Bank</span>
      </div>

      {/* Sparrow + coin in flight — full distance */}
      <div ref={flightRef} className="relative mx-3 h-14 flex-1" style={{ ['--carry-distance' as never]: `${distance}px` }}>
        <Image
          src="/assets/chiraiya-v2.png"
          alt=""
          width={44}
          height={36}
          style={{
            width: 44,
            height: 36,
            objectFit: 'contain',
            position: 'absolute',
            top: 6,
            left: 0,
            animation: 'birdProjectile 2.4s ease-in-out infinite',
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.18))',
          }}
        />
        <span
          aria-hidden
          className="absolute"
          style={{
            top: 18,
            left: 18,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #f5d442, #D4A017)',
            border: '1.5px solid #c49a00',
            animation: 'coinProjectile 2.4s ease-in-out infinite',
            boxShadow: '0 0 6px rgba(212,160,23,0.6)',
          }}
        />
      </div>

      {/* Gullak — glowing receiver */}
      <Image
        src="/assets/gullak-pot.png"
        alt=""
        width={88}
        height={74}
        style={{
          width: 88,
          height: 74,
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 18px rgba(212,160,23,0.45)) drop-shadow(0 4px 8px rgba(196, 96, 42, 0.2))',
        }}
        className="anim-float"
      />
    </motion.div>
  );
}

/** Slide 2 — Real market-shaped growth line with sparrow flying along the curve to the Gullak. */
function Slide2() {
  // 12 points — visible volatility, trending up.
  const pts = [10, 18, 14, 24, 22, 32, 30, 42, 50, 48, 58, 70];
  const w = 240, h = 110;
  const path = pts
    .map((y, i) => {
      const x = (i / (pts.length - 1)) * w;
      const yScaled = h - (y / 80) * h;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yScaled.toFixed(1)}`;
    })
    .join(' ');

  return (
    <motion.div
      key="s2"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative flex w-full items-end justify-between"
    >
      {/* Chart on left/center */}
      <div className="relative flex-1">
        <svg width="100%" height={h + 24} viewBox={`0 0 ${w} ${h + 24}`} className="block" aria-hidden>
          <defs>
            <linearGradient id="growthLineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1A7A4A" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#1A7A4A" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Soft grid */}
          {[20, 50, 80].map((g) => (
            <line key={g} x1={0} y1={g} x2={w} y2={g} stroke="#E6DDC9" strokeWidth={0.5} strokeDasharray="2 4" />
          ))}
          {/* Filled area */}
          <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#growthLineFill)" />
          {/* The line itself, drawn with chartDraw */}
          <path
            d={path}
            fill="none"
            stroke="#1A7A4A"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 800,
              strokeDashoffset: 800,
              animation: 'chartDraw 1.8s ease-out forwards',
            }}
          />
          {/* Dot at last point */}
          <circle
            cx={w}
            cy={h - (pts[pts.length - 1] / 80) * h}
            r={4}
            fill="#1A7A4A"
            style={{ animation: 'fadeIn 0.5s 1.6s ease-out both' }}
          />
        </svg>

        {/* Sparrow climbs along the curve */}
        <Image
          src="/assets/chiraiya-v2.png"
          alt=""
          width={42}
          height={34}
          className="absolute"
          style={{
            width: 42,
            height: 34,
            objectFit: 'contain',
            left: 0,
            top: h - (pts[0] / 80) * h - 24,
            animation: 'birdClimbCurve 2s 0.4s ease-out forwards, gentleFloat 2.4s 2.4s ease-in-out infinite',
            transform: 'scaleX(-1)',
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.18))',
          }}
        />
        <style jsx>{`
          @keyframes birdClimbCurve {
            0%   { left: 0px;   top: ${h - (pts[0] / 80) * h - 24}px; transform: scaleX(-1) rotate(-3deg); }
            50%  { left: 110px; top: ${h - (pts[6] / 80) * h - 22}px; transform: scaleX(-1) rotate(-8deg); }
            100% { left: ${w - 50}px; top: ${h - (pts[pts.length - 1] / 80) * h - 28}px; transform: scaleX(-1) rotate(-2deg); }
          }
        `}</style>
      </div>

      {/* Gullak anchored to last data point */}
      <Image
        src="/assets/gullak-pot.png"
        alt=""
        width={70}
        height={60}
        className="ml-1"
        style={{
          width: 70,
          height: 60,
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 16px rgba(212,160,23,0.5))',
          animation: 'glow 2.8s 1.6s ease-in-out infinite',
        }}
      />
    </motion.div>
  );
}

/** Slide 3 — Gullak with Chiraiya holding control. */
function Slide3() {
  return (
    <motion.div
      key="s3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative"
    >
      <Image
        src="/assets/gullak-pot.png"
        alt=""
        width={140}
        height={120}
        style={{
          width: 140,
          height: 120,
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 22px rgba(212,160,23,0.45))',
        }}
        className="anim-float"
      />
      {/* Lock chip indicating control */}
      <span
        className="absolute flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
        style={{
          top: -4,
          right: -10,
          background: 'var(--trust-soft)',
          color: 'var(--trust)',
          border: '1px solid #cdebe5',
        }}
        aria-hidden
      >
        🔒 You
      </span>
      {/* Chiraiya celebrating */}
      <Image
        src="/assets/chiraiya-v2.png"
        alt=""
        width={48}
        height={40}
        className="absolute"
        style={{
          bottom: 6,
          right: -22,
          width: 48,
          height: 40,
          objectFit: 'contain',
          animation: 'celebFly 2.2s ease-in-out infinite',
          transform: 'scaleX(-1)',
        }}
      />
    </motion.div>
  );
}
