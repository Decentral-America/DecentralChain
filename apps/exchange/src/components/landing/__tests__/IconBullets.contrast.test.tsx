/**
 * IconBullets — ink contrast across app themes (task 11)
 *
 * Same shape as FeatureBento.contrast.test.tsx: the heading paints directly
 * on the page canvas; the spec cards are one step up (`brandCanvas.raised` /
 * `brandSurface`).
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import IconBullets from '../IconBullets';

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

const renderIn = (mode: ThemeMode) =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <IconBullets />
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('IconBullets — heading ink (%s mode)', (mode) => {
  it('clears AA against the page canvas', () => {
    renderIn(mode);
    const heading = screen.getByText('app.landing.iconBullets.heading');
    const ink = rgbToHex(getComputedStyle(heading).color);
    expect(contrastRatio(ink, tokens(mode).surface.base)).toBeGreaterThanOrEqual(4.5);
  });
});

describe.each(['light', 'dark'] as const)('IconBullets — spec card ink (%s mode)', (mode) => {
  it('title clears AA against the card’s own background', () => {
    renderIn(mode);
    const title = screen.getByText('app.landing.iconBullets.specs.A1.title');
    const ink = rgbToHex(getComputedStyle(title).color);
    const card = title.closest('div')?.parentElement as HTMLElement;
    const bg = rgbToHex(getComputedStyle(card).backgroundColor);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('description clears AA against the card’s own background', () => {
    renderIn(mode);
    const desc = screen.getByText('app.landing.iconBullets.specs.A1.desc');
    const ink = rgbToHex(getComputedStyle(desc).color);
    const card = desc.closest('div')?.parentElement as HTMLElement;
    const bg = rgbToHex(getComputedStyle(card).backgroundColor);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
