/**
 * LoginForm — Ledger visibility
 *
 * The password screen offers a "sign in with Ledger" button below the
 * divider. Same rule as everywhere else Ledger is offered: the feature flag
 * *and* WebHID, and the button must be absent — not disabled — when either
 * is missing.
 */
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { lightTheme } from '@/styles/themes';
import { LoginForm } from '../LoginForm';

const ledgerFlag = vi.hoisted(() => ({ enabled: false }));

vi.mock('@/config', () => ({
  config: {
    get ledgerEnabled() {
      return ledgerFlag.enabled;
    },
  },
}));
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

/** Add or remove WebHID the way a Chrome/Safari split would. */
const setWebHid = (present: boolean) => {
  if (present) {
    Object.defineProperty(navigator, 'hid', { configurable: true, value: {} });
  } else {
    Reflect.deleteProperty(navigator, 'hid');
  }
};

const setup = () =>
  render(<LoginForm />, {
    wrapper: ({ children }) => <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>,
  });

describe('LoginForm — Ledger entry point', () => {
  it('hides the Ledger button while the feature flag is off, even in a WebHID browser', () => {
    ledgerFlag.enabled = false;
    setWebHid(true);
    setup();
    expect(
      screen.queryByRole('button', { name: /ledger hardware wallet/i }),
    ).not.toBeInTheDocument();
  });

  it('hides the Ledger button in a browser without WebHID, even with the flag on', () => {
    ledgerFlag.enabled = true;
    setWebHid(false);
    setup();
    expect(
      screen.queryByRole('button', { name: /ledger hardware wallet/i }),
    ).not.toBeInTheDocument();
  });

  it('offers the Ledger button only when the flag is on and WebHID is available', () => {
    ledgerFlag.enabled = true;
    setWebHid(true);
    setup();
    expect(screen.getByRole('button', { name: /ledger hardware wallet/i })).toBeInTheDocument();
  });
});
