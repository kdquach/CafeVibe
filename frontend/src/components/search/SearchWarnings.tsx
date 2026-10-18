import { TriangleAlert } from 'lucide-react';
import type { SearchWarning } from '@/features/search/schemas';

const LOCATION_MESSAGE = 'Khu vực bạn chọn hiện chưa được hỗ trợ. Hãy thử khu vực khác.';
const GENERIC_MESSAGE = 'Có lưu ý từ hệ thống cho tìm kiếm này.';

/** Hiển thị warnings[] do backend trả; không tự suy cảnh báo từ kết quả. */
export function SearchWarnings({ warnings }: { warnings: SearchWarning[] }) {
  if (warnings.length === 0) return null;
  return (
    <div aria-live="polite" className="flex flex-col gap-2">
      {warnings.map((w, i) => (
        <p
          key={`${w.code}-${i}`}
          className="flex items-start gap-2 rounded-md border border-border-strong bg-surface-muted p-3 text-sm"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            {w.code === 'LOCATION_NOT_SUPPORTED' ? LOCATION_MESSAGE : GENERIC_MESSAGE}{' '}
            <span className="text-text-muted">({w.code})</span>
          </span>
        </p>
      ))}
    </div>
  );
}
