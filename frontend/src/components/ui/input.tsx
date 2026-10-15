import { CircleAlert } from 'lucide-react';
import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  /** Required: every field has a programmatically associated label. */
  label: string;
  /** Visually hide the label but keep it for assistive technology. */
  hideLabel?: boolean;
  hint?: string;
  /** Error message. Shown with an icon and wording, not color alone. */
  error?: string;
  id?: string;
}

export function Input({
  label,
  hideLabel = false,
  hint,
  error,
  id,
  className,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className={cn('mb-1.5 block text-sm font-medium text-text', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          'h-12 w-full rounded-md border bg-surface px-4 text-base text-text placeholder:text-text-muted',
          error ? 'border-danger' : 'border-border-strong',
          className,
        )}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm text-danger">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
