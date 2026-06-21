import {
  broadcast,
  issue,
  sponsorship as setSponsor,
  transfer,
  waitForTx,
} from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { fundAccount, randomTestAccount } from '../helpers/accounts';
import { assertAppearsInDataService } from '../helpers/data-service';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);
const TIMEOUT = 120_000;

describe('Sponsorship (type 14)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let assetId: string;
  let sponsorTxId: string;

  beforeAll(async () => {
    // Issue an asset to sponsor
    const issueTx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 2,
        description: 'Sponsorship E2E test asset',
        name: `SPNS${Date.now().toString(36).slice(-4).toUpperCase()}`,
        quantity: 10_000,
        reissuable: false,
      },
      MASTER_SEED,
    );

    await broadcast(issueTx, API_BASE);
    await waitForTx(issueTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    assetId = issueTx.id;
  }, TIMEOUT);

  it('enables sponsorship on an asset', async () => {
    const tx = setSponsor(
      {
        assetId,
        chainId: CHAIN_ID,
        minSponsoredAssetFee: 100,
      },
      MASTER_SEED,
    );

    sponsorTxId = tx.id;
    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(sponsorTxId, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);
  });

  it('appears in /v0/transactions/sponsorship', async () => {
    await assertAppearsInDataService(
      sponsorTxId,
      `/v0/transactions/sponsorship?sender=${MASTER_ADDR}&limit=10`,
      API_BASE,
    );
  });

  it('disables sponsorship (minSponsoredAssetFee=0)', async () => {
    // Issue a fresh asset for this test to keep state isolated
    const issueTx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 2,
        description: 'Sponsorship disable E2E test asset',
        name: `SPND${Date.now().toString(36).slice(-4).toUpperCase()}`,
        quantity: 5_000,
        reissuable: false,
      },
      MASTER_SEED,
    );
    await broadcast(issueTx, API_BASE);
    await waitForTx(issueTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    const localAssetId = issueTx.id;

    // Enable sponsorship at 100
    const enableTx = setSponsor(
      {
        assetId: localAssetId,
        chainId: CHAIN_ID,
        minSponsoredAssetFee: 100,
      },
      MASTER_SEED,
    );
    await broadcast(enableTx, API_BASE);
    await waitForTx(enableTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    // Disable sponsorship by setting minSponsoredAssetFee to 0
    const disableTx = setSponsor(
      {
        assetId: localAssetId,
        chainId: CHAIN_ID,
        minSponsoredAssetFee: 0,
      },
      MASTER_SEED,
    );
    await broadcast(disableTx, API_BASE);
    await waitForTx(disableTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    // Fetch asset details and confirm sponsorship is removed
    const res = await fetch(`${API_BASE}assets/details/${localAssetId}`);
    expect(res.ok).toBe(true);
    const details = (await res.json()) as { minSponsoredAssetFee: number | null };
    // Node returns null or 0 when sponsorship is disabled
    expect(details.minSponsoredAssetFee == null || details.minSponsoredAssetFee === 0).toBe(true);
  });

  it('sponsored transfer: user pays fee in sponsored token', async () => {
    // Issue a fresh asset for this test
    const issueTx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 2,
        description: 'Sponsored transfer E2E test asset',
        name: `SPNT${Date.now().toString(36).slice(-4).toUpperCase()}`,
        quantity: 100_000,
        reissuable: false,
      },
      MASTER_SEED,
    );
    await broadcast(issueTx, API_BASE);
    await waitForTx(issueTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    const localAssetId = issueTx.id;

    // Enable sponsorship at min_fee = 1000
    const sponsorTx = setSponsor(
      {
        assetId: localAssetId,
        chainId: CHAIN_ID,
        minSponsoredAssetFee: 1000,
      },
      MASTER_SEED,
    );
    await broadcast(sponsorTx, API_BASE);
    await waitForTx(sponsorTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    // Create a user wallet
    const user = randomTestAccount(CHAIN_ID);

    // Fund the user with DCC (enough for account activation) and asset tokens
    await fundAccount(user.address, 1_000_000, MASTER_SEED, API_BASE, CHAIN_ID);

    // Transfer asset tokens to the user (enough to pay fee + send amount)
    const assetTransferTx = transfer(
      {
        amount: 10_000,
        assetId: localAssetId,
        chainId: CHAIN_ID,
        recipient: user.address,
      },
      MASTER_SEED,
    );
    await broadcast(assetTransferTx, API_BASE);
    await waitForTx(assetTransferTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    // User sends some asset to a destination, paying the fee in the sponsored asset
    const dest = randomTestAccount(CHAIN_ID);
    const userTransferTx = transfer(
      {
        amount: 100,
        assetId: localAssetId,
        chainId: CHAIN_ID,
        fee: 1000,
        feeAssetId: localAssetId,
        recipient: dest.address,
      },
      user.seed,
    );

    // Broadcast using raw fetch to /transactions/broadcast
    const broadcastRes = await fetch(`${API_BASE}transactions/broadcast`, {
      body: JSON.stringify(userTransferTx),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(broadcastRes.ok).toBe(true);

    const confirmed = await waitForTx(userTransferTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);
  });

  it('re-enables sponsorship with different amount', async () => {
    // Issue a fresh asset for this test
    const issueTx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 2,
        description: 'Sponsorship re-enable E2E test asset',
        name: `SPNR${Date.now().toString(36).slice(-4).toUpperCase()}`,
        quantity: 5_000,
        reissuable: false,
      },
      MASTER_SEED,
    );
    await broadcast(issueTx, API_BASE);
    await waitForTx(issueTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    const localAssetId = issueTx.id;

    // Enable sponsorship at 100
    const enableAt100 = setSponsor(
      {
        assetId: localAssetId,
        chainId: CHAIN_ID,
        minSponsoredAssetFee: 100,
      },
      MASTER_SEED,
    );
    await broadcast(enableAt100, API_BASE);
    await waitForTx(enableAt100.id, { apiBase: API_BASE, timeout: TIMEOUT });

    // Re-enable at 250
    const enableAt250 = setSponsor(
      {
        assetId: localAssetId,
        chainId: CHAIN_ID,
        minSponsoredAssetFee: 250,
      },
      MASTER_SEED,
    );
    await broadcast(enableAt250, API_BASE);
    await waitForTx(enableAt250.id, { apiBase: API_BASE, timeout: TIMEOUT });

    // Verify the updated fee
    const res = await fetch(`${API_BASE}assets/details/${localAssetId}`);
    expect(res.ok).toBe(true);
    const details = (await res.json()) as { minSponsoredAssetFee: number };
    expect(details.minSponsoredAssetFee).toBe(250);
  });
});
