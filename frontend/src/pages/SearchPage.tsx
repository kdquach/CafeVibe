import { SearchX } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container } from '@/components/layout/container';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchBox } from '@/components/ui/search-box';
import { usePageTitle } from '@/lib/use-page-title';

/**
 * Placeholder. Search itself (intent extraction, results, ranking) is built in later phases, so this page only
 * echoes the query and says so plainly. It never shows made-up results.
 */
export function SearchPage() {
  usePageTitle('Tìm kiếm');
  const [params, setParams] = useSearchParams();
  const submitted = params.get('q')?.trim() ?? '';
  const [value, setValue] = useState(submitted);

  return (
    <Container className="py-12 lg:py-16">
      <h1 className="text-h1 font-bold">Tìm kiếm</h1>
      <SearchBox
        className="mt-6 max-w-3xl"
        value={value}
        onValueChange={setValue}
        onSubmit={(query) => setParams({ q: query })}
      />

      <div className="mt-8 max-w-3xl">
        {submitted ? (
          <Card aria-live="polite">
            <h2 className="text-h4 font-semibold">Tìm kiếm chưa khả dụng</h2>
            <p className="mt-2 text-text-muted">
              Bạn đã nhập: <q className="font-medium text-text">{submitted}</q>
            </p>
            <p className="mt-2 text-text-muted">
              Tính năng phân tích yêu cầu và hiển thị kết quả sẽ có ở các bản sau. Hiện chưa có quán
              nào được hiển thị.
            </p>
          </Card>
        ) : (
          <EmptyState
            icon={<SearchX className="size-8" />}
            title="Hãy mô tả quán bạn muốn tìm"
            description="Nhập điều bạn cần vào ô phía trên, ví dụ khu vực, mục đích và ngân sách."
          />
        )}
      </div>
    </Container>
  );
}
