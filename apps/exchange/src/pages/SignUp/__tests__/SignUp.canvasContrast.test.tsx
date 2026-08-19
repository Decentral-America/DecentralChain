/**
 * SignUp — canvas-ink contrast, both modes
 *
 * `AuthScene` renders a light-mode gradient wash between `surface.base` and
 * `surface.sunken`, and a solid dark canvas (`surface.base`) with the aurora
 * in dark mode (see AuthScene.test.tsx). SignUp used to paint its own text
 * with `onCanvas.*` — ink hardcoded for the dark night canvas that used to be
 * the only option. Fix round 1 (task-4-report.md) found that ink still live
 * once the wash replaced the night canvas: white-on-near-white, effectively
 * invisible on this page.
 *
 * These tests pin real computed colour against the actual canvas stops for
 * each mode so a future hardcoded `onCanvas`/`common.white` reintroduction
 * fails loudly instead of shipping invisible text. SignUp now inherits the
 * app's real theme (task-5) rather than always rendering through
 * `landingTheme` (hardcoded `mode: 'light'`), so both modes are exercised.
 */
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { darkTheme, lightTheme } from '@/styles/themes';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { SignUp } from '../SignUp';

const { seedCreate } = vi.hoisted(() => ({ seedCreate: vi.fn() }));

vi.mock('@/config', () => ({ config: { ledgerEnabled: false } }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    create: vi.fn().mockResolvedValue(undefined),
    getActiveState: () => '/desktop/wallet',
    isAuthenticated: false,
    user: null,
  }),
}));
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/hooks/useClipboard', () => ({
  useClipboard: () => ({ copyToClipboard: vi.fn(), isCopied: false }),
}));
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));
vi.mock('data-service/classes/Seed', () => ({ Seed: { create: seedCreate } }));

/** `getComputedStyle` reports `rgb(r, g, b)`; `contrastRatio` takes hex only. */
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
 * The canvas stops `AuthScene` actually paints for a mode: the light wash
 * runs between `surface.base` and `surface.sunken`; dark mode is a flat
 * `surface.base` fill (no gradient), so both "stops" are the same value —
 * still worth asserting, so a future gradient reintroduction in dark mode
 * is caught too.
 */
function canvasStopsFor(mode: ThemeMode): [string, string] {
  const t = tokens(mode);
  return mode === 'light' ? [t.surface.base, t.surface.sunken] : [t.surface.base, t.surface.base];
}

const expectClearsAA = (element: HTMLElement, mode: ThemeMode) => {
  const hex = rgbToHex(getComputedStyle(element).color);
  const [a, b] = canvasStopsFor(mode);
  expect(contrastRatio(hex, a)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(hex, b)).toBeGreaterThanOrEqual(4.5);
};

const renderSignUp = (mode: ThemeMode) =>
  render(<SignUp />, {
    wrapper: ({ children }) => (
      <MuiThemeProvider theme={createAppTheme(mode)}>
        <StyledThemeProvider theme={mode === 'light' ? lightTheme : darkTheme}>
          {children}
        </StyledThemeProvider>
      </MuiThemeProvider>
    ),
  });

describe.each([
  'light',
  'dark',
] as const)('SignUp — text painted directly on the AuthScene canvas (%s mode)', (mode) => {
  it('subtitle clears AA against the canvas', () => {
    renderSignUp(mode);
    expectClearsAA(screen.getByText(/Create your wallet and get instant access/i), mode);
  });

  it('feature title clears AA against the canvas', () => {
    renderSignUp(mode);
    expectClearsAA(screen.getByText('Non-custodial security'), mode);
  });

  it('feature description clears AA against the canvas', () => {
    renderSignUp(mode);
    expectClearsAA(screen.getByText(/You control your private keys/i), mode);
  });

  it('the logo wordmark accent clears AA against the canvas', () => {
    renderSignUp(mode);
    expectClearsAA(screen.getByText('.Exchange'), mode);
  });

  it('"Already have an account? Sign in" clears AA against the canvas', () => {
    renderSignUp(mode);
    expectClearsAA(
      screen.getByRole('button', { name: /already have an account\? sign in/i }),
      mode,
    );
  });
});

describe('SignUp — mode responsiveness', () => {
  it('renders the dark aurora canvas when the app theme is dark', () => {
    renderSignUp('dark');
    expect(screen.getByTestId('auth-canvas')).toHaveAttribute('data-decor', 'aurora');
  });

  it('renders the light wash canvas when the app theme is light', () => {
    renderSignUp('light');
    expect(screen.getByTestId('auth-canvas')).toHaveAttribute('data-decor', 'wash');
  });
});
