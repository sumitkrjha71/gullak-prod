'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const STORAGE_KEY = 'ap_first_time_tips';

function getSeen(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function markSeen(id: string) {
  const seen = getSeen();
  seen[id] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
}

export function FirstTimeTooltip({ id, label, side = 'bottom' }: { id: string; label: string; side?: 'bottom' | 'top' }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!getSeen()[id]) setShow(true);
  }, [id]);

  const dismiss = () => {
    markSeen(id);
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: side === 'bottom' ? -4 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute z-20 mt-2 inline-flex max-w-[240px] items-start gap-2 rounded-card bg-text px-3 py-2 text-[12px] text-bg shadow-card"
          role="tooltip"
        >
          <span className="leading-snug">{label}</span>
          <button onClick={dismiss} aria-label="Dismiss tip" className="opacity-70 hover:opacity-100">
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
