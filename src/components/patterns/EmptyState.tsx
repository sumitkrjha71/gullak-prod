import { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-divider/40 text-muted">
        {icon ?? <Sparkles size={18} aria-hidden />}
      </div>
      <h3 className="text-[16px] font-semibold tracking-tight">{title}</h3>
      {body && <p className="text-[13px] text-muted text-balance">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
