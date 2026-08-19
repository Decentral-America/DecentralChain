/**
 * FaqSection — ink contrast across app themes (task 11)
 *
 * The heading/sub paint directly on the page canvas; each *collapsed* panel
 * is one step up (`brandCanvas.raised` / `brandSurface`, opaque), same as
 * FeatureBento/IconBullets. The *expanded* panel — only the first question is
 * open by default (`QUESTION_IDS[0]`) — is a translucent highlight
 * (`rgba(255, 255, 255, 0.06)` in dark; its light-mode equivalent), not an
 * opaque fill, so its true rendered colour is that overlay composited onto
 * the page canvas beneath it. `contrastRatio`'s own `rgbToHex` drops alpha
 * (the task-11 brief's stated limitation) — reading the overlay as opaque
 * white/whatever would silently pass this check regardless of the real
 * colour, so it is composited by hand first.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import FaqSection from '../FaqSection';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

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

/** Composites a possibly-translucent `rgb()`/`rgba()` colour onto an opaque hex backdrop. */
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

const renderIn = (mode: ThemeMode) =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <FaqSection />
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('FaqSection — heading ink (%s mode)', (mode) => {
  it('clears AA against the page canvas', () => {
    renderIn(mode);
    const heading = screen.getByText('app.landing.faq.heading');
    const ink = rgbToHex(getComputedStyle(heading).color);
    expect(contrastRatio(ink, tokens(mode).surface.base)).toBeGreaterThanOrEqual(4.5);
  });
});

describe.each([
  'light',
  'dark',
] as const)('FaqSection — question ink, on the panel’s own background (%s mode)', (mode) => {
  it('clears AA against the accordion panel’s own (expanded) background, alpha composited', () => {
    renderIn(mode);
    const question = screen.getByText('app.landing.faq.questions.seed-storage.q');
    const ink = rgbToHex(getComputedStyle(question).color);
    const panel = question.closest('.MuiAccordion-root') as HTMLElement;
    const canvas = tokens(mode).surface.base;
    const bg = compositeOverCanvas(getComputedStyle(panel).backgroundColor, canvas);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('answer clears AA against the accordion panel’s own (expanded) background, alpha composited', () => {
    renderIn(mode);
    const answer = screen.getByText('app.landing.faq.questions.seed-storage.a');
    const ink = rgbToHex(getComputedStyle(answer).color);
    const panel = answer.closest('.MuiAccordion-root') as HTMLElement;
    const canvas = tokens(mode).surface.base;
    const bg = compositeOverCanvas(getComputedStyle(panel).backgroundColor, canvas);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe.each([
  'light',
  'dark',
] as const)('FaqSection — collapsed panel ink, on the panel’s own (opaque) background (%s mode)', (mode) => {
  it('clears AA against a collapsed panel’s own background', () => {
    renderIn(mode);
    const question = screen.getByText('app.landing.faq.questions.password-recovery.q');
    const ink = rgbToHex(getComputedStyle(question).color);
    const panel = question.closest('.MuiAccordion-root') as HTMLElement;
    const bg = rgbToHex(getComputedStyle(panel).backgroundColor);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
