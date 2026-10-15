import { configureAxe } from 'vitest-axe';

/**
 * axe for jsdom. The color-contrast rule is disabled because jsdom has no layout/canvas and cannot resolve
 * rendered colors; contrast is instead verified against the real tokens in src/test/tokens.test.ts and by
 * the browser pass. Every other axe rule stays enabled. Automated checks catch only part of all a11y issues.
 */
export const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });
