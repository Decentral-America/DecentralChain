/**
 * BigCTA — CTA ink contrast across app themes
 *
 * Same defect class as `Header.contrast.test.tsx`: the closing panel's own
 * canvas (`ctaGradientStyles`, a fixed indigo band) never changes with the
 * app-wide toggle, but its "Create your wallet" pill button used
 * `color: 'primary.main'` — theme-relative. Once the page stopped forcing
 * `landingTheme`, dark mode resolves `primary.main` to `tokens('dark')
 * .accent.primary` (`#8b7dff`), which measures 3.24:1 against the button's
 * white background — below the 4.5:1 AA floor.
 *
 * Task 11: the panel itself now follows the toggle too. Dark mode keeps the
 * fixed `ctaGradientStyles` band (`brandGradient.band`) it was art-directed
 * for — its heading ink is checked directly against the gradient's own
 * lightest stop, not through `tokens('dark')`, per the "fixed fill needs
 * fixed ink" rule. Light mode swaps the fixed gradient for a solid
 * `tokens('light').accent.primary` fill with `accent.onPrimary` ink — a
 * mode-aware fill paired with matching mode-aware ink, not a fixed literal
 * that happens to still read.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import BigCTA from '../BigCTA';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));

function rgbToHex(rgb: string): string {
  const channels = rgb.match(/\d+(\.\d+)?/g);
  if (!channels || channels.length < 3) throw new Error(`Unparseable colour: ${rgb}`);
  return `#${channels
    .slice(0, 3)
    .map((c) => Number(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

const renderIn = (mode: 'light' | 'dark') =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <BigCTA />
    </ThemeProvider>,
  );

describe.each([
  'light',
  'dark',
] as const)('BigCTA — "Create your wallet" pill ink (%s mode)', (mode) => {
  it('clears AA against its own white background in both modes', () => {
    renderIn(mode);
    const button = screen.getByRole('button', { name: 'app.landing.bigCta.ctaCreate' });
    const ink = rgbToHex(getComputedStyle(button).color);
    const bg = rgbToHex(getComputedStyle(button).backgroundColor);
    expect(bg).toBe('#ffffff');
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

/** The lightest stop of `brandGradient.band` — the hardest point for light-on-dark ink. */
const CTA_GRADIENT_LIGHTEST_STOP = '#5e2ca5';

describe('BigCTA — panel background follows the toggle', () => {
  it('dark mode keeps the fixed indigo band', () => {
    renderIn('dark');
    const panel = screen.getByText('app.landing.bigCta.heading').parentElement as HTMLElement;
    // `ctaGradientStyles.background` is a `linear-gradient(...)`, not a flat
    // colour — its presence (rather than a flat `accent.primary` fill) is
    // what distinguishes the dark-mode branch.
    expect(getComputedStyle(panel).backgroundImage).toContain('linear-gradient');
  });

  it('light mode uses a solid tokens(mode).accent.primary fill, not the fixed gradient', () => {
    renderIn('light');
    const panel = screen.getByText('app.landing.bigCta.heading').parentElement as HTMLElement;
    const style = getComputedStyle(panel);
    expect(style.backgroundImage).not.toContain('linear-gradient');
    expect(rgbToHex(style.backgroundColor)).toBe(tokens('light').accent.primary);
  });
});

describe.each(['light', 'dark'] as const)('BigCTA — heading ink (%s mode)', (mode: ThemeMode) => {
  it('clears AA against the panel’s own background', () => {
    renderIn(mode);
    const heading = screen.getByText('app.landing.bigCta.heading');
    const ink = rgbToHex(getComputedStyle(heading).color);
    const bg =
      mode === 'dark'
        ? CTA_GRADIENT_LIGHTEST_STOP
        : rgbToHex(getComputedStyle(heading.parentElement as HTMLElement).backgroundColor);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
