/**
 * IntroStep — unit tests
 *
 * With Ledger behind a flag the step is normally an intro with exactly one way
 * forward, so the tests that matter are: Continue works, and the Ledger tile is
 * genuinely absent — not merely disabled — when the caller says so. The caller
 * ANDs the feature flag with WebHID support; that combination is pinned in
 * useCreateWallet's tests.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IntroStep } from '../steps/IntroStep';

const setup = (overrides: Partial<Parameters<typeof IntroStep>[0]> = {}) => {
  const props = {
    onContinue: vi.fn(),
    onLedger: vi.fn(),
    showLedger: false,
    ...overrides,
  };
  render(<IntroStep {...props} />);
  return props;
};

describe('IntroStep', () => {
  it('introduces the flow rather than asking the user to choose a method', () => {
    setup();
    expect(screen.getByText(/before you start/i)).toBeInTheDocument();
    expect(screen.getByText(/your keys stay on this device/i)).toBeInTheDocument();
    expect(screen.getByText(/fifteen words are the only backup/i)).toBeInTheDocument();
    expect(screen.getByText(/nobody can reset them for you/i)).toBeInTheDocument();
  });

  it('advances when Continue is pressed', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(props.onContinue).toHaveBeenCalledTimes(1);
  });

  it('offers no Ledger tile when Ledger is unavailable', () => {
    setup({ showLedger: false });
    // Absent, not disabled: a visible-but-dead tile advertises a path this
    // build cannot complete.
    expect(screen.queryByRole('button', { name: /ledger/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('offers the Ledger tile as a second choice when Ledger is available', async () => {
    const props = setup({ showLedger: true });
    const tile = screen.getByRole('button', { name: /ledger hardware wallet/i });
    expect(tile).toBeEnabled();

    await userEvent.click(tile);
    expect(props.onLedger).toHaveBeenCalledTimes(1);
    // The recovery-phrase path is still the primary one.
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    expect(props.onContinue).not.toHaveBeenCalled();
  });
});
