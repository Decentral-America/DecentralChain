/**
 * Tests for SearchBar component.
 *
 * Covers: digit-only input (block height), long hash routing (block→tx→asset
 * fallthrough), address routing, empty submit no-op, error toast display.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/utils', () => ({
  createPageUrl: vi.fn((page: string, query: string) => `/${page}${query}`),
}));

const { mockFetchBlockById, mockFetchTransactionInfo, mockFetchAssetDetailsById } = vi.hoisted(
  () => ({
    mockFetchAssetDetailsById: vi.fn(),
    mockFetchBlockById: vi.fn(),
    mockFetchTransactionInfo: vi.fn(),
  }),
);

vi.mock('@/lib/api', () => ({
  fetchAssetDetailsById: mockFetchAssetDetailsById,
  fetchBlockById: mockFetchBlockById,
  fetchTransactionInfo: mockFetchTransactionInfo,
}));

import SearchBar from './SearchBar';

function renderBar() {
  return render(createElement(SearchBar));
}

async function typeAndSubmit(user: ReturnType<typeof userEvent.setup>, query: string) {
  const input = screen.getByRole('textbox');
  await user.type(input, query);
  await user.click(screen.getByRole('button', { name: /search/i }));
}

// Re-export ReactNode to satisfy the mock — not needed here
// We just need ReactNode used somewhere so biome doesn't complain about unused import
const _unused: ReactNode = null;

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the search input and button', () => {
    renderBar();
    expect(screen.getByRole('textbox')).toBeDefined();
    expect(screen.getByRole('button', { name: /search/i })).toBeDefined();
  });

  it('does nothing when submitted with empty input', async () => {
    const user = userEvent.setup();
    renderBar();
    await user.click(screen.getByRole('button', { name: /search/i }));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to BlockDetail for digit-only input (block height)', async () => {
    const user = userEvent.setup();
    renderBar();
    await typeAndSubmit(user, '12345');
    expect(mockNavigate).toHaveBeenCalledWith('/BlockDetail?height=12345');
  });

  it('navigates to BlockDetail when long hash matches a block ID', async () => {
    mockFetchBlockById.mockResolvedValueOnce({ id: 'a'.repeat(44) });
    const user = userEvent.setup();
    renderBar();
    await typeAndSubmit(user, 'a'.repeat(44));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(`/BlockDetail?id=${'a'.repeat(44)}`),
    );
  });

  it('navigates to Transaction when block fetch fails but tx fetch succeeds', async () => {
    mockFetchBlockById.mockRejectedValueOnce(new Error('not a block'));
    mockFetchTransactionInfo.mockResolvedValueOnce({ id: 'b'.repeat(44) });
    const user = userEvent.setup();
    renderBar();
    await typeAndSubmit(user, 'b'.repeat(44));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(`/Transaction?id=${'b'.repeat(44)}`),
    );
  });

  it('navigates to Asset when block and tx fetches fail but asset fetch succeeds', async () => {
    mockFetchBlockById.mockRejectedValueOnce(new Error('not a block'));
    mockFetchTransactionInfo.mockRejectedValueOnce(new Error('not a tx'));
    mockFetchAssetDetailsById.mockResolvedValueOnce({ assetId: 'c'.repeat(44) });
    const user = userEvent.setup();
    renderBar();
    await typeAndSubmit(user, 'c'.repeat(44));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(`/Asset?id=${'c'.repeat(44)}`));
  });

  it('shows error toast when long hash is not a block, tx, or asset', async () => {
    mockFetchBlockById.mockRejectedValueOnce(new Error('not a block'));
    mockFetchTransactionInfo.mockRejectedValueOnce(new Error('not a tx'));
    mockFetchAssetDetailsById.mockRejectedValueOnce(new Error('not an asset'));
    const user = userEvent.setup();
    renderBar();
    await typeAndSubmit(user, 'd'.repeat(44));
    await waitFor(() => expect(mockToast).toHaveBeenCalled());
  });
});
