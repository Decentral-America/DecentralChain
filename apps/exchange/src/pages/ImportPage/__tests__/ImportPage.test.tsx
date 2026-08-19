/**
 * ImportPage — Ledger visibility
 *
 * The import hub lists one tile per method. Ledger's tile should disappear
 * — not just become unclickable — while the feature flag is off, leaving the
 * other methods (and the route itself, for direct-URL testing) untouched.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { ImportPage } from '../ImportPage';

const ledgerFlag = vi.hoisted(() => ({ enabled: false }));

vi.mock('@/config', () => ({
  config: {
    get ledgerEnabled() {
      return ledgerFlag.enabled;
    },
  },
}));
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));

// `ImportPage` no longer wraps itself in `<ThemeProvider theme={landingTheme}>`
// (task 5) — it inherits `ThemeContext`. Outside the app, that means the test
// must supply a real MUI theme rather than relying on MUI's own internal
// default.
const renderImportPage = () =>
  render(<ImportPage />, {
    wrapper: ({ children }) => (
      <ThemeProvider theme={createAppTheme('light')}>{children}</ThemeProvider>
    ),
  });

describe('ImportPage — Ledger tile', () => {
  it('hides the Ledger Hardware Wallet tile while the feature flag is off', () => {
    ledgerFlag.enabled = false;
    renderImportPage();
    expect(screen.queryByText(/ledger hardware wallet/i)).not.toBeInTheDocument();
    // Unrelated tiles are untouched.
    expect(screen.getByText('Seed Phrase')).toBeInTheDocument();
    expect(screen.getByText('Backup File')).toBeInTheDocument();
    expect(screen.getByText('Cubensis Connect')).toBeInTheDocument();
  });

  it('shows the Ledger Hardware Wallet tile once the feature flag is on', () => {
    ledgerFlag.enabled = true;
    renderImportPage();
    expect(screen.getByText(/ledger hardware wallet/i)).toBeInTheDocument();
  });
});
