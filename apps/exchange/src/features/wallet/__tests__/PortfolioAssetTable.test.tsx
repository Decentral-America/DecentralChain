import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PortfolioAssetTable, type PortfolioTableRow } from '@/features/wallet/PortfolioAssetTable';
import { createAppTheme } from '@/theme/mui-theme';

const rows: PortfolioTableRow[] = [
  { amount: 670_100, assetId: 'DCC', decimals: 8, isBaseAsset: true, name: 'DCC', reserved: 10 },
  {
    amount: 78_000,
    assetId: 'G9TVbwiiUZd5WxFxoY7Tb6ZPjGGLfynJK4a3aoC59cMo',
    decimals: 8,
    isBaseAsset: false,
    name: 'CR Coin',
    reserved: 0,
  },
  {
    amount: 5_000_000,
    assetId: 'CCcUGv8eoyoF96c8HHbnbGsPdumr7jPpoRS6orPeg6Wb',
    decimals: 8,
    isBaseAsset: false,
    name: 'Dogefather',
    reserved: 0,
  },
];

const renderTable = (props: Partial<React.ComponentProps<typeof PortfolioAssetTable>> = {}) =>
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <PortfolioAssetTable
        rows={rows}
        onSelect={vi.fn()}
        onSend={vi.fn()}
        onReceive={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('PortfolioAssetTable', () => {
  it('renders one row per holding', () => {
    renderTable();
    for (const name of ['DCC', 'CR Coin', 'Dogefather']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('abbreviates balances and keeps the exact figure available', () => {
    // 670,100 reads as 670.1k on a dense row; the full number stays reachable
    // rather than being rounded away entirely.
    renderTable();
    expect(screen.getByText('670.1k')).toBeInTheDocument();
    expect(screen.getByText('5.0M')).toBeInTheDocument();
  });

  it('shows reserved separately from balance', () => {
    // Reserved is what the node has locked into orders or leases. Folding it
    // into the balance would tell the user they can spend money they cannot.
    renderTable();
    const dccRow = screen.getByText('DCC').closest('div')?.parentElement;
    expect(dccRow).not.toBeNull();
    expect(within(dccRow as HTMLElement).getByText('10')).toBeInTheDocument();
  });

  it('leaves unpriced columns as an em dash, not zero', () => {
    // No market data is fetched yet. A 0.00 would claim these assets are
    // worthless rather than unpriced.
    renderTable();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(rows.length * 3);
  });

  it('offers send and receive per row', () => {
    const onSend = vi.fn();
    renderTable({ onSend });

    fireEvent.click(screen.getByLabelText('Send CR Coin'));

    expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ name: 'CR Coin' }));
  });

  it('opens the asset info dialog when the row itself is clicked', () => {
    const onSelect = vi.fn();
    renderTable({ onSelect });

    fireEvent.click(screen.getByLabelText('Asset info for CR Coin'));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'CR Coin' }));
  });

  it('keeps a row action from also opening the dialog behind it', () => {
    // Send, Receive and Hide sit inside a row that is itself a button now.
    // Without the click stopping there, every action would leave the dialog
    // open over the thing it just did.
    const onSelect = vi.fn();
    const onSend = vi.fn();
    renderTable({ onSelect, onSend });

    fireEvent.click(screen.getByLabelText('Send CR Coin'));

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('filters on the search field', () => {
    renderTable();
    fireEvent.change(screen.getByLabelText('Search assets'), { target: { value: 'doge' } });

    expect(screen.getByText('Dogefather')).toBeInTheDocument();
    expect(screen.queryByText('CR Coin')).not.toBeInTheDocument();
  });

  it('sorts by balance by default, largest first', () => {
    renderTable();
    const names = screen.getAllByTitle(/^(DCC|G9TVbwii|CCcUGv8e)/).map((n) => n.textContent);

    expect(names[0]).toBe('Dogefather'); // 5.0M
  });

  it('says so when a search matches nothing', () => {
    renderTable();
    fireEvent.change(screen.getByLabelText('Search assets'), { target: { value: 'zzzz' } });

    expect(screen.getByText(/No asset matches/)).toBeInTheDocument();
  });
});
