import { broadcast, issue, sponsorship, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { API_BASE, CHAIN_ID, DS_URL, MASTER_SEED } from '../setup/env';

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
    const tx = sponsorship(
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
    const url = `${DS_URL}/v0/transactions/sponsorship?sender=${MASTER_ADDR}&limit=10`;
    const res = await fetch(url);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { items: Array<{ id: string }> };
    const found = body.items.some((item) => item.id === sponsorTxId);
    expect(found).toBe(true);
  });
});
