'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastIntent = 'success' | 'warn' | 'undo';

type Toast = {
  id: string;
  intent: ToastIntent;
  title: string;
  body?: string;
  ttlMs?: number;
  onAction?: () => void | Promise<void>;
  actionLabel?: string;
};

type ToastStore = {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'> & { ttlMs?: number }) => string;
  dismiss: (id: string) => void;
};

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, ttlMs: 4000, ...t };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), toast.ttlMs);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] mx-auto flex max-w-md flex-col items-center gap-2 px-4"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'pointer-events-auto flex w-full items-center gap-3 rounded-card border border-divider bg-surface px-4 py-3 shadow-card',
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                t.intent === 'success' && 'bg-growth/10 text-growth',
                t.intent === 'warn' && 'bg-warn/10 text-warn',
                t.intent === 'undo' && 'bg-trust/10 text-trust',
              )}
            >
              {t.intent === 'success' && <CheckCircle2 size={18} />}
              {t.intent === 'warn' && <AlertTriangle size={18} />}
              {t.intent === 'undo' && <RotateCcw size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium leading-tight text-text">{t.title}</div>
              {t.body && <div className="mt-0.5 text-[12px] leading-tight text-muted">{t.body}</div>}
            </div>
            {t.actionLabel && t.onAction && (
              <button
                onClick={async () => {
                  await t.onAction?.();
                  dismiss(t.id);
                }}
                className="haptic-press shrink-0 rounded-btn px-3 py-1.5 text-[13px] font-medium text-trust hover:bg-trust/5"
              >
                {t.actionLabel}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
