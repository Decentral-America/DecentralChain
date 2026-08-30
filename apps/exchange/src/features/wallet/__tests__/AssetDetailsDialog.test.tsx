/**
 * The asset info dialog.
 *
 * Two things are worth pinning here. The first is that the base asset does not
 * go to the node: there is no `/assets/details/DCC` to answer, so the dialog
 * has to state its facts itself rather than sit on a spinner. The second is
 * that every figure shown is one the node returned — the amounts are scaled by
 * the asset's own decimals, which is the bug class that matters most on a
 * screen about someone's balance.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type AssetDetails } from '@/api/services/assetsService';
import { AssetDetailsDialog, type AssetDialogAsset } from '@/features/wallet/AssetDetailsDialog';
import { createAppTheme } from '@/theme/mui-theme';

const ME = '3PMyAddress';
const ISSUER = '3DUM611HQFwQcCQDQnA5W92Xs219smEHaaP';
const ASSET_ID = 'G9TVbwiiUZd5WxFxoY7Tb6ZPjGGLfynJK4a3aoC59cMo';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { address: ME, name: 'Trader' } }),
}));

const assetDetails = vi.hoisted(() => ({ current: null as unknown }));
const addressTransactions = vi.hoisted(() => ({ current: [] as unknown[][] }));

vi.mock('@/api/services/assetsService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/services/assetsService')>()),
  useAssetDetails: () => ({ data: assetDetails.current, error: null, isLoading: false }),
}));

vi.mock('@/api/services/addressService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/services/addressService')>()),
  useAddressTransactions: () => ({ data: addressTransactions.current, isLoading: false }),
}));

const CR_COIN: AssetDetails = {
  assetId: ASSET_ID,
  decimals: 8,
  description: 'Activo digital de Costa Rica.',
  issueHeight: 1_000,
  issuer: ISSUER,
  issuerPublicKey: 'pubkey',
  issueTimestamp: Date.UTC(2021, 7, 10, 17, 52),
  minSponsoredAssetFee: 50_000_000,
  name: 'CR Coin',
  originTransactionId: 'origin',
  quantity: 2_099_989_442_000_000,
  reissuable: false,
  scripted: false,
};

const holding: AssetDialogAsset = {
  amount: 78_000,
  assetId: ASSET_ID,
  decimals: 8,
  isBaseAsset: false,
  name: 'CR Coin',
  reserved: 0,
};

const open = (asset: AssetDialogAsset = holding) =>
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <AssetDetailsDialog asset={asset} onClose={vi.fn()} />
    </ThemeProvider>,
  );

describe('AssetDetailsDialog', () => {
  it('reports what the node returned about an issued asset', () => {
    assetDetails.current = CR_COIN;
    open();

    expect(screen.getByText(ISSUER)).toBeInTheDocument();
    expect(screen.getByText(ASSET_ID)).toBeInTheDocument();
    // 2,099,989,442,000,000 base units at 8 decimals.
    expect(screen.getByText('20,999,894.42')).toBeInTheDocument();
    expect(screen.getByText('Not reissuable')).toBeInTheDocument();
    expect(screen.getByText('0.5 CR Coin')).toBeInTheDocument();
    expect(screen.getByText('Activo digital de Costa Rica.')).toBeInTheDocument();
  });

  it('says an unsponsored asset has no fee rather than printing zero', () => {
    // A 0 would read as "free to use as a fee asset", which is the opposite of
    // what a null minSponsoredAssetFee means.
    assetDetails.current = { ...CR_COIN, minSponsoredAssetFee: null };
    open();

    const row = screen.getByText('Sponsored asset fee').parentElement as HTMLElement;
    expect(within(row).getByText('—')).toBeInTheDocument();
  });

  it('states the base asset itself instead of asking the node for it', () => {
    // There is no /assets/details/DCC — the base asset was never issued by a
    // transaction, so it has no id, issuer or supply record to fetch.
    assetDetails.current = null;
    open({
      amount: 670_100,
      assetId: 'DCC',
      decimals: 8,
      isBaseAsset: true,
      name: 'DecentralChain',
      reserved: 10,
    });

    expect(screen.getByText('Native asset')).toBeInTheDocument();
    expect(screen.getByText('Base asset')).toBeInTheDocument();
    expect(screen.queryByText(/Could not load/)).not.toBeInTheDocument();
  });

  it('separates the reserved balance from the spendable one', async () => {
    // Folding reserved into the balance would tell someone they can spend
    // money the node has locked into an order or a lease.
    assetDetails.current = null;
    open({
      amount: 670_100,
      assetId: 'DCC',
      decimals: 8,
      isBaseAsset: true,
      name: 'DecentralChain',
      reserved: 10,
    });

    await userEvent.click(screen.getByRole('tab', { name: 'Balance' }));

    expect(screen.getByText('670,100 DCC')).toBeInTheDocument();
    expect(screen.getByText('10 DCC')).toBeInTheDocument();
    expect(screen.getByText('670,110 DCC')).toBeInTheDocument();
  });

  it('scales history amounts by the asset’s own decimals', async () => {
    // The failure this guards against is a fixed 10^8: right for DCC and wrong
    // by a factor of a hundred for a six-decimal token.
    assetDetails.current = { ...CR_COIN, decimals: 6 };
    addressTransactions.current = [
      [{ amount: 5_000_000, assetId: ASSET_ID, id: 'tx1', recipient: ME, timestamp: 1, type: 4 }],
    ];
    open({ ...holding, decimals: 6 });

    await userEvent.click(screen.getByRole('tab', { name: 'Transactions' }));

    expect(screen.getByText('Received')).toBeInTheDocument();
    expect(screen.getByText('5 CR Coin')).toBeInTheDocument();
  });

  it('keeps another asset’s transactions out of this asset’s history', async () => {
    assetDetails.current = CR_COIN;
    addressTransactions.current = [
      [
        { amount: 1, assetId: ASSET_ID, id: 'mine', recipient: ME, timestamp: 1, type: 4 },
        {
          amount: 2,
          assetId: 'SomeOtherAssetId',
          id: 'theirs',
          recipient: ME,
          timestamp: 1,
          type: 4,
        },
      ],
    ];
    open();

    await userEvent.click(screen.getByRole('tab', { name: 'Transactions' }));

    expect(screen.getAllByText('Received')).toHaveLength(1);
  });
});
