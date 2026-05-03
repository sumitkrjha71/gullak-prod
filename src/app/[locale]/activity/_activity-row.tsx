'use client';

import { ArrowUpRight, AlertTriangle, RotateCcw, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type Status = 'success' | 'failed' | 'pending' | 'reversed';

export function ActivityRow({
  amount,
  source,
  status,
  goalTitle,
  createdAt,
  failureKey,
}: {
  amount: string;
  source: string;
  status: Status;
  goalTitle: string;
  createdAt: Date | string;
  failureKey?: string | null;
}) {
  const t = useTranslations();
  const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const reason = failureKey ? safe(t, failureKey) : null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-card border bg-surface p-3',
        status === 'failed' ? 'border-warn/20' : 'border-divider',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          status === 'success' && 'bg-growth/10 text-growth',
          status === 'failed' && 'bg-warn/10 text-warn',
          status === 'pending' && 'bg-divider/40 text-muted',
          status === 'reversed' && 'bg-trust/10 text-trust',
        )}
      >
        {status === 'success' && <ArrowUpRight size={16} aria-hidden />}
        {status === 'failed' && <AlertTriangle size={16} aria-hidden />}
        {status === 'pending' && <Clock size={16} aria-hidden />}
        {status === 'reversed' && <RotateCcw size={16} aria-hidden />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[14px] font-medium truncate">
            {source}
            {goalTitle && <span className="text-muted"> · {goalTitle}</span>}
          </span>
          <span className={cn('text-[14px] font-semibold tabular-nums money', status === 'failed' && 'text-warn')}>
            {amount}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-3 text-[11px] text-muted">
          <span>
            {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ·{' '}
            {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {reason && <span className="truncate text-warn">{reason}</span>}
        </div>
      </div>
    </div>
  );
}

function safe(t: ReturnType<typeof useTranslations>, key: string) {
  try {
    return t(key as never);
  } catch {
    return null;
  }
}
