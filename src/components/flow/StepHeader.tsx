'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export function StepHeader({
  step,
  total,
  onBack,
  showBack = true,
}: {
  step?: number;
  total?: number;
  onBack?: () => void;
  showBack?: boolean;
}) {
  const router = useRouter();
  return (
    <header className="flex items-center justify-between gap-4 px-1 pb-2">
      {showBack ? (
        <button
          onClick={onBack ?? (() => router.back())}
          aria-label="Back"
          className="haptic-press -ml-2 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-divider/40"
        >
          <ChevronLeft size={20} />
        </button>
      ) : (
        <span className="h-9 w-9" />
      )}
      {step !== undefined && total !== undefined && (
        <div className="flex flex-1 items-center gap-1.5 px-2">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${i < step ? 'bg-text' : 'bg-divider'}`}
              aria-hidden
            />
          ))}
        </div>
      )}
      <span className="h-9 w-9" />
    </header>
  );
}
