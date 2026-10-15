import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Content column: max width 1200px (design-system-v1: 1200–1280) with responsive gutters. */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mx-auto w-full max-w-[75rem] px-4 sm:px-6 lg:px-8', className)}
      {...props}
    />
  );
}
