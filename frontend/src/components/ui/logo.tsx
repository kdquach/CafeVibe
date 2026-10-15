import { Coffee } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-2 font-heading text-xl font-bold', className)}
    >
      <Coffee aria-hidden="true" className="size-6 text-brand-700" />
      CafeVibe
    </span>
  );
}
