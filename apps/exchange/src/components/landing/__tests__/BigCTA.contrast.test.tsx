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
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio } from '@/theme/tokens/semantic';
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
