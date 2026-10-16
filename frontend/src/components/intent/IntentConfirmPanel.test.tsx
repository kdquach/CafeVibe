import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IntentConfirmPanel } from './IntentConfirmPanel';
import { SAMPLE_INTENT } from './sampleIntent';

describe('IntentConfirmPanel', () => {
  it('sửa ngân sách rồi xác nhận thì onConfirm nhận intent đã sửa', async () => {
    const onConfirm = vi.fn();
    render(<IntentConfirmPanel status="ready" initialIntent={SAMPLE_INTENT} onConfirm={onConfirm} />);
    const budget = screen.getByLabelText('Ngân sách tối đa (VND)');
    await userEvent.clear(budget);
    await userEvent.type(budget, '50000');
    await userEvent.tab();
    await userEvent.click(screen.getByRole('button', { name: 'Xác nhận và tìm kiếm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0]?.[0]).toMatchObject({ budget: { maxVnd: 50000 } });
  });

  it('xóa điều kiện rồi xác nhận thì intent không còn điều kiện đó; lỗi có nút thử lại', async () => {
    const onConfirm = vi.fn();
    const { rerender } = render(
      <IntentConfirmPanel status="ready" initialIntent={SAMPLE_INTENT} onConfirm={onConfirm} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Xóa tiện ích quiet' }));
    await userEvent.click(screen.getByRole('button', { name: 'Xác nhận và tìm kiếm' }));
    const sent = onConfirm.mock.calls[0]?.[0] as typeof SAMPLE_INTENT;
    expect(sent.amenities?.map((a) => a.name)).not.toContain('quiet');

    const onRetry = vi.fn();
    rerender(<IntentConfirmPanel status="error" onConfirm={onConfirm} onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
