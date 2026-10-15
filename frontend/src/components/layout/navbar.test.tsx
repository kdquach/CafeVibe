import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Navbar } from './navbar';

function renderNavbar(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar />
    </MemoryRouter>,
  );
}

function menuList() {
  return screen.getByRole('list', { hidden: true });
}

describe('Navbar', () => {
  it('is a labelled navigation landmark with a link home', () => {
    renderNavbar();
    expect(screen.getByRole('navigation', { name: 'Điều hướng chính' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /CafeVibe, về trang chủ/ })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('starts with the mobile menu collapsed and the toggle reporting aria-expanded=false', () => {
    renderNavbar();
    const toggle = screen.getByRole('button', { name: 'Mở menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', menuList().id);
    expect(menuList().className).toContain('max-md:hidden');
  });

  it('opens and closes with the toggle button', async () => {
    renderNavbar();
    await userEvent.click(screen.getByRole('button', { name: 'Mở menu' }));
    const toggle = screen.getByRole('button', { name: 'Đóng menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(menuList().className).not.toContain('max-md:hidden');
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Mở menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('closes on Escape and returns focus to the toggle', async () => {
    renderNavbar();
    await userEvent.click(screen.getByRole('button', { name: 'Mở menu' }));
    await userEvent.tab(); // move focus into the menu
    await userEvent.keyboard('{Escape}');
    const toggle = screen.getByRole('button', { name: 'Mở menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });

  it('closes after choosing a link', async () => {
    renderNavbar();
    await userEvent.click(screen.getByRole('button', { name: 'Mở menu' }));
    await userEvent.click(screen.getByRole('link', { name: 'Tìm kiếm' }));
    expect(screen.getByRole('button', { name: 'Mở menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('marks the current page with aria-current', () => {
    renderNavbar('/search');
    expect(screen.getByRole('link', { name: 'Tìm kiếm' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Trang chủ' })).not.toHaveAttribute('aria-current');
  });
});
