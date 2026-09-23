/**
 * TransferProgress — what it shows when the bridge API cannot be read.
 *
 * The regression this guards: the component checked `isLoading || !transfer`
 * before it checked `error`. A failing query has no `transfer`, so every error
 * fell into the loading branch and rendered as a bare indeterminate bar — a
 * progress display for a transfer nobody could read, with no explanation and
 * no way to dismiss it. It stayed that way for as long as the API was down.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type TransferProgress as TransferProgressState } from '@/hooks/useTransferStatus';
import { TransferProgress } from '../TransferProgress';

const state = (overrides: Partial<TransferProgressState> = {}): TransferProgressState => ({
  error: null,
  isLoading: false,
  isSettled: false,
  isStranded: false,
  transfer: undefined,
  ...overrides,
});

const mockStatus = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useTransferStatus', () => ({ useTransferStatus: () => mockStatus() }));

const TRANSFER_ID = '4dd786e2955eb70ef38a8afb7a402e12951ac822fc357d389d8fbb8b4bc8b894';

describe('TransferProgress', () => {
  it('reports the error rather than an endless progress bar', () => {
    // `isLoading` true *and* `transfer` undefined is exactly the shape react-query
    // reports while a failed query is retrying — the case the old ordering ate.
    mockStatus.mockReturnValue(state({ error: new TypeError('Failed to fetch'), isLoading: true }));

    render(<TransferProgress transferId={TRANSFER_ID} />);

    expect(screen.getByText('Could not read the status of this transfer.')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('keeps the transfer id visible so a stuck transfer can still be traced', () => {
    mockStatus.mockReturnValue(state({ error: new TypeError('Failed to fetch') }));

    render(<TransferProgress transferId={TRANSFER_ID} />);

    expect(screen.getByText(TRANSFER_ID)).toBeTruthy();
  });

  it('lets the user dismiss a transfer whose status cannot be read', async () => {
    const onDismiss = vi.fn();
    mockStatus.mockReturnValue(state({ error: new TypeError('Failed to fetch') }));

    render(<TransferProgress transferId={TRANSFER_ID} onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('still shows a labelled progress bar during a genuine first load', () => {
    mockStatus.mockReturnValue(state({ isLoading: true }));

    render(<TransferProgress transferId={TRANSFER_ID} />);

    expect(screen.getByText('Reading transfer status…')).toBeTruthy();
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });
});
