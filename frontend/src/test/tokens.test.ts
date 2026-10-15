// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Guards the design tokens: parses the real src/index.css and fails if a color pair that the UI relies on
 * drops below its WCAG 2.x contrast threshold. Editing a token that breaks accessibility fails here.
 */
const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

function token(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!match?.[1]) throw new Error(`Token --color-${name} not found in index.css`);
  return match[1];
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = '#ffffff';

/** [foreground token, background token, minimum ratio, what it is used for] */
const pairs: Array<[string, string, number, string]> = [
  // Body and secondary text
  ['text', 'bg', 4.5, 'body text on page'],
  ['text', 'surface', 4.5, 'body text on cards'],
  ['text', 'surface-muted', 4.5, 'body text on muted surfaces'],
  ['text-muted', 'bg', 4.5, 'secondary text on page'],
  ['text-muted', 'surface', 4.5, 'secondary text on cards'],
  ['text-muted', 'surface-muted', 4.5, 'secondary text on muted surfaces'],
  ['text-muted', 'brand-50', 4.5, 'secondary text in the hero'],
  ['brand-700', 'brand-50', 4.5, 'eyebrow text in the hero'],
  // Buttons and chips
  ['text', 'brand-500', 4.5, 'primary button label'],
  ['text', 'brand-550', 4.5, 'primary button label on hover'],
  ['text', 'brand-50', 4.5, 'text on soft tint'],
  ['text', 'brand-100', 4.5, 'selected chip label'],
  // Links and focus ring
  ['brand-700', 'bg', 4.5, 'link text on page'],
  ['brand-700', 'surface', 4.5, 'link text / focus ring on cards'],
  // Status text (never rely on color alone: always paired with an icon + wording)
  ['success', 'bg', 4.5, 'success text'],
  ['success', 'surface', 4.5, 'success text on cards'],
  ['danger', 'bg', 4.5, 'error text'],
  ['danger', 'surface', 4.5, 'error text on cards'],
  ['info', 'bg', 4.5, 'info text'],
  ['info', 'surface', 4.5, 'info text on cards'],
  // Non-text UI: control boundaries and meaningful icons need 3:1
  ['border-strong', 'bg', 3, 'input border on page'],
  ['border-strong', 'surface', 3, 'input border on cards'],
  ['border-strong', 'surface-muted', 3, 'control border on muted surfaces'],
  ['accent-green', 'bg', 3, 'accent icon'],
  ['warning', 'bg', 3, 'warning icon'],
];

describe('design tokens: contrast', () => {
  it.each(pairs)('%s on %s is at least %s:1 (%s)', (fg, bg, min) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(min);
  });

  it('keeps a documented known-limit: white on brand-500 is below AA, so it must not be used for text', () => {
    expect(contrast(WHITE, token('brand-500'))).toBeLessThan(4.5);
  });

  it('exposes the documented brand and neutral tokens', () => {
    for (const name of ['brand-500', 'bg', 'surface', 'text', 'border', 'danger', 'info']) {
      expect(token(name)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
