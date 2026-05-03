'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function WhyWeAsk({ label, body }: { label: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="haptic-press inline-flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-text"
        aria-expanded={open}
      >
        <Info size={12} aria-hidden />
        <span>{label}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 overflow-hidden rounded-card border border-divider bg-surface px-3 py-2 text-[12px] leading-relaxed text-muted"
          >
            {body}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
