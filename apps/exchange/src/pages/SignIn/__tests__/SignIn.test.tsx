/**
 * SignIn — canvas-ink contrast, both modes
 *
 * `AuthScene` renders a light-mode gradient wash between `surface.base` and
 * `surface.sunken`, and a solid dark canvas (`surface.base`) with the aurora
 * in dark mode (see AuthScene.test.tsx). SignIn used to paint its own text
 * with `onCanvas.*` — ink hardcoded for the dark night canvas that used to be
 * the only option. Fix round 1 (task-4-report.md) found that ink still live
 * once the wash replaced the night canvas: white-on-near-white, effectively
 * invisible on the app's own entry point.
 *
 * These tests pin real computed colour against the actual canvas stops for
 * each mode so a future hardcoded `onCanvas`/`common.white` reintroduction
 * fails loudly instead of shipping invisible text. SignIn now inherits the
 * app's real theme (task-5) rather than always rendering through
 * `landingTheme` (hardcoded `mode: 'light'`), so both modes are exercised —
 * this is the render path a user actually gets once the Settings toggle is
 * flipped.
 */
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { darkTheme, lightTheme } from '@/styles/themes';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { SignIn } from '../SignIn';

vi.mock('@/config', () => ({ config: { ledgerEnabled: false } }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    getActiveState: () => '/desktop/wallet',
    isAuthenticated: false,
    login: vi.fn(),
    user: null,
  }),
}));
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

/** `getComputedStyle` reports `rgb(r, g, b)`; `contrastRatio` takes hex only. */

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

const renderSignIn = (mode: ThemeMode) =>
  render(<SignIn />, {
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
] as const)('SignIn — text painted directly on the AuthScene canvas (%s mode)', (mode) => {
  it('subtitle clears AA against the canvas', () => {
    renderSignIn(mode);
    expectClearsAA(screen.getByText(/Sign in to access your account/i), mode);
  });

  it('feature title clears AA against the canvas', () => {
    renderSignIn(mode);
    expectClearsAA(screen.getByText('Bank-grade security'), mode);
  });

  it('feature description clears AA against the canvas', () => {
    renderSignIn(mode);
    expectClearsAA(screen.getByText(/Your keys, your crypto/i), mode);
  });

  it('the logo wordmark accent clears AA against the canvas', () => {
    renderSignIn(mode);
    expectClearsAA(screen.getByText('.Exchange'), mode);
  });

  it('"Import existing wallet" clears AA against the canvas', () => {
    renderSignIn(mode);
    // Exact, case-sensitive: `LoginForm` also mounts a hidden `NoAccountModal`
    // with an "Import Existing Wallet" button — a loose match would collide.
    expectClearsAA(screen.getByRole('button', { name: 'Import existing wallet ›' }), mode);
  });

  it('"Create a new wallet" clears AA against the canvas', () => {
    renderSignIn(mode);
    expectClearsAA(screen.getByRole('button', { name: /create a new wallet/i }), mode);
  });
});

describe('SignIn — mode responsiveness', () => {
  it('renders the dark aurora canvas when the app theme is dark', () => {
    renderSignIn('dark');
    expect(screen.getByTestId('auth-canvas')).toHaveAttribute('data-decor', 'aurora');
  });

  it('renders the light wash canvas when the app theme is light', () => {
    renderSignIn('light');
    expect(screen.getByTestId('auth-canvas')).toHaveAttribute('data-decor', 'wash');
  });
});

/**
 * An `rgba(...)` border composited over an opaque ground, as an opaque hex.
 *
 * The shared `rgbToHex` helper DROPS the alpha channel — documented after
 * Task 5 as a systemic blind spot across every contrast suite here. For a
 * border specified with alpha that reads optimistically bright, so a
 * translucent value has to be composited before it can honestly be measured.
 */
function compositeOver(value: string, groundHex: string): string {
  const parts = value.match(/[\d.]+/g);
  if (!parts) throw new Error(`unparseable colour: ${value}`);
  const [r, g, b] = parts.slice(0, 3).map(Number) as [number, number, number];
  const a = parts.length > 3 ? Number(parts[3]) : 1;
  const ground = [1, 3, 5].map((i) => Number.parseInt(groundHex.slice(i, i + 2), 16));
  const out = [r, g, b].map((c, i) => Math.round(c * a + ground[i]! * (1 - a)));
  return `#${out.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * The "Create a new wallet" outline (final-review item 8).
 *
 * `variant="outlined"` gives this control no fill, so the border is the only
 * thing identifying it as a button — WCAG 1.4.11's 3:1 non-text floor. The
 * light branch was `border.strong` at 1.5963:1 against the canvas, a gap
 * parked twice as unfixable on the claim that no existing token cleared 3:1
 * here. `text.tertiary` clears at 5.01:1 / 4.61:1 against the wash's two
 * stops. The dark branch (`alpha(text.primary, 0.4)`) already cleared at
 * 3.54:1 composited and is unchanged.
 */
describe.each(['light', 'dark'] as const)('SignIn — outlined-button border (%s mode)', (mode) => {
  it("clears WCAG 1.4.11's 3:1 non-text floor against the auth canvas", () => {
    renderSignIn(mode);
    const button = screen.getByRole('button', { name: /create a new wallet/i });
    const raw = getComputedStyle(button).borderTopColor;
    const t = tokens(mode);
    const grounds = mode === 'dark' ? [t.surface.base] : [t.surface.base, t.surface.sunken];
    for (const ground of grounds) {
      expect(contrastRatio(compositeOver(raw, ground), ground)).toBeGreaterThanOrEqual(3);
    }
  });
});
