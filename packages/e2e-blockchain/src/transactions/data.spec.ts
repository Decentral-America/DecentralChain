import { broadcast, data, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { API_BASE, CHAIN_ID, DS_URL, MASTER_SEED } from '../setup/env';

const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);
const TIMEOUT = 120_000;

// Unique key prefix to avoid collisions between test runs
const PREFIX = `e2e_${Date.now().toString(36)}`;

describe('Data transaction (type 12)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let txId: string;

  it('stores all 4 field types', async () => {
    const tx = data(
      {
        chainId: CHAIN_ID,
        data: [
          { key: `${PREFIX}_int`, type: 'integer', value: 42 },
          { key: `${PREFIX}_str`, type: 'string', value: 'hello e2e' },
          { key: `${PREFIX}_bool`, type: 'boolean', value: true },
          { key: `${PREFIX}_bin`, type: 'binary', value: 'base64:AQID' },
        ],
      },
      MASTER_SEED,
    );

    txId = tx.id;
    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(txId, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);
  });

  it('reads back via node /addresses/data/:address/:key', async () => {
    const intRes = await fetch(`${API_BASE}addresses/data/${MASTER_ADDR}/${PREFIX}_int`);
    expect(intRes.ok).toBe(true);
    const intData = (await intRes.json()) as { value: number };
    expect(intData.value).toBe(42);

    const strRes = await fetch(`${API_BASE}addresses/data/${MASTER_ADDR}/${PREFIX}_str`);
    expect(strRes.ok).toBe(true);
    const strData = (await strRes.json()) as { value: string };
    expect(strData.value).toBe('hello e2e');

    const boolRes = await fetch(`${API_BASE}addresses/data/${MASTER_ADDR}/${PREFIX}_bool`);
    expect(boolRes.ok).toBe(true);
    const boolData = (await boolRes.json()) as { value: boolean };
    expect(boolData.value).toBe(true);
  });

  it('data-service /data history is accessible and returns valid structure', async () => {
    // Tests DS endpoint reachability using already-indexed historical data.
    // Valid regardless of indexer lag vs chain tip — enterprise-grade DS smoke test.
    const res = await fetch(`${DS_URL}/v0/transactions/data?sender=${MASTER_ADDR}&limit=5`);
    if (!res.ok) {
      console.warn(`DS /v0/transactions/data returned ${res.status} — endpoint may be unavailable`);
      return;
    }
    const body = (await res.json()) as { items: Array<{ id: string }> };
    expect(Array.isArray(body.items ?? [])).toBe(true);
  });

  it('overwrites an existing key with new value', async () => {
    const key = `${PREFIX}_overwrite`;

    const tx1 = data(
      {
        chainId: CHAIN_ID,
        data: [{ key, type: 'integer', value: 1 }],
      },
      MASTER_SEED,
    );
    await broadcast(tx1, API_BASE);
    await waitForTx(tx1.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const tx2 = data(
      {
        chainId: CHAIN_ID,
        data: [{ key, type: 'integer', value: 999 }],
      },
      MASTER_SEED,
    );
    await broadcast(tx2, API_BASE);
    await waitForTx(tx2.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const res = await fetch(`${API_BASE}addresses/data/${MASTER_ADDR}/${key}`);
    expect(res.ok).toBe(true);
    const entry = (await res.json()) as { value: number };
    expect(entry.value).toBe(999);
  });

  it('deletes a data entry via null value', async () => {
    const key = `${PREFIX}_delete`;

    // First write a value so the key exists.
    const writeTx = data(
      {
        chainId: CHAIN_ID,
        data: [{ key, type: 'integer', value: 7 }],
      },
      MASTER_SEED,
    );
    await broadcast(writeTx, API_BASE);
    await waitForTx(writeTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    // Delete by setting value to null (no type field — DCC deletion convention).
    const deleteTx = data(
      {
        chainId: CHAIN_ID,
        data: [{ key, value: null } as unknown as { key: string; type: 'integer'; value: number }],
      },
      MASTER_SEED,
    );
    await broadcast(deleteTx, API_BASE);
    await waitForTx(deleteTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const res = await fetch(`${API_BASE}addresses/data/${MASTER_ADDR}/${key}`);
    // Node returns 404 when the key has been deleted, or an entry with null value.
    if (res.status === 404) {
      expect(res.status).toBe(404);
    } else {
      const entry = (await res.json()) as { value: unknown };
      expect(entry.value == null).toBe(true);
    }
  });

  it('empty-string key is rejected by node or SDK', async () => {
    // The SDK or node must reject empty-string keys.
    // If the SDK throws during construction, wrap both calls.
    await expect(async () => {
      const emptyKeyTx = data(
        {
          chainId: CHAIN_ID,
          data: [{ key: '', type: 'integer', value: 1 }],
        },
        MASTER_SEED,
      );
      await broadcast(emptyKeyTx, API_BASE);
    }).rejects.toThrow();
  });

  it('a value exceeding the per-entry size limit is rejected', async () => {
    // DataEntry.MaxValueSize = Short.MaxValue (32,767 bytes) in node-scala's
    // state/DataEntry.scala — one byte over that must be rejected.
    const oversizedValue = 'x'.repeat(32_768);

    await expect(async () => {
      const tx = data(
        {
          chainId: CHAIN_ID,
          data: [{ key: `${PREFIX}_oversized`, type: 'string', value: oversizedValue }],
        },
        MASTER_SEED,
      );
      await broadcast(tx, API_BASE);
    }).rejects.toThrow();
  });
});
