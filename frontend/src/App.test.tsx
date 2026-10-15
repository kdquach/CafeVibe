import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { AppRoutes } from './App';

function renderApp(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function stubHealthOk() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ data: { status: 'ok', timestamp: '2026-10-15T03:00:00.000Z' } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('landing page', () => {
  it('has one main landmark, a skip link, one h1 and a search landmark', () => {
    renderApp('/');
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Bỏ qua tới nội dung chính' })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('states honestly that search is not available yet and shows no café data', () => {
    renderApp('/');
    expect(screen.getByText(/chưa trả về kết quả quán/)).toBeInTheDocument();
  });

  it('example chips fill the search box without submitting', async () => {
    renderApp('/');
    await userEvent.click(screen.getByRole('button', { name: /Quán có wifi và ổ điện/ }));
    expect(screen.getByRole('searchbox')).toHaveValue('Quán có wifi và ổ điện để học nhóm');
    expect(screen.queryByText('Tìm kiếm chưa khả dụng')).not.toBeInTheDocument();
  });

  it('submitting navigates to /search and echoes the query (keyboard only)', async () => {
    renderApp('/');
    await userEvent.type(screen.getByRole('searchbox'), 'quán yên tĩnh{Enter}');
    expect(await screen.findByRole('heading', { level: 1, name: 'Tìm kiếm' })).toBeInTheDocument();
    expect(screen.getByText('quán yên tĩnh')).toBeInTheDocument();
    expect(screen.getByText('Tìm kiếm chưa khả dụng')).toBeInTheDocument();
  });

  it('sets a document title', () => {
    renderApp('/');
    expect(document.title).toBe('CafeVibe');
  });
});

describe('search page (placeholder)', () => {
  it('shows an empty state without a query', () => {
    renderApp('/search');
    expect(
      screen.getByRole('heading', { name: 'Hãy mô tả quán bạn muốn tìm' }),
    ).toBeInTheDocument();
    expect(document.title).toBe('Tìm kiếm · CafeVibe');
  });

  it('echoes the query and never shows results', () => {
    renderApp('/search?q=c%C3%B3%20wifi');
    expect(screen.getByText('có wifi')).toBeInTheDocument();
    expect(screen.getByText(/chưa có quán nào được hiển thị/)).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('có wifi');
  });

  it('renders markup in the query as plain text (no injection)', () => {
    const payload = '<img src=x onerror=alert(1)>';
    const { container } = renderApp(`/search?q=${encodeURIComponent(payload)}`);
    expect(screen.getByText(payload)).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('treats a whitespace-only query as no query', () => {
    renderApp('/search?q=%20%20');
    expect(
      screen.getByRole('heading', { name: 'Hãy mô tả quán bạn muốn tìm' }),
    ).toBeInTheDocument();
  });
});

describe('status page', () => {
  it('shows the API health result inside the shared layout', async () => {
    stubHealthOk();
    renderApp('/status');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Trạng thái hệ thống' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/API hoạt động bình thường/)).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Điều hướng chính' })).toBeInTheDocument();
  });
});

describe('not found', () => {
  it('renders a 404 page with a way home', () => {
    renderApp('/khong-ton-tai');
    expect(screen.getAllByText('Không tìm thấy trang').length).toBeGreaterThan(0);
    const main = screen.getByRole('main');
    expect(within(main).getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/');
  });
});

describe('automated a11y (axe) — partial coverage; contrast is covered by the token test', () => {
  it.each([
    ['landing', '/'],
    ['search (empty)', '/search'],
    ['search (with query)', '/search?q=quan%20yen%20tinh'],
    ['404', '/khong-ton-tai'],
  ])('%s has no axe violations', async (_name, path) => {
    const { container } = renderApp(path);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('status page has no axe violations', async () => {
    stubHealthOk();
    const { container } = renderApp('/status');
    await screen.findByText(/API hoạt động bình thường/);
    expect(await axe(container)).toHaveNoViolations();
  });
});
