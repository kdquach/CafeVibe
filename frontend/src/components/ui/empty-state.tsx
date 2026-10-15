import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  /** Heading level, so the state fits the page outline. */
  headingLevel?: 2 | 3;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  headingLevel = 2,
  className,
}: EmptyStateProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg border border-dashed border-border-strong bg-surface px-6 py-10 text-center',
        className,
      )}
    >
      {icon ? (
        <div aria-hidden="true" className="mb-4 text-text-muted">
          {icon}
        </div>
      ) : null}
      <Heading className="text-h4 font-semibold">{title}</Heading>
      {description ? <p className="mt-2 max-w-prose text-text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
