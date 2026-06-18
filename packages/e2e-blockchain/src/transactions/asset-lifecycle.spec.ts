import { broadcast, burn, issue, reissue, waitForTx } from '@decentralchain/transactions';
import { API_BASE, CHAIN_ID, DS_URL, MASTER_SEED } from '../setup/env';

const TIMEOUT = 120_000;

describe('Asset lifecycle: Issue → Reissue → Burn', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let assetId: string;

  it('issues asset', async () => {
    const tx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 0,
        description: 'E2E lifecycle test asset',
        name: `E2E${Date.now().toString(36).slice(-6).toUpperCase()}`,
        quantity: 1_000,
        reissuable: true,
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    assetId = tx.id;
    expect(confirmed.height).toBeGreaterThan(0);
    expect(assetId).toBeTruthy();
  });

  it('reissues asset', async () => {
    const tx = reissue(
      {
        assetId,
        chainId: CHAIN_ID,
        quantity: 500,
        reissuable: true,
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    // Check via address-specific endpoint
    const addrRes = await fetch(
      `${API_BASE}assets/balance/${(await import('@decentralchain/ts-lib-crypto')).address(
        MASTER_SEED,
        CHAIN_ID,
      )}/${assetId}`,
    );
    expect(addrRes.ok).toBe(true);
    const data = (await addrRes.json()) as { balance: number };
    expect(data.balance).toBe(1_500);
  });

  it('burns asset', async () => {
    const tx = burn(
      {
        amount: 200,
        assetId,
        chainId: CHAIN_ID,
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const { address } = await import('@decentralchain/ts-lib-crypto');
    const addrRes = await fetch(
      `${API_BASE}assets/balance/${address(MASTER_SEED, CHAIN_ID)}/${assetId}`,
    );
    expect(addrRes.ok).toBe(true);
    const data = (await addrRes.json()) as { balance: number };
    expect(data.balance).toBe(1_300);
  });

  it('asset appears in data-service /v0/assets/:id', async () => {
    const res = await fetch(`${DS_URL}/v0/assets/${assetId}`);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { data: { id: string } };
    expect(body.data.id ?? (body as unknown as { id: string }).id).toBe(assetId);
  });
});
