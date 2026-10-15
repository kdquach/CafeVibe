import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HealthStatus } from './HealthStatus';

function renderWithClient() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <HealthStatus />
    </QueryClientProvider>,
  );
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('HealthStatus', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows a loading state while the request is pending', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    );
    renderWithClient();
    expect(screen.getByRole('status')).toHaveTextContent('Đang kiểm tra');
  });

  it('shows the success state when the API is healthy', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({ data: { status: 'ok', timestamp: '2026-10-14T16:30:00.000Z' } }),
        ),
      ),
    );
    renderWithClient();
    expect(await screen.findByText(/API hoạt động bình thường/)).toBeInTheDocument();
  });

  it('shows an error state with a retry button when the network fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );
    renderWithClient();
    expect(await screen.findByRole('alert')).toHaveTextContent('Không kết nối được tới API');
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });

  it('shows an error state when the API returns a non-2xx status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({ error: { code: 'X', message: 'x' } }, 500))),
    );
    renderWithClient();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('shows an error state when the response shape is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({ data: { status: 'degraded' } }))),
    );
    renderWithClient();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('recovers to the success state after retry', async () => {
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(
        jsonResponse({ data: { status: 'ok', timestamp: '2026-10-14T16:30:00.000Z' } }),
      );
    vi.stubGlobal('fetch', fetchMock);
    renderWithClient();

    const retry = await screen.findByRole('button', { name: 'Thử lại' });
    await userEvent.click(retry);

    expect(await screen.findByText(/API hoạt động bình thường/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
