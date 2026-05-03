'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';

const STORAGE_KEY = 'gullak_walkthrough_done';

type Step = { selector: string; title: string; body: string };
type Labels = { skip: string; next: string; done: string };

export function Walkthrough({ steps, labels }: { steps: Step[]; labels: Labels }) {
  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [target, setTarget] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY) === '1') return;
    // Wait one frame so layout is ready.
    const t = setTimeout(() => setActive(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!active) return;
    const step = steps[idx];
    if (!step) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const t = setTimeout(() => {
      setTarget(el.getBoundingClientRect());
    }, 250);
    return () => clearTimeout(t);
  }, [active, idx, steps]);

  const finish = () => {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, '1');
    setActive(false);
  };
  const next = () => {
    if (idx >= steps.length - 1) finish();
    else setIdx((i) => i + 1);
  };

  if (!active || !target) return null;
  const step = steps[idx];
  const last = idx === steps.length - 1;

  // Position the tooltip below the target (or above if it'd overflow).
  const padding = 8;
  const tooltipBelow = target.bottom + 220 < window.innerHeight;
  const tooltipTop = tooltipBelow ? target.bottom + padding + 8 : target.top - padding - 200;

  return (
    <AnimatePresence>
      <motion.div
        key="wt-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Cut-out: 4 dim quadrants around the target */}
        <div className="absolute inset-x-0 top-0 bg-black/55" style={{ height: target.top - padding }} />
        <div
          className="absolute left-0 bg-black/55"
          style={{
            top: target.top - padding,
            width: target.left - padding,
            height: target.height + padding * 2,
          }}
        />
        <div
          className="absolute right-0 bg-black/55"
          style={{
            top: target.top - padding,
            left: target.right + padding,
            right: 0,
            height: target.height + padding * 2,
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 bg-black/55"
          style={{ top: target.bottom + padding }}
        />

        {/* Highlight outline */}
        <div
          className="absolute pointer-events-none rounded-card"
          style={{
            top: target.top - padding,
            left: target.left - padding,
            width: target.width + padding * 2,
            height: target.height + padding * 2,
            boxShadow: '0 0 0 3px rgba(232,101,10,0.85), 0 0 24px rgba(232,101,10,0.45)',
          }}
        />

        {/* Tooltip card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute mx-4 max-w-[calc(100vw-32px)] rounded-card-lg bg-surface p-4 shadow-card"
          style={{
            top: Math.max(16, tooltipTop),
            left: 16,
            right: 16,
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[14px] font-bold text-text">{step.title}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{step.body}</p>
            </div>
            <button
              onClick={finish}
              aria-label="Skip"
              className="haptic-press shrink-0 rounded-full p-1 text-muted hover:bg-border/40"
            >
              <X size={14} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: i === idx ? 16 : 6,
                    background: i <= idx ? 'var(--saffron)' : 'var(--border)',
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={finish}
                className="haptic-press text-[12px] font-semibold text-muted"
              >
                {labels.skip}
              </button>
              <button
                onClick={next}
                className="haptic-press cta-primary inline-flex items-center gap-1 rounded-btn px-4 py-2 text-[12px] font-bold"
              >
                {last ? labels.done : labels.next}
                {!last && <ArrowRight size={12} />}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
