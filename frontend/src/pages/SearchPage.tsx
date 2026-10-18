import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { SearchX } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IntentConfirmPanel } from '@/components/intent/IntentConfirmPanel';
import { SAMPLE_INTENT } from '@/components/intent/sampleIntent';
import { Container } from '@/components/layout/container';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchWarnings } from '@/components/search/SearchWarnings';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SearchBox } from '@/components/ui/search-box';
import { Skeleton } from '@/components/ui/skeleton';
import type { IntentStatus } from '@/features/intent/types';
import type { SearchIntent } from '@/features/intent/schemas';
import { fetchIntent, fetchSearch } from '@/features/search/api';
import type { SearchResponse } from '@/features/search/schemas';
import { usePageTitle } from '@/lib/use-page-title';

const MAX_QUERY_LENGTH = 500;

export function SearchPage() {
  usePageTitle('Tìm kiếm');
  const [params, setParams] = useSearchParams();
  const submitted = params.get('q')?.trim() ?? '';
  const [value, setValue] = useState(submitted);
  const [clientError, setClientError] = useState<string | undefined>();

  // Preview dev-only: ?preview=ready|loading|error|empty.
  const preview = params.get('preview');
  const isDevPreview =
    import.meta.env.DEV &&
    (preview === 'ready' || preview === 'loading' || preview === 'error' || preview === 'empty');

  const intentQuery = useQuery({
    queryKey: ['search-intent', submitted],
    queryFn: ({ signal }) => fetchIntent(submitted, signal),
    enabled: !isDevPreview && submitted.length > 0 && submitted.length <= MAX_QUERY_LENGTH,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const searchMutation = useMutation({
    mutationFn: (intent: SearchIntent) => fetchSearch(intent),
  });

  function handleSubmit(query: string) {
    if (!query || query.length > MAX_QUERY_LENGTH) {
      setClientError(
        !query ? 'Hãy mô tả quán bạn muốn tìm trước khi tìm kiếm.' : 'Mô tả quá dài, tối đa 500 ký tự.',
      );
      return;
    }
    setClientError(undefined);
    searchMutation.reset();
    setParams({ q: query });
  }

  if (isDevPreview) {
    const status = preview as IntentStatus;
    return (
      <Container className="py-12 lg:py-16">
        <h1 className="text-h1 font-bold">Tìm kiếm</h1>
        <p className="mt-2 text-sm text-text-muted">Dữ liệu mẫu (chưa nối API).</p>
        <div className="mt-6 max-w-3xl">
          <IntentConfirmPanel
            status={status}
            initialIntent={SAMPLE_INTENT}
            onConfirm={() => undefined}
            onRetry={() => undefined}
          />
        </div>
      </Container>
    );
  }

  const tooLong = submitted.length > MAX_QUERY_LENGTH;

  return (
    <Container className="py-12 lg:py-16">
      <h1 className="text-h1 font-bold">Tìm kiếm</h1>
      <SearchBox
        className="mt-6 max-w-3xl"
        value={value}
        onValueChange={setValue}
        onSubmit={handleSubmit}
      />
      {clientError ? (
        <p role="alert" className="mt-2 max-w-3xl text-sm text-danger">
          {clientError}
        </p>
      ) : null}

      <div className="mt-8 max-w-3xl">
        {!submitted ? (
          <EmptyState
            icon={<SearchX className="size-8" />}
            title="Hãy mô tả quán bạn muốn tìm"
            description="Nhập điều bạn cần vào ô phía trên, ví dụ khu vực, mục đích và ngân sách."
          />
        ) : tooLong ? (
          <p role="alert" className="text-sm text-danger">
            Mô tả quá dài, tối đa 500 ký tự.
          </p>
        ) : (
          <SearchFlow
            submitted={submitted}
            intentQuery={intentQuery}
            searchMutation={searchMutation}
          />
        )}
      </div>
    </Container>
  );
}

function SearchFlow({
  submitted,
  intentQuery,
  searchMutation,
}: {
  submitted: string;
  intentQuery: UseQueryResult<SearchIntent, unknown>;
  searchMutation: UseMutationResult<SearchResponse, unknown, SearchIntent>;
}) {
  if (intentQuery.isPending) {
    return (
      <div role="status" aria-busy="true" aria-label="Đang phân tích yêu cầu" aria-live="polite">
        <span className="sr-only">Đang phân tích yêu cầu…</span>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="mt-3 h-16 w-full" />
        <Skeleton className="mt-3 h-16 w-full" />
      </div>
    );
  }

  if (intentQuery.isError) {
    return (
      <ErrorState
        title="Không phân tích được yêu cầu"
        description="Hệ thống chưa hiểu điều bạn mô tả. Hãy thử lại."
        onRetry={() => void intentQuery.refetch()}
        retrying={intentQuery.isFetching}
      />
    );
  }

  const intent = intentQuery.data;
  if (!intent) return null;

  const hasConditions =
    (intent.districts?.length ?? 0) > 0 ||
    !!intent.budget ||
    !!intent.priceRange ||
    (intent.amenities?.length ?? 0) > 0 ||
    !!intent.openNow ||
    !!intent.minRating;
  const status: IntentStatus = hasConditions ? 'ready' : 'empty';

  return (
    <div className="flex flex-col gap-8">
      <IntentConfirmPanel
        key={submitted}
        status={status}
        initialIntent={intent}
        onConfirm={(confirmed) => searchMutation.mutate(confirmed)}
        onRetry={() => void intentQuery.refetch()}
        retrying={intentQuery.isFetching}
      />

      {searchMutation.isPending ? (
        <div role="status" aria-busy="true" aria-label="Đang tìm quán" aria-live="polite">
          <span className="sr-only">Đang tìm quán…</span>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="mt-3 h-24 w-full" />
        </div>
      ) : null}

      {searchMutation.isError ? (
        <ErrorState
          title="Không tìm được quán"
          description="Đã có lỗi khi tìm kiếm. Hãy thử lại."
          onRetry={() => {
            const last = searchMutation.variables;
            if (last) searchMutation.mutate(last);
          }}
          retrying={searchMutation.isPending}
        />
      ) : null}

      {searchMutation.data ? (
        <div className="flex flex-col gap-4">
          <SearchWarnings warnings={searchMutation.data.warnings} />
          <SearchResults results={searchMutation.data.results} />
        </div>
      ) : null}
    </div>
  );
}
