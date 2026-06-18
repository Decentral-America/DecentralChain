import { broadcast, setScript, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { API_BASE, CHAIN_ID, DS_URL, MASTER_SEED } from '../setup/env';

const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);
const TIMEOUT = 120_000;

describe('SetScript (type 13)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let txId: string;

  it('removes script (script: null) from account', async () => {
    // Setting script to null is always valid and removes any existing script.
    // This avoids needing a RIDE compiler in the test environment.
    const tx = setScript(
      {
        chainId: CHAIN_ID,
        script: null,
      },
      MASTER_SEED,
    );

    txId = tx.id;
    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(txId, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);
  });

  it('confirms and appears in /v0/transactions/set-script', async () => {
    const url = `${DS_URL}/v0/transactions/set-script?sender=${MASTER_ADDR}&limit=10`;
    const res = await fetch(url);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { items: Array<{ id: string }> };
    const found = body.items.some((item) => item.id === txId);
    expect(found).toBe(true);
  });
});
