import { Container } from '@/components/layout/container';
import { HealthStatus } from '@/features/health/HealthStatus';
import { usePageTitle } from '@/lib/use-page-title';

export function StatusPage() {
  usePageTitle('Trạng thái hệ thống');
  return (
    <Container className="py-12 lg:py-16">
      <h1 className="text-h1 font-bold">Trạng thái hệ thống</h1>
      <p className="mt-3 max-w-2xl text-text-muted">Kiểm tra kết nối giữa giao diện và API.</p>
      <section aria-labelledby="api-status-heading" className="mt-8 max-w-2xl">
        <h2 id="api-status-heading" className="mb-3 text-h4 font-semibold">
          Kết nối tới API
        </h2>
        <HealthStatus />
      </section>
    </Container>
  );
}
