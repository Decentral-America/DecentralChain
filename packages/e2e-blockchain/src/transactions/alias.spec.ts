import { alias, broadcast, waitForTx } from '@decentralchain/transactions';
import { API_BASE, CHAIN_ID, DS_URL, MASTER_SEED } from '../setup/env';

const TIMEOUT = 120_000;

describe('Alias (type 10)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  // Alias names must be 4–30 chars, lowercase, digits, dash, underscore, dot
  // Use a short random suffix derived from timestamp to avoid collisions
  const aliasName = `e2e-${Date.now().toString(36).slice(-8)}`;
  let txId: string;

  it('creates alias', async () => {
    const tx = alias(
      {
        alias: aliasName,
        chainId: CHAIN_ID,
      },
      MASTER_SEED,
    );

    txId = tx.id;
    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(txId, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);
  });

  it('resolves via data-service /v0/aliases/:alias', async () => {
    const url = `${DS_URL}/v0/aliases/${aliasName}`;
    const res = await fetch(url);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { data: { alias: string } } | { alias: string };
    const resolved = 'data' in body ? body.data.alias : (body as { alias: string }).alias;
    expect(resolved).toBe(aliasName);
  });
});
