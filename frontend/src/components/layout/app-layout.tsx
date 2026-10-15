import { Outlet } from 'react-router-dom';
import { Footer } from './footer';
import { Navbar } from './navbar';

/** Page shell: skip link, navbar, the single <main> landmark, footer. Pages render inside <Outlet />. */
export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-surface px-4 py-3 font-medium focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Bỏ qua tới nội dung chính
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
