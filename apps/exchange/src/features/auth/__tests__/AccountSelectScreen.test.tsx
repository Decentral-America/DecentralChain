/**
 * AccountSelectScreen — Ledger visibility
 *
 * Existing Ledger-type accounts (reachable today only via the direct
 * `/import/ledger` URL used for dev/testing) are marked with a badge. The
 * badge doesn't open the Ledger flow, but it does name Ledger, so it stays
 * behind the same flag as every other Ledger mention rather than advertising
 * an integration that isn't finished.
 */
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { lightTheme } from '@/styles/themes';
import { AccountSelectScreen } from '../AccountSelectScreen';

const ledgerFlag = vi.hoisted(() => ({ enabled: false }));

vi.mock('@/config', () => ({
  config: {
    get ledgerEnabled() {
      return ledgerFlag.enabled;
    },
  },
}));
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const account = {
  address: '3PAbcdefghijklmnopqrstuvwxyz12345',
  hash: 'hash-1',
  name: 'Hardware Wallet',
  userType: 'ledger' as const,
};

const setup = () =>
  render(<AccountSelectScreen accounts={[account]} onSelect={vi.fn()} />, {
    wrapper: ({ children }) => <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>,
  });

describe('AccountSelectScreen — Ledger badge', () => {
  it('hides the Ledger badge on a Ledger account while the feature flag is off', () => {
    ledgerFlag.enabled = false;
    setup();
    expect(screen.queryByText(/🔐 ledger/i)).not.toBeInTheDocument();
    // The account itself is still listed — only the badge is gated.
    expect(screen.getByText('Hardware Wallet')).toBeInTheDocument();
  });

  it('shows the Ledger badge on a Ledger account once the feature flag is on', () => {
    ledgerFlag.enabled = true;
    setup();
    expect(screen.getByText(/🔐 ledger/i)).toBeInTheDocument();
  });
});
