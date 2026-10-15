import { Search } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './button';

export interface SearchBoxProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Called with the trimmed query when the user submits a non-empty value. */
  onSubmit: (query: string) => void;
  /** Accessible label (visually hidden). */
  label?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Keyboard-accessible natural-language search. Enter or the button submits; an empty value is not
 * submitted and shows an inline error instead. It only collects the query: intent extraction comes later.
 */
export function SearchBox({
  value,
  onValueChange,
  onSubmit,
  label = 'Mô tả quán cà phê bạn muốn tìm',
  placeholder = 'Ví dụ: quán yên tĩnh để làm việc ở Gò Vấp, dưới 70.000đ',
  className,
  autoFocus,
}: SearchBoxProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const [showEmptyError, setShowEmptyError] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = value.trim();
    if (!query) {
      setShowEmptyError(true);
      return;
    }
    setShowEmptyError(false);
    onSubmit(query);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={cn('w-full', className)} noValidate>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="flex flex-col gap-2 rounded-search border border-border-strong bg-surface p-2 shadow-card focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-700 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
          <Search aria-hidden="true" className="size-5 shrink-0 text-text-muted" />
          <input
            id={id}
            type="search"
            name="q"
            value={value}
            onChange={(event) => {
              onValueChange(event.target.value);
              if (showEmptyError) setShowEmptyError(false);
            }}
            placeholder={placeholder}
            autoComplete="off"
            autoFocus={autoFocus}
            aria-invalid={showEmptyError || undefined}
            aria-describedby={showEmptyError ? errorId : undefined}
            className="h-12 min-w-0 flex-1 bg-transparent text-base text-text placeholder:text-text-muted focus-visible:outline-none"
          />
        </div>
        <Button type="submit" size="lg" className="sm:shrink-0">
          Tìm quán
        </Button>
      </div>
      {showEmptyError ? (
        <p id={errorId} role="alert" className="mt-2 px-2 text-sm text-danger">
          Hãy mô tả quán bạn muốn tìm trước khi tìm kiếm.
        </p>
      ) : null}
    </form>
  );
}
