'use client';

import { Lock, ShieldCheck, EyeOff, BadgeCheck, Hand } from 'lucide-react';
import { cn } from '@/lib/utils';

type Intent = 'encrypted' | 'stopAnytime' | 'inYourName' | 'noHidden' | 'notSold' | 'notHeld';

import { LucideIcon } from "lucide-react";

const meta: Record<Intent, { Icon: LucideIcon }> = {
  encrypted: { Icon: Lock },
  stopAnytime: { Icon: Hand },
  inYourName: { Icon: BadgeCheck },
  noHidden: { Icon: EyeOff },
  notSold: { Icon: EyeOff },
  notHeld: { Icon: ShieldCheck },
};

export function TrustBadge({
  intent,
  label,
  className,
}: {
  intent: Intent;
  label: string;
  className?: string;
}) {
  const { Icon } = meta[intent];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-trust/8 px-2.5 py-1 text-[11px] font-medium text-trust',
        className,
      )}
    >
      <Icon size={12} aria-hidden />
      <span>{label}</span>
    </span>
  );
}
