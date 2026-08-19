/**
 * ImportAccountPage — desktop decorative panel stays one surface
 *
 * The desktop right column floats `ImportAccount` on a decorative panel: a
 * fixed dark gradient background with a glass card on top. That inner card's
 * `bgcolor` was a fixed `rgba(255, 255, 255, 0.95)` regardless of mode.
 * `ImportAccount`'s own `Card` sits inside it and already follows the real
 * app theme (`background.paper` → `surface.raised`) — its ink and its own
 * card background were never at risk (both derive from the same `tokens`
 * source), but the *outer* panel not moving with them meant dark mode
 * fractured a single designed glass panel into a near-white frame around a
 * dark card. Found during task 5's required both-mode inspection of this
 * page's full render tree (task-5-report.md) — not a WCAG text failure, but
 * "does the page still render its intended surface" per the task brief.
 */
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { darkTheme, lightTheme } from '@/styles/themes';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { ImportAccountPage } from '../ImportAccountPage';

vi.mock('@/config', () => ({ config: { ledgerEnabled: false } }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    addAccount: vi.fn(),
    create: vi.fn(),
    getActiveState: () => '/desktop/wallet',
    isAuthenticated: false,
    login: vi.fn(),
    user: null,
  }),
}));
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams()],
}));
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

function rgbToHex(rgbOrRgba: string): string {
  const channels = rgbOrRgba.match(/\d+(\.\d+)?/g);
  if (!channels || channels.length < 3) throw new Error(`Unparseable colour: ${rgbOrRgba}`);
  return `#${channels
    .slice(0, 3)
    .map((c) => Number(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

const renderIn = (mode: ThemeMode) =>
  render(<ImportAccountPage />, {
    wrapper: ({ children }) => (
      <MuiThemeProvider theme={createAppTheme(mode)}>
        <StyledThemeProvider theme={mode === 'light' ? lightTheme : darkTheme}>
          {children}
        </StyledThemeProvider>
      </MuiThemeProvider>
    ),
  });

describe('ImportAccountPage — decorative panel', () => {
  it('stays near-white in light mode (unchanged from before task 5)', () => {
    renderIn('light');
    const panel = screen.getByTestId('import-account-panel');
    expect(rgbToHex(getComputedStyle(panel).backgroundColor)).toBe('#ffffff');
  });

  it('matches the dark surface.raised tone in dark mode, not a light frame', () => {
    renderIn('dark');
    const panel = screen.getByTestId('import-account-panel');
    const hex = rgbToHex(getComputedStyle(panel).backgroundColor);
    // Close to `surface.raised` for dark mode, not the light literal.
    expect(hex).not.toBe('#ffffff');
    expect(contrastRatio(hex, tokens('dark').surface.raised)).toBeLessThan(1.2);
  });

  it('the imported form title still clears AA against the card it actually sits on, in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const { unmount } = renderIn(mode);
      const title = screen.getByText(/import your wallet|add account/i);
      const ink = rgbToHex(getComputedStyle(title).color);
      const bg = rgbToHex(
        getComputedStyle(title.closest('[class*="MuiCard-root"]')!).backgroundColor,
      );
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
      unmount();
    }
  });
});
