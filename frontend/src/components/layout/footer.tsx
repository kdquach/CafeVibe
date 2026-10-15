import { Link } from 'react-router-dom';
import { Container } from './container';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface-muted">
      <Container className="flex flex-col gap-3 py-8 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>CafeVibe là dự án portfolio đang trong quá trình phát triển.</p>
        <Link to="/status" className="w-fit rounded-sm underline underline-offset-4">
          Trạng thái hệ thống
        </Link>
      </Container>
    </footer>
  );
}
