'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Bell, Sparkles, Info } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import { cn } from '@/lib/utils';

type Item = {
  id: string;
  category: string;
  titleKey: string;
  bodyKey: string;
  deepLink: string | null;
  createdAt: string;
  read: boolean;
};

export function NotificationList({
  items,
  labels,
}: {
  items: Item[];
  labels: { actionable: string; info: string; milestone: string };
}) {
  const t = useTranslations();
  const [filter, setFilter] = useState<'all' | 'actionable' | 'info' | 'milestone'>('all');
  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Chip selectable selected={filter === 'all'} onClick={() => setFilter('all')} role="button" tabIndex={0}>
          All
        </Chip>
        <Chip selectable selected={filter === 'actionable'} onClick={() => setFilter('actionable')} role="button" tabIndex={0}>
          {labels.actionable}
        </Chip>
        <Chip selectable selected={filter === 'info'} onClick={() => setFilter('info')} role="button" tabIndex={0}>
          {labels.info}
        </Chip>
        <Chip selectable selected={filter === 'milestone'} onClick={() => setFilter('milestone')} role="button" tabIndex={0}>
          {labels.milestone}
        </Chip>
      </div>
      <div className="grid gap-2">
        {filtered.map((it) => (
          <Link
            key={it.id}
            href={it.deepLink ?? '#'}
            className={cn(
              'card haptic-press flex items-start gap-3 p-3',
              !it.read && 'border-trust/30',
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-trust/8 text-trust">
              {it.category === 'milestone' ? <Sparkles size={14} /> : it.category === 'info' ? <Info size={14} /> : <Bell size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold leading-tight">{safe(t, it.titleKey)}</div>
              <div className="mt-0.5 text-[12px] leading-snug text-muted">{safe(t, it.bodyKey)}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-muted">
                {new Date(it.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function safe(t: ReturnType<typeof useTranslations>, key: string) {
  try {
    return t(key as never);
  } catch {
    return key;
  }
}
