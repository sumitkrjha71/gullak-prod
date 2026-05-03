'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { locales, localeLabels, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ current, label }: { current: Locale; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const switchTo = (next: Locale) => {
    const segments = pathname.split('/');
    if (segments[1] && (locales as readonly string[]).includes(segments[1])) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    setOpen(false);
    router.push(segments.join('/') || '/');
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="haptic-press inline-flex items-center gap-1.5 rounded-full border border-divider bg-surface px-3 py-1.5 text-[12px] font-medium text-text"
        aria-label="Change language"
      >
        <Languages size={14} aria-hidden />
        <span>{localeLabels[current]}</span>
      </button>
      <Sheet open={open} onOpenChange={setOpen} title={label}>
        <div className="grid gap-2 pb-2">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => switchTo(l)}
              className={cn(
                'haptic-press flex items-center justify-between rounded-card border border-divider px-4 py-3 text-left',
                current === l ? 'bg-text text-bg border-text' : 'bg-surface text-text',
              )}
            >
              <span className="text-[16px] font-medium">{localeLabels[l]}</span>
              {current === l && <span className="text-[12px] opacity-80">✓</span>}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
