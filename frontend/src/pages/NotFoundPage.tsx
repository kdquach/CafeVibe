import { Link } from 'react-router-dom';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { usePageTitle } from '@/lib/use-page-title';

export function NotFoundPage() {
  usePageTitle('Không tìm thấy trang');
  return (
    <Container className="py-12 lg:py-16">
      <h1 className="sr-only">Không tìm thấy trang</h1>
      <EmptyState
        title="Không tìm thấy trang"
        description="Đường dẫn này không tồn tại hoặc đã được chuyển đi."
        action={
          <Button asChild>
            <Link to="/">Về trang chủ</Link>
          </Button>
        }
      />
    </Container>
  );
}
