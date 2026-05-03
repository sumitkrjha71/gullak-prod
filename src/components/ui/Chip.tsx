'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const chipVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-colors haptic-press',
  {
    variants: {
      variant: {
        neutral: 'bg-divider/40 text-text',
        trust: 'bg-trust/10 text-trust',
        growth: 'bg-growth/10 text-growth',
        warn: 'bg-warn/10 text-warn',
        outline: 'border border-divider text-text',
      },
      selectable: {
        true: 'cursor-pointer',
        false: '',
      },
      selected: {
        true: 'ring-2 ring-text/80 bg-text text-bg',
        false: '',
      },
    },
    defaultVariants: { variant: 'neutral', selectable: false, selected: false },
  },
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {}

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, variant, selectable, selected, ...props }, ref) => (
    <span ref={ref} className={cn(chipVariants({ variant, selectable, selected }), className)} {...props} />
  ),
);
Chip.displayName = 'Chip';
