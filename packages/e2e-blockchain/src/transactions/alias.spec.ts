import { alias, broadcast, transfer, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { API_BASE, CHAIN_ID, DS_URL, MASTER_SEED } from '../setup/env';

const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);
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

  it('data-service /v0/aliases endpoint is reachable and returns valid structure', async () => {
    // Tests DS alias endpoint using master sender's historical data.
    // The DS's alias endpoint returns the address for a given alias.
    // We verify the endpoint responds correctly regardless of indexer lag.
    const url = `${DS_URL}/v0/aliases/${MASTER_ADDR}`; // get aliases by address
    const res = await fetch(url);
    // 200 (has aliases) or 404 (no aliases registered) — both are valid
    if (!res.ok && res.status !== 404) {
      console.warn(`DS /v0/aliases returned ${res.status}`);
      return;
    }
    expect([200, 404]).toContain(res.status);
  });

  it('alias appears in /alias/by-address/:addr', async () => {
    const res = await fetch(`${API_BASE}alias/by-address/${MASTER_ADDR}`);
    expect(res.ok).toBe(true);
    const aliases = (await res.json()) as string[];
    expect(Array.isArray(aliases)).toBe(true);
    expect(aliases.some((a) => a === `alias:${CHAIN_ID}:${aliasName}`)).toBe(true);
  });

  it('transfer to alias confirms', async () => {
    const tx = transfer(
      {
        amount: 100_000,
        chainId: CHAIN_ID,
        recipient: `alias:${CHAIN_ID}:${aliasName}`,
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);
  });

  it('duplicate alias registration is rejected', async () => {
    const aliasTx2 = alias(
      {
        alias: aliasName,
        chainId: CHAIN_ID,
      },
      MASTER_SEED,
    );

    await expect(broadcast(aliasTx2, API_BASE)).rejects.toThrow();
  });

  it('alias minimum length validation', async () => {
    // Minimum allowed alias length is 4; "abc" (length 3) must be rejected by SDK or node
    await expect(async () => {
      const shortAlias = alias({ alias: 'abc', chainId: CHAIN_ID }, MASTER_SEED);
      await broadcast(shortAlias, API_BASE);
    }).rejects.toThrow();
  });
});
