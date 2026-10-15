import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Generic surface. Domain cards (CafeCard etc.) arrive with the Place model in later phases. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-border bg-surface p-5 shadow-card md:p-6', className)}
      {...props}
    />
  );
}
