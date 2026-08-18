/**
 * ImportPage — Ledger visibility
 *
 * The import hub lists one tile per method. Ledger's tile should disappear
 * — not just become unclickable — while the feature flag is off, leaving the
 * other methods (and the route itself, for direct-URL testing) untouched.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

describe('ImportPage — Ledger tile', () => {
  it('hides the Ledger Hardware Wallet tile while the feature flag is off', () => {
    ledgerFlag.enabled = false;
    render(<ImportPage />);
    expect(screen.queryByText(/ledger hardware wallet/i)).not.toBeInTheDocument();
    // Unrelated tiles are untouched.
    expect(screen.getByText('Seed Phrase')).toBeInTheDocument();
    expect(screen.getByText('Backup File')).toBeInTheDocument();
    expect(screen.getByText('Cubensis Connect')).toBeInTheDocument();
  });

  it('shows the Ledger Hardware Wallet tile once the feature flag is on', () => {
    ledgerFlag.enabled = true;
    render(<ImportPage />);
    expect(screen.getByText(/ledger hardware wallet/i)).toBeInTheDocument();
  });
});
