// OneActionScreen: enforces ≤1 primary CTA per screen at the type level.
// Use this wrapper for every onboarding/flow screen.

import { ReactNode } from 'react';

export function OneActionScreen({
  header,
  title,
  sub,
  children,
  primary,
  secondary,
  footer,
}: {
  header?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  primary: ReactNode; // exactly one — type-enforced
  secondary?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="min-h-dvh flex flex-col bg-bg">
      <div className="safe-top mx-auto w-full max-w-md px-5 pt-4">{header}</div>
      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-32">
        <div className="mt-2">
          <h1 className="text-h2 font-semibold tracking-tight text-balance">{title}</h1>
          {sub && <p className="mt-2 text-[15px] leading-relaxed text-muted text-balance">{sub}</p>}
        </div>
        {children && <div className="mt-7">{children}</div>}
      </div>
      <div className="safe-bottom sticky bottom-0 left-0 right-0 mx-auto w-full max-w-md border-t border-divider bg-bg/90 px-5 pt-4 backdrop-blur">
        <div className="flex flex-col gap-2">
          {primary}
          {secondary}
        </div>
        {footer && <div className="mt-3 text-center">{footer}</div>}
      </div>
    </main>
  );
}
