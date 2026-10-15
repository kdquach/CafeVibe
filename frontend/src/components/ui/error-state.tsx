import { TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  /** When provided, a retry button is shown. */
  onRetry?: () => void;
  /** True while a retry is in flight. */
  retrying?: boolean;
  className?: string;
}

/** Announced to assistive tech immediately (role="alert"). Status is conveyed by icon + wording. */
export function ErrorState({
  title = 'Đã có lỗi xảy ra',
  description,
  onRetry,
  retrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-3 rounded-lg border border-danger bg-surface p-5',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
        <div>
          <p className="font-semibold text-danger">{title}</p>
          {description ? <p className="mt-1 text-text">{description}</p> : null}
        </div>
      </div>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry} loading={retrying}>
          {retrying ? 'Đang thử lại…' : 'Thử lại'}
        </Button>
      ) : null}
    </div>
  );
}
