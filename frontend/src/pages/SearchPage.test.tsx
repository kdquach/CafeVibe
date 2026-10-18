import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SearchPage } from './SearchPage';

const INTENT = {
  query: 'quán yên tĩnh ở Gò Vấp',
  districts: [{ name: 'Gò Vấp', strength: 'required' }],
  amenities: [{ name: 'quiet', strength: 'preferred' }],
};

const RESULTS = {
  results: [
    {
      id: 'cafe-1',
      name: '[MOCK] Quiet Cafe',
      district: 'Gò Vấp',
      address: '[MOCK] 1 Street',
      priceLevel: 2,
      source: 'mock',
      constraints: [
        { name: 'location', status: 'met' },
        { name: 'budget', status: 'unknown' },
      ],
      hasUnmetRequired: true,
    },
  ],
  warnings: [],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderPage(initialEntry: string, fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(fetchImpl as typeof fetch);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return spy;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SearchPage 4c-2', () => {
  it('query -> intent -> sửa -> xác nhận -> gọi /search đúng body {intent}', async () => {
    const calls: { url: string; body: unknown }[] = [];
    renderPage('/search?q=quán yên tĩnh ở Gò Vấp', async (input, init) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body)) as unknown;
      calls.push({ url, body });
      if (url.endsWith('/search/intent')) return jsonResponse({ data: INTENT });
      return jsonResponse({ data: RESULTS });
    });

    await screen.findByRole('button', { name: 'Xác nhận và tìm kiếm' });
    await userEvent.click(screen.getByRole('button', { name: 'Xóa tiện ích quiet' }));
    await userEvent.click(screen.getByRole('button', { name: 'Xác nhận và tìm kiếm' }));

    await screen.findByText('[MOCK] Quiet Cafe');
    const searchCall = calls.find((c) => c.url.endsWith('/api/v1/search'));
    expect(searchCall?.body).toMatchObject({
      intent: { query: 'quán yên tĩnh ở Gò Vấp', districts: [{ name: 'Gò Vấp', strength: 'required' }] },
    });
    expect((searchCall?.body as { intent: { amenities?: unknown[] } }).intent.amenities ?? []).toEqual([]);
    expect(screen.getByText('Dữ liệu mẫu')).toBeInTheDocument();
    expect(screen.getByText('Chưa rõ')).toBeInTheDocument();
  });

  it('lỗi intent hiện ErrorState có Thử lại', async () => {
    let attempts = 0;
    renderPage('/search?q=quán ở đâu', async (input) => {
      if (String(input).endsWith('/search/intent')) {
        attempts += 1;
        return jsonResponse({ error: { code: 'INTENT_EXTRACTION_FAILED', message: 'fail' } }, 502);
      }
      throw new Error('unexpected call');
    });

    await screen.findByRole('button', { name: 'Thử lại' });
    expect(attempts).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(attempts).toBe(2));
  });

  it('warnings có LOCATION_NOT_SUPPORTED thì hiển thị cảnh báo tiếng Việt', async () => {
    renderPage('/search?q=quán ở Hà Nội', async (input) => {
      if (String(input).endsWith('/search/intent')) return jsonResponse({ data: INTENT });
      return jsonResponse({
        data: {
          results: [],
          warnings: [{ code: 'LOCATION_NOT_SUPPORTED', message: 'District is not supported.' }],
        },
      });
    });

    await screen.findByRole('button', { name: 'Xác nhận và tìm kiếm' });
    await userEvent.click(screen.getByRole('button', { name: 'Xác nhận và tìm kiếm' }));
    await screen.findByText(/chưa được hỗ trợ/i);
    expect(screen.queryByText('District is not supported.')).not.toBeInTheDocument();
  });
});
