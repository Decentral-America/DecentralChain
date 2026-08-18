/**
 * ImportAccount — Ledger visibility
 *
 * The seed/private-key import form also offers a shortcut into the Ledger
 * flow. That shortcut should read the same signal the create-wallet wizard
 * does: the feature flag *and* WebHID support, not WebHID alone. Absent, not
 * merely unclickable, when either is missing.
 */
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { lightTheme } from '@/styles/themes';
import { ImportAccount } from '../ImportAccount';

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
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));
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
  render(<ImportAccount />, {
    wrapper: ({ children }) => <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>,
  });

describe('ImportAccount — Ledger entry point', () => {
  it('hides the Ledger shortcut while the feature flag is off, even in a WebHID browser', () => {
    ledgerFlag.enabled = false;
    setWebHid(true);
    setup();
    expect(screen.queryByText(/using a ledger hardware wallet/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /import from ledger/i })).not.toBeInTheDocument();
  });

  it('hides the Ledger shortcut in a browser without WebHID, even with the flag on', () => {
    ledgerFlag.enabled = true;
    setWebHid(false);
    setup();
    expect(screen.queryByRole('link', { name: /import from ledger/i })).not.toBeInTheDocument();
  });

  it('offers the Ledger shortcut only when the flag is on and WebHID is available', () => {
    ledgerFlag.enabled = true;
    setWebHid(true);
    setup();
    expect(screen.getByRole('link', { name: /import from ledger/i })).toBeInTheDocument();
  });
});
