/**
 * SignIn — canvas-ink contrast
 *
 * `AuthScene` renders a light-mode gradient wash between `surface.base` and
 * `surface.sunken` (see AuthScene.test.tsx). SignIn used to paint its own
 * text with `onCanvas.*` — ink hardcoded for the dark night canvas that used
 * to be the only option. Fix round 1 (task-4-report.md) found that ink still
 * live once the wash replaced the night canvas: white-on-near-white,
 * effectively invisible on the app's own entry point.
 *
 * These tests pin real computed colour against both wash stops so a future
 * hardcoded `onCanvas`/`common.white` reintroduction fails loudly instead of
 * shipping invisible text. Note SignIn currently always renders through
 * `landingTheme` (hardcoded `mode: 'light'`), so this exercises exactly the
 * path that broke in production.
 */
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { lightTheme } from '@/styles/themes';
import { contrastRatio, tokens } from '@/theme/tokens/semantic';
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

const WASH_BASE = tokens('light').surface.base;
const WASH_SUNKEN = tokens('light').surface.sunken;

/** `getComputedStyle` reports `rgb(r, g, b)`; `contrastRatio` takes hex only. */
function rgbToHex(rgb: string): string {
  const channels = rgb.match(/\d+(\.\d+)?/g);
  if (!channels || channels.length < 3) throw new Error(`Unparseable colour: ${rgb}`);
  return `#${channels
    .slice(0, 3)
    .map((c) => Number(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

const expectClearsAA = (element: HTMLElement) => {
  const hex = rgbToHex(getComputedStyle(element).color);
  expect(contrastRatio(hex, WASH_BASE)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(hex, WASH_SUNKEN)).toBeGreaterThanOrEqual(4.5);
};

const renderSignIn = () =>
  render(<SignIn />, {
    wrapper: ({ children }) => (
      <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
    ),
  });

describe('SignIn — text painted directly on the AuthScene canvas', () => {
  it('subtitle clears AA against both wash stops', () => {
    renderSignIn();
    expectClearsAA(screen.getByText(/Sign in to access your account/i));
  });

  it('feature title clears AA against both wash stops', () => {
    renderSignIn();
    expectClearsAA(screen.getByText('Bank-grade security'));
  });

  it('feature description clears AA against both wash stops', () => {
    renderSignIn();
    expectClearsAA(screen.getByText(/Your keys, your crypto/i));
  });

  it('the logo wordmark accent clears AA against both wash stops', () => {
    renderSignIn();
    expectClearsAA(screen.getByText('.Exchange'));
  });

  it('"Import existing wallet" clears AA against both wash stops', () => {
    renderSignIn();
    // Exact, case-sensitive: `LoginForm` also mounts a hidden `NoAccountModal`
    // with an "Import Existing Wallet" button — a loose match would collide.
    expectClearsAA(screen.getByRole('button', { name: 'Import existing wallet ›' }));
  });

  it('"Create a new wallet" clears AA against both wash stops', () => {
    renderSignIn();
    expectClearsAA(screen.getByRole('button', { name: /create a new wallet/i }));
  });
});
