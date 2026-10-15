import { Check } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Toggle state. When provided the chip behaves as a toggle button (aria-pressed). */
  selected?: boolean;
}

/**
 * Generic chip. The selected state is conveyed by a check icon, a stronger border and aria-pressed,
 * never by color alone. Text stays `text` on brand-100 (12.81:1). IntentChip (phase 4) builds on this.
 */
export function Chip({ selected, className, children, type = 'button', ...props }: ChipProps) {
  const isToggle = selected !== undefined;
  return (
    <button
      type={type}
      aria-pressed={isToggle ? selected : undefined}
      className={cn(
        'inline-flex min-h-10 items-center gap-1.5 rounded-md border px-3.5 py-1.5 text-sm font-medium text-text transition-colors',
        selected
          ? 'border-brand-500 bg-brand-100'
          : 'border-border-strong bg-surface hover:bg-surface-muted',
        className,
      )}
      {...props}
    >
      {selected ? <Check aria-hidden="true" className="size-4 shrink-0" /> : null}
      {children}
    </button>
  );
}
