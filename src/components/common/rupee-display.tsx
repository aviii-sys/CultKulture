import React from 'react';
import { formatIndianRupees } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';

interface RupeeDisplayProps {
  amount: number | null | undefined;
  className?: string;
  showColor?: boolean; // Green for positive, red for negative
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function RupeeDisplay({
  amount,
  className,
  showColor = false,
  size = 'md',
}: RupeeDisplayProps) {
  const num = amount ?? 0;

  const sizeClasses = {
    sm: 'text-sm font-medium',
    md: 'text-base font-semibold',
    lg: 'text-lg font-bold',
    xl: 'text-2xl font-bold tracking-tight',
    '2xl': 'text-3xl sm:text-4xl font-extrabold tracking-tight',
  };

  const colorClass = showColor
    ? num > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : num < 0
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-muted-foreground'
    : '';

  return (
    <span className={cn('tabular-nums font-sans', sizeClasses[size], colorClass, className)}>
      {formatIndianRupees(num)}
    </span>
  );
}
