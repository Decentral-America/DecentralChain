/**
 * The transaction dialog.
 *
 * The row that opens it says "Invoke Script · +0 DCC", so the two things worth
 * pinning are the two the row gets wrong: that a swap's payout — made by a
 * contract the called contract called — is found and shown, and that a failed
 * script is not reported as a success because the transaction itself confirmed.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { type AssetDetails } from '@/api/services/assetsService';
import { TransactionDetailsDialog } from '@/features/wallet/TransactionDetailsDialog';
import { createAppTheme } from '@/theme/mui-theme';

const ME = '3DSU5XZpttsoZoWE53DwyZ2AQELV25vYL4e';
const POOL = '3DcZHm89byJjfdkHTJ9m89pyeMk8vChDGtD';
const ROUTER = '3Dc9mKvihe2ujkk7co5oA2HnUJ9W1CGQsYg';
const CR_COIN_ID = 'G9TVbwiiUZd5WxFxoY7Tb6ZPjGGLfynJK4a3aoC59cMo';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { address: ME, name: 'Trader' } }),
}));

const transaction = vi.hoisted(() => ({ current: null as unknown, error: null as unknown }));

vi.mock('@/api/services/addressService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/services/addressService')>()),
  useTransaction: () => ({
    data: transaction.current,
    error: transaction.error,
    isLoading: false,
  }),
}));

const CR_COIN: AssetDetails = {
  assetId: CR_COIN_ID,
  decimals: 8,
  description: 'Activo digital de Costa Rica.',
  issueHeight: 1_000,
  issuer: POOL,
  issuerPublicKey: 'pk',
  issueTimestamp: 1_700_000_000_000,
  minSponsoredAssetFee: null,
  name: 'CR Coin',
  originTransactionId: 'origin',
  quantity: 100_000_000_000,
  reissuable: false,
  scripted: false,
};

vi.mock('@/api/services/assetsService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/services/assetsService')>()),
  useMultipleAssetDetails: () => ({ data: [CR_COIN], error: null, isLoading: false }),
}));

/** TecoBoXvWD15GUz9fkuQPsDvrf8a4KNSwbbpcx4iSLR, as mainnet returned it. */
const swapTx = {
  applicationStatus: 'succeeded',
  call: {
    args: [
      { type: 'string', value: 'DCC' },
      { type: 'integer', value: 35 },
    ],
    function: 'swapExactIn',
  },
  chainId: 63,
  dApp: ROUTER,
  fee: 900_000,
  feeAssetId: null,
  height: 2_321_420,
  id: 'TecoBoXvWD15GUz9fkuQPsDvrf8a4KNSwbbpcx4iSLR',
  payment: [{ amount: 1_000_000, assetId: null }],
  sender: ME,
  senderPublicKey: '8ekgwspUrZaEvbajVAp5XoXiE15zqB1iK73NVhmxfDaR',
  stateChanges: {
    invokes: [
      {
        call: { function: 'applySwap' },
        dApp: POOL,
        payment: [{ amount: 999_580, assetId: null }],
        stateChanges: { transfers: [{ address: ME, amount: 471_541, asset: CR_COIN_ID }] },
      },
    ],
    transfers: [{ address: POOL, amount: 420, asset: null }],
  },
  timestamp: 1_788_071_091_867,
  type: 16,
  version: 2,
};

const renderDialog = () =>
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <TransactionDetailsDialog txId={swapTx.id} onClose={() => {}} />
    </ThemeProvider>,
  );

describe('TransactionDetailsDialog', () => {
  it('says what the contract call did, not that a script ran', () => {
    transaction.current = swapTx;
    transaction.error = null;

    renderDialog();

    expect(screen.getByText('Swapped 0.01 DCC for 0.00471541 CR Coin')).toBeTruthy();
  });

  it('finds the payout the pool made one invoke below the transaction', () => {
    transaction.current = swapTx;
    transaction.error = null;

    renderDialog();

    // Scaled by CR Coin's own eight decimals — printing 471541 here would be
    // wrong by a factor of 100 million on a screen about someone's money.
    expect(screen.getByText('+0.00471541 CR Coin')).toBeTruthy();
    expect(screen.getByText('−0.01 DCC')).toBeTruthy();
  });

  it('leaves out the transfer the router made to somebody else', () => {
    transaction.current = swapTx;
    transaction.error = null;

    renderDialog();

    expect(screen.queryByText(/0\.0000042/)).toBeNull();
  });

  it('reports a failed script even though the transaction confirmed', () => {
    transaction.current = { ...swapTx, applicationStatus: 'script_execution_failed' };
    transaction.error = null;

    renderDialog();

    expect(screen.getByText('Script failed')).toBeTruthy();
    expect(screen.queryByText('Succeeded')).toBeNull();
  });

  it('shows the contract, the function and the fee that was charged', () => {
    transaction.current = swapTx;
    transaction.error = null;

    const { container } = renderDialog();
    const dialog = within(container.ownerDocument.body);

    expect(dialog.getByText(ROUTER)).toBeTruthy();
    expect(dialog.getByText('swapExactIn')).toBeTruthy();
    expect(dialog.getByText('0.009 DCC')).toBeTruthy();
  });

  it('says the node could not be read rather than sitting on a skeleton', () => {
    transaction.current = undefined;
    transaction.error = new TypeError('Failed to fetch');

    renderDialog();

    expect(screen.getByText(/Could not read this transaction/)).toBeTruthy();
  });
});
