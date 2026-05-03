'use client';

import CountUp from 'react-countup';
import { paiseToRupeeNumber } from '@/lib/format/money';
import { cn } from '@/lib/utils';

const NBSP = ' ';

export function AmountDisplay({
  paise,
  size = 'md',
  animate = true,
  className,
}: {
  paise: number | bigint;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  className?: string;
}) {
  const value = paiseToRupeeNumber(paise);
  const sizeClass = {
    sm: 'text-[14px]',
    md: 'text-[18px]',
    lg: 'text-[28px]',
    xl: 'text-[40px] tracking-tight',
  }[size];

  return (
    <span className={cn('money font-semibold tabular-nums', sizeClass, className)}>
      <span className="opacity-60 mr-1">₹</span>
      {animate ? (
        <CountUp end={value} separator="," duration={0.6} preserveValue useEasing easingFn={(t, b, c, d) => {
          // ease-out cubic
          t /= d;
          t -= 1;
          return c * (t * t * t + 1) + b;
        }} />
      ) : (
        new Intl.NumberFormat('en-IN').format(value)
      )}
    </span>
  );
}
