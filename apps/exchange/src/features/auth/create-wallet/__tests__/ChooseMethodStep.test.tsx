/**
 * ChooseMethodStep — unit tests
 *
 * Both tiles are real, keyboard-reachable buttons; the Ledger tile must
 * actually block interaction (not just look muted) when the platform can't
 * support it.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChooseMethodStep } from '../steps/ChooseMethodStep';

const setup = (overrides: Partial<Parameters<typeof ChooseMethodStep>[0]> = {}) => {
  const props = {
    isLedgerSupported: true,
    onLedger: vi.fn(),
    onSeed: vi.fn(),
    ...overrides,
  };
  render(<ChooseMethodStep {...props} />);
  return props;
};

describe('ChooseMethodStep', () => {
  it('renders both tiles with their accessible names', () => {
    setup();
    expect(screen.getByRole('button', { name: /recovery phrase/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ledger hardware wallet/i })).toBeInTheDocument();
  });

  it('calls onSeed when the recovery-phrase tile is clicked', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    expect(props.onSeed).toHaveBeenCalled();
  });

  it('calls onLedger when the Ledger tile is clicked and Ledger is supported', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: /ledger hardware wallet/i }));
    expect(props.onLedger).toHaveBeenCalled();
  });

  it('disables and relabels the Ledger tile, and blocks the click, when unsupported', async () => {
    const props = setup({ isLedgerSupported: false });
    const ledgerTile = screen.getByRole('button', { name: /needs chrome or edge/i });
    expect(ledgerTile).toBeDisabled();
    await userEvent.click(ledgerTile);
    expect(props.onLedger).not.toHaveBeenCalled();
  });
});
