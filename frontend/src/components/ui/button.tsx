import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Primary uses DARK text on brand-500 (5.01:1). White on brand-500 is only 3.09:1 and fails WCAG AA.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors select-none disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-brand-500 text-text hover:bg-brand-550 active:bg-brand-550',
        secondary:
          'border border-border-strong bg-surface text-text hover:bg-surface-muted active:bg-surface-muted',
        ghost: 'text-text hover:bg-surface-muted active:bg-surface-muted',
      },
      size: {
        md: 'h-11 px-5 text-base',
        lg: 'h-12 px-6 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render the child element (e.g. a router Link) with button styling instead of a <button>. */
  asChild?: boolean;
  /** Shows a spinner and blocks activation while an action is in flight. Ignored with asChild. */
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> : null}
      {children}
    </button>
  );
}
