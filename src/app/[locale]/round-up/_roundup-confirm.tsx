'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { OneActionScreen } from '@/components/flow/OneActionScreen';
import { StepHeader } from '@/components/flow/StepHeader';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toaster';
import { EmptyState } from '@/components/patterns/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

type Item = { spend: string; rounded: string; save: string };

export function RoundupConfirm({
  locale,
  goalId,
  goalTitle,
  totalRupees,
  itemCount,
  items,
  labels,
}: {
  locale: string;
  goalId: string | null;
  goalTitle: string;
  totalRupees: number;
  itemCount: number;
  items: Item[];
  labels: {
    title: string;
    sub: string;
    primary: string;
    secondary: string;
    items: string;
    spend: string;
    rounded: string;
    save: string;
    totalLabel: string;
    added: string;
    emptyTitle: string;
    emptySub: string;
    undo: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(itemCount <= 3);
  const [loading, setLoading] = useState(false);
  const push = useToast((s) => s.push);

  if (itemCount === 0) {
    return (
      <main className="min-h-dvh bg-bg pb-20">
        <div className="safe-top mx-auto w-full max-w-md px-5 pt-3">
          <StepHeader />
        </div>
        <div className="mx-auto w-full max-w-md px-5">
          <h1 className="text-h2 font-semibold tracking-tight">{labels.title}</h1>
          <div className="mt-6">
            <EmptyState title={labels.emptyTitle} body={labels.emptySub} />
          </div>
        </div>
      </main>
    );
  }

  const submit = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/sim/roundup-confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ goalId }),
      });
      const j = await r.json();
      if (r.ok && j.txnId) {
        push({
          intent: 'undo',
          title: labels.added,
          actionLabel: 'Undo',
          ttlMs: 10000,
          onAction: async () => {
            await fetch('/api/transactions/undo', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ transactionId: j.txnId }),
            });
            router.refresh();
          },
        });
        router.push(`/${locale}/home`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <OneActionScreen
      header={<StepHeader />}
      title={labels.title}
      sub={labels.sub}
      primary={
        <Button block onClick={submit} loading={loading} disabled={!goalId}>
          {labels.primary}
        </Button>
      }
      secondary={
        <Button variant="ghost" block onClick={() => router.push(`/${locale}/home`)}>
          {labels.secondary}
        </Button>
      }
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="haptic-press flex w-full items-center justify-between rounded-card border border-divider bg-surface px-4 py-3 text-left"
      >
        <span className="text-[12px] uppercase tracking-wider text-muted">{labels.items}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 grid gap-2">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 rounded-card border border-divider bg-surface px-4 py-2.5 text-[13px] money">
                  <span className="text-muted">
                    {labels.spend}: <span className="text-text">{it.spend}</span>
                  </span>
                  <span className="text-muted">
                    {labels.rounded}: <span className="text-text">{it.rounded}</span>
                  </span>
                  <span className="text-growth text-right">
                    {labels.save}: {it.save}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-3 flex items-center justify-between rounded-card bg-growth/6 px-4 py-3 text-[14px]">
        <span className="text-muted">{labels.totalLabel}</span>
        <span className="font-semibold text-growth tabular-nums money">₹{new Intl.NumberFormat('en-IN').format(totalRupees)}</span>
      </div>
      {goalTitle && <p className="mt-3 text-center text-[12px] text-muted">→ {goalTitle}</p>}
    </OneActionScreen>
  );
}
