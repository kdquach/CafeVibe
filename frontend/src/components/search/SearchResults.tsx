import { Coffee } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { ConstraintStatus, SearchResult } from '@/features/search/schemas';

const STATUS_LABEL: Record<ConstraintStatus, string> = {
  met: 'Đạt',
  not_met: 'Chưa đạt',
  unknown: 'Chưa rõ',
};

function ConstraintLine({ name, status }: { name: string; status: ConstraintStatus }) {
  return (
    <li className="text-sm">
      <span className="text-text-muted">{name}: </span>
      <span className="font-medium text-text">{STATUS_LABEL[status]}</span>
    </li>
  );
}

function ResultCard({ result }: { result: SearchResult }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-h4 font-semibold">{result.name}</h3>
          <p className="mt-1 text-sm text-text-muted">
            {result.district} · {result.address}
          </p>
        </div>
        {result.source === 'mock' ? (
          <span className="shrink-0 rounded border border-border-strong px-2 py-0.5 text-xs text-text-muted">
            Dữ liệu mẫu
          </span>
        ) : null}
      </div>
      <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
        {result.constraints.map((c, i) => (
          <ConstraintLine key={`${c.name}-${i}`} name={c.name} status={c.status} />
        ))}
      </ul>
      {result.hasUnmetRequired ? (
        <p className="mt-3 rounded-md border border-border-strong bg-surface-muted p-2 text-sm">
          Có điều kiện bắt buộc chưa đạt hoặc chưa rõ.
        </p>
      ) : null}
    </Card>
  );
}

export function SearchResults({ results }: { results: SearchResult[] }) {
  if (results.length === 0) {
    return (
      <EmptyState
        icon={<Coffee className="size-8" />}
        title="Không tìm thấy quán phù hợp"
        description="Hãy thử nới điều kiện tìm kiếm, ví dụ đổi khu vực hoặc tăng ngân sách."
        headingLevel={3}
      />
    );
  }
  return (
    <div aria-live="polite" className="flex flex-col gap-4">
      <p role="status" className="text-sm text-text-muted">
        Tìm thấy {results.length} quán.
      </p>
      {results.map((r) => (
        <ResultCard key={r.id} result={r} />
      ))}
    </div>
  );
}
