import { Menu, X } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/cn';
import { Container } from './container';

const links = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/search', label: 'Tìm kiếm', end: false },
] as const;

/**
 * Responsive navbar. Below `md` the links collapse into a disclosure menu (button with aria-expanded);
 * Escape closes it and returns focus to the button. At `md` and up the links are always visible.
 * Closed links use `max-md:hidden` (display: none below md), which removes them from the tab order and the
 * accessibility tree on mobile. (The `hidden` attribute is not used: Tailwind's preflight forces
 * `display: none !important` on it, which would also hide the links on desktop.)
 */
export function Navbar() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && open) {
      setOpen(false);
      buttonRef.current?.focus();
    }
  }

  return (
    <header className="border-b border-border bg-bg">
      <Container>
        <nav aria-label="Điều hướng chính" onKeyDown={handleKeyDown} className="relative">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" aria-label="CafeVibe, về trang chủ" className="rounded-sm">
              <Logo />
            </Link>

            <button
              ref={buttonRef}
              type="button"
              aria-expanded={open}
              aria-controls={menuId}
              onClick={() => setOpen((value) => !value)}
              className="inline-flex size-11 items-center justify-center rounded-md hover:bg-surface-muted md:hidden"
            >
              <span className="sr-only">{open ? 'Đóng menu' : 'Mở menu'}</span>
              {open ? (
                <X aria-hidden="true" className="size-6" />
              ) : (
                <Menu aria-hidden="true" className="size-6" />
              )}
            </button>

            <ul
              id={menuId}
              className={cn(
                'absolute inset-x-0 top-16 z-10 flex-col gap-1 border-b border-border bg-bg p-3 shadow-raised',
                open ? 'flex' : 'max-md:hidden',
                'md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none',
              )}
            >
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-11 items-center rounded-md px-4 text-base font-medium hover:bg-surface-muted',
                        isActive && 'underline decoration-2 underline-offset-8',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </Container>
    </header>
  );
}
