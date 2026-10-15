import {
  Info,
  Layers,
  ListChecks,
  MessageSquareText,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { useState, type ComponentType, type SVGProps } from 'react';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/container';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { SearchBox } from '@/components/ui/search-box';
import { usePageTitle } from '@/lib/use-page-title';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/** Example queries only: sample phrasing for the search box, not café data. */
const exampleQueries = [
  'Quán yên tĩnh để làm việc ở Gò Vấp, dưới 70.000đ',
  'Quán có wifi và ổ điện để học nhóm',
  'Quán mở khuya để gặp bạn bè',
];

const steps: Array<{ icon: Icon; title: string; text: string }> = [
  {
    icon: MessageSquareText,
    title: 'Mô tả điều bạn cần',
    text: 'Viết tự nhiên như nhắn cho bạn bè: khu vực, mục đích, không khí, ngân sách.',
  },
  {
    icon: ListChecks,
    title: 'Xem và chỉnh lại',
    text: 'Bạn thấy CafeVibe hiểu gì, sửa hoặc xoá từng điều kiện rồi mới bắt đầu tìm.',
  },
  {
    icon: Sparkles,
    title: 'Nhận gợi ý có giải thích',
    text: 'Mỗi quán kèm lý do dựa trên thông tin mà ứng dụng thật sự có.',
  },
];

const principles: Array<{ icon: Icon; title: string; text: string }> = [
  {
    icon: ShieldCheck,
    title: 'Không bịa thông tin',
    text: 'Điều gì chưa biết sẽ hiện là “chưa rõ”, không được đoán hay coi như đã xác nhận.',
  },
  {
    icon: Layers,
    title: 'Phân biệt nguồn dữ liệu',
    text: 'Thông tin từ nhà cung cấp, do người dùng gửi, suy luận hay không có sẵn được hiển thị khác nhau.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Bạn giữ quyền quyết định',
    text: 'Ý định do AI trích xuất luôn có thể sửa trước khi tìm kiếm.',
  },
];

export function HomePage() {
  usePageTitle();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  function goToSearch(value: string) {
    void navigate({ pathname: '/search', search: createSearchParams({ q: value }).toString() });
  }

  return (
    <>
      <section aria-labelledby="hero-heading" className="bg-brand-50">
        <Container className="py-16 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            Khám phá quán cà phê
          </p>
          <h1 id="hero-heading" className="mt-3 max-w-3xl text-display font-bold">
            Tìm quán cà phê đúng với lúc này của bạn
          </h1>
          <p className="mt-5 max-w-2xl text-body-lg text-text-muted">
            Mô tả bằng lời thường: yên tĩnh để làm việc, có ổ điện, mở khuya… CafeVibe sẽ tóm tắt
            lại bạn cần gì để bạn kiểm tra trước khi tìm.
          </p>

          <SearchBox
            className="mt-8 max-w-3xl"
            value={query}
            onValueChange={setQuery}
            onSubmit={goToSearch}
          />

          <div className="mt-5 max-w-3xl">
            <p id="examples-label" className="mb-2 text-sm text-text-muted">
              Thử một ví dụ:
            </p>
            <ul aria-labelledby="examples-label" className="flex flex-wrap gap-2">
              {exampleQueries.map((example) => (
                <li key={example}>
                  <Chip onClick={() => setQuery(example)}>{example}</Chip>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 flex max-w-3xl items-start gap-2 text-sm text-text-muted">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong className="font-semibold text-text">Đang phát triển:</strong> hiện tại ô tìm
              kiếm chưa trả về kết quả quán.
            </span>
          </p>
        </Container>
      </section>

      <section aria-labelledby="how-it-works" className="py-16 lg:py-24">
        <Container>
          <h2 id="how-it-works" className="text-h2 font-bold">
            Cách CafeVibe hoạt động
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title}>
                <Card className="h-full">
                  <div className="flex items-center gap-3">
                    <step.icon aria-hidden="true" className="size-6 text-brand-700" />
                    <span className="text-sm font-semibold text-text-muted">Bước {index + 1}</span>
                  </div>
                  <h3 className="mt-3 text-h4 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-text-muted">{step.text}</p>
                </Card>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="principles-heading" className="bg-surface-muted py-16 lg:py-24">
        <Container>
          <h2 id="principles-heading" className="text-h2 font-bold">
            Thông tin rõ nguồn, không đoán mò
          </h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {principles.map((principle) => (
              <li key={principle.title}>
                <Card className="h-full">
                  <principle.icon aria-hidden="true" className="size-6 text-brand-700" />
                  <h3 className="mt-3 text-h4 font-semibold">{principle.title}</h3>
                  <p className="mt-2 text-text-muted">{principle.text}</p>
                </Card>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
