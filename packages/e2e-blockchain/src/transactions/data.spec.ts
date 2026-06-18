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

  it('appears in data-service /v0/transactions/data', async () => {
    const url = `${DS_URL}/v0/transactions/data?sender=${MASTER_ADDR}&limit=10`;
    const res = await fetch(url);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { items: Array<{ id: string }> };
    const found = body.items.some((item) => item.id === txId);
    expect(found).toBe(true);
  });
});
