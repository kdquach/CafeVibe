import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MemoryRouter, Link } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { Button } from './button';
import { Card } from './card';
import { Chip } from './chip';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { Input } from './input';
import { SearchBox } from './search-box';
import { Skeleton } from './skeleton';

describe('Button', () => {
  it('renders a type="button" by default so it never submits a form by accident', () => {
    render(<Button>Lưu</Button>);
    expect(screen.getByRole('button', { name: 'Lưu' })).toHaveAttribute('type', 'button');
  });

  it('calls onClick with the mouse and with Enter / Space', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Gửi</Button>);
    const button = screen.getByRole('button', { name: 'Gửi' });
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Gửi
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Gửi' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('loading blocks activation and exposes aria-busy', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Đang gửi
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Đang gửi' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('asChild styles a router Link as a button while keeping it a link', () => {
    render(
      <MemoryRouter>
        <Button asChild>
          <Link to="/search">Tìm kiếm</Link>
        </Button>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'Tìm kiếm' });
    expect(link).toHaveAttribute('href', '/search');
    expect(link.className).toContain('bg-brand-500');
  });

  it('uses dark text on the primary background (white on brand-500 fails WCAG AA)', () => {
    render(<Button>Gửi</Button>);
    const classes = screen.getByRole('button').className;
    expect(classes).toContain('text-text');
    expect(classes).not.toContain('text-white');
  });
});

describe('Input', () => {
  it('associates the label with the field', () => {
    render(<Input label="Khu vực" />);
    expect(screen.getByLabelText('Khu vực')).toBeInTheDocument();
  });

  it('links hint and error via aria-describedby and sets aria-invalid', () => {
    render(<Input label="Ngân sách" hint="Đơn vị: nghìn đồng" error="Giá trị không hợp lệ" />);
    const input = screen.getByLabelText('Ngân sách');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Đơn vị: nghìn đồng Giá trị không hợp lệ');
  });

  it('is valid for assistive tech when there is no error', () => {
    render(<Input label="Khu vực" />);
    expect(screen.getByLabelText('Khu vực')).not.toHaveAttribute('aria-invalid');
  });
});

describe('Chip', () => {
  it('acts as a toggle with aria-pressed when "selected" is provided', async () => {
    function Harness() {
      const [on, setOn] = useState(false);
      return (
        <Chip selected={on} onClick={() => setOn(!on)}>
          Yên tĩnh
        </Chip>
      );
    }
    render(<Harness />);
    const chip = screen.getByRole('button', { name: 'Yên tĩnh' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('is a plain button (no aria-pressed) when "selected" is not provided', () => {
    render(<Chip>Ví dụ</Chip>);
    expect(screen.getByRole('button', { name: 'Ví dụ' })).not.toHaveAttribute('aria-pressed');
  });
});

describe('Skeleton, Card, EmptyState, ErrorState', () => {
  it('Skeleton is hidden from assistive technology', () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('Card renders its children', () => {
    render(<Card>Nội dung</Card>);
    expect(screen.getByText('Nội dung')).toBeInTheDocument();
  });

  it('EmptyState renders a heading, description and action', () => {
    render(
      <EmptyState
        title="Chưa có kết quả"
        description="Thử nới lỏng điều kiện."
        action={<button type="button">Làm lại</button>}
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Chưa có kết quả' })).toBeInTheDocument();
    expect(screen.getByText('Thử nới lỏng điều kiện.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Làm lại' })).toBeInTheDocument();
  });

  it('EmptyState supports a level-3 heading', () => {
    render(<EmptyState title="Trống" headingLevel={3} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Trống' })).toBeInTheDocument();
  });

  it('ErrorState is an alert and offers a working retry', async () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Mất kết nối" description="Thử lại sau." onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Mất kết nối');
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('ErrorState has no retry button when onRetry is not given', () => {
    render(<ErrorState />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('SearchBox', () => {
  function Harness({ onSubmit }: { onSubmit: (q: string) => void }) {
    const [value, setValue] = useState('');
    return <SearchBox value={value} onValueChange={setValue} onSubmit={onSubmit} />;
  }

  it('is exposed as a search landmark with a labelled input', () => {
    render(<Harness onSubmit={vi.fn()} />);
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /Mô tả quán cà phê/ })).toBeInTheDocument();
  });

  it('submits the trimmed query with Enter', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole('searchbox'), '  quán yên tĩnh ở Gò Vấp  {Enter}');
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('quán yên tĩnh ở Gò Vấp');
  });

  it('submits with the button', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole('searchbox'), 'có wifi');
    await userEvent.click(screen.getByRole('button', { name: 'Tìm quán' }));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('có wifi');
  });

  it('does not submit an empty or whitespace-only query and shows an accessible error', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole('searchbox'), '   {Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Hãy mô tả');
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears the error as soon as the user types again', async () => {
    render(<Harness onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Tìm quán' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox'), 'a');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('automated a11y (axe) — rule coverage is partial; contrast is covered by the token test', () => {
  it('has no axe violations for the primitives together', async () => {
    const { container } = render(
      <main>
        <h1>Thử nghiệm</h1>
        <SearchBox value="" onValueChange={() => undefined} onSubmit={() => undefined} />
        <Input label="Khu vực" hint="Ví dụ: Gò Vấp" />
        <Chip selected>Yên tĩnh</Chip>
        <Button>Gửi</Button>
        <EmptyState title="Chưa có kết quả" description="Thử nới lỏng điều kiện." />
        <ErrorState title="Lỗi" description="Thử lại." onRetry={() => undefined} />
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
