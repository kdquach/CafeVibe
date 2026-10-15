import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/ui/error-state';
import { fetchHealth } from '@/lib/api';

export function HealthStatus() {
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => fetchHealth(signal),
    retry: false,
  });

  if (isPending) {
    return (
      <p role="status" className="text-text-muted">
        Đang kiểm tra kết nối tới API…
      </p>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Không kết nối được tới API"
        description="Hãy kiểm tra backend đã chạy chưa."
        onRetry={() => void refetch()}
        retrying={isFetching}
      />
    );
  }

  return (
    <p role="status">
      API hoạt động bình thường (phản hồi lúc {new Date(data.timestamp).toLocaleTimeString('vi-VN')}
      ).
    </p>
  );
}
