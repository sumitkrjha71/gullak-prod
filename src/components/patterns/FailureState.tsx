'use client';

import { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

export function FailureCard({
  title,
  body,
  action,
  secondary,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-warn/20 bg-warn/4 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warn/12 text-warn">
          <AlertTriangle size={16} aria-hidden />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-text">{title}</p>
          {body && <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{body}</p>}
          {(action || secondary) && (
            <div className="mt-3 flex items-center gap-2">
              {action}
              {secondary}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
