import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Decorative loading placeholder (hidden from assistive tech). The parent region should announce loading,
 * e.g. with role="status" and visually hidden text, and set aria-busy while content is pending.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-surface-muted', className)}
      {...props}
    />
  );
}
