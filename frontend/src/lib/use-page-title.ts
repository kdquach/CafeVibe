import { useEffect } from 'react';

const SITE_NAME = 'CafeVibe';

/** Gives each route a distinct document title (helps screen reader and tab users). */
export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
