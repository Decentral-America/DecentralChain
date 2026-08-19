/**
 * Footer — ink contrast across app themes (task 11)
 *
 * Footer paints directly on the page canvas (no card of its own), so every
 * ink here maps straight to `tokens(mode)` per the task-11 brief's
 * substitution table. It previously forced `onCanvas.secondary` onto its
 * body2/link text via a raw CSS-class selector
 * (`& .MuiTypography-root[class*="body2"], & a`) that outranked the
 * `color="text.secondary"` prop already on those elements — a fixed value
 * stacked on top of an already mode-aware one, the exact "known failure
 * mode" the task-11 brief calls out. That selector is gone; this test
 * verifies the prop now actually governs the rendered colour.
 *
 * The giant background wordmark is aria-hidden decoration, but axe still
 * checks its contrast (the file's own long-standing rationale) — verified
 * here against the WCAG large-text floor (3:1), not the 4.5:1 body-text one.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import Footer from '../Footer';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/config', () => ({ config: { ledgerEnabled: false } }));

/**
 * Drops any alpha channel: `.slice(0, 3)` keeps r/g/b and discards a 4th
 * match, so an ink specified with alpha would be measured against its own
 * r/g/b as if fully opaque — overstating its contrast once alpha actually
 * composites onto the background. Every current call site here passes an
 * opaque colour, so this is exact today; it is a structural limitation of
 * this idiom (duplicated across 15+ contrast test files) rather than a bug
 * in any one test. See task-8-report.md, Finding 5.
 */
function rgbToHex(rgb: string): string {
  const channels = rgb.match(/\d+(\.\d+)?/g);
  if (!channels || channels.length < 3) throw new Error(`Unparseable colour: ${rgb}`);
  return `#${channels
    .slice(0, 3)
    .map((c) => Number(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * `contrastRatio`'s own `rgbToHex` drops the alpha channel — an ink
 * specified with alpha (the wordmark is `rgba(..., 0.36 | 0.5)`) would
 * measure as fully opaque and read optimistically. Composite it over the
 * known opaque canvas colour first, per the task-11 brief's stated
 * limitation, so the number checked below is the one actually rendered.
 */
function compositeOverCanvas(rgbaColor: string, canvasHex: string): string {
  const channels = rgbaColor.match(/[\d.]+/g);
  if (!channels || channels.length < 3) throw new Error(`Unparseable colour: ${rgbaColor}`);
  const [r, g, b] = channels.map(Number) as [number, number, number];
  const alpha = channels.length >= 4 ? Number(channels[3]) : 1;
  const bg = canvasHex.replace('#', '');
  const br = Number.parseInt(bg.slice(0, 2), 16);
  const bgc = Number.parseInt(bg.slice(2, 4), 16);
  const bb = Number.parseInt(bg.slice(4, 6), 16);
  const composite = (fg: number, bgChannel: number) =>
    Math.round(fg * alpha + bgChannel * (1 - alpha));
  return `#${[composite(r, br), composite(g, bgc), composite(b, bb)]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * Footer renders directly (no ambient ThemeProvider) in `Footer.test.tsx`
 * too, but ink here depends on the real app theme, so this file needs it.
 */
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from '@/theme/mui-theme';

const renderIn = (mode: ThemeMode) =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <Footer />
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('Footer — category heading ink (%s mode)', (mode) => {
  it('clears AA against the page canvas', () => {
    renderIn(mode);
    const heading = screen.getByText('app.landing.footer.categories.resources');
    const ink = rgbToHex(getComputedStyle(heading).color);
    expect(contrastRatio(ink, tokens(mode).surface.base)).toBeGreaterThanOrEqual(4.5);
  });
});

describe.each(['light', 'dark'] as const)('Footer — link ink (%s mode)', (mode) => {
  it('a resources link clears AA against the page canvas', () => {
    renderIn(mode);
    const link = screen.getByText('app.landing.footer.links.documentation');
    const ink = rgbToHex(getComputedStyle(link).color);
    expect(contrastRatio(ink, tokens(mode).surface.base)).toBeGreaterThanOrEqual(4.5);
  });
});

describe.each(['light', 'dark'] as const)('Footer — copyright ink (%s mode)', (mode) => {
  it('clears AA against the page canvas', () => {
    renderIn(mode);
    const copyright = screen.getByText('app.landing.footer.copyright');
    const ink = rgbToHex(getComputedStyle(copyright).color);
    expect(contrastRatio(ink, tokens(mode).surface.base)).toBeGreaterThanOrEqual(4.5);
  });
});

describe.each(['light', 'dark'] as const)('Footer — giant wordmark (%s mode)', (mode) => {
  it('clears the WCAG large-text floor (3:1) against the page canvas, alpha composited', () => {
    renderIn(mode);
    const wordmark = screen.getByText('Decentral.Exchange');
    const rawInk = getComputedStyle(wordmark).color;
    const canvas = tokens(mode).surface.base;
    const ink = compositeOverCanvas(rawInk, canvas);
    expect(contrastRatio(ink, canvas)).toBeGreaterThanOrEqual(3);
  });
});
