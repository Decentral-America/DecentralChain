import { broadcast, massTransfer, transfer, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { randomTestAccount } from '../helpers/accounts';
import { API_BASE, CHAIN_ID, DS_URL, MASTER_SEED } from '../setup/env';

const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);
const TIMEOUT = 120_000;
const DS_POLL_INTERVAL_MS = 3_000;
const DS_MAX_WAIT_MS = 30_000;

/**
 * Polls the data-service endpoint until `txId` appears in `items`, or
 * DS_MAX_WAIT_MS is exceeded.  Returns the elapsed time in milliseconds.
 */
async function pollDataService(url: string, txId: string): Promise<number> {
  const start = Date.now();
  const deadline = start + DS_MAX_WAIT_MS;

  while (Date.now() < deadline) {
    const res = await fetch(url);
    if (res.ok) {
      const body = (await res.json()) as { items: Array<{ id: string }> };
      if (body.items.some((item) => item.id === txId)) {
        const elapsed = Date.now() - start;
        console.log(`[pipeline] tx ${txId} appeared in data-service after ${elapsed} ms`);
        return elapsed;
      }
    }
    await new Promise((r) => setTimeout(r, DS_POLL_INTERVAL_MS));
  }

  throw new Error(
    `[pipeline] tx ${txId} did not appear in data-service within ${DS_MAX_WAIT_MS} ms`,
  );
}

describe('Full data pipeline', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  it('transfer confirms and flows to data-service within 30 s', async () => {
    const recipient = randomTestAccount(CHAIN_ID);
    const tx = transfer(
      {
        amount: 100_000,
        chainId: CHAIN_ID,
        recipient: recipient.address,
      },
      MASTER_SEED,
    );

    const broadcastStart = Date.now();
    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    const confirmMs = Date.now() - broadcastStart;
    console.log(
      `[pipeline] transfer ${tx.id} confirmed at height ${confirmed.height} in ${confirmMs} ms`,
    );

    const dsUrl = `${DS_URL}/v0/transactions/transfer?sender=${MASTER_ADDR}&limit=50`;
    const dsLatencyMs = await pollDataService(dsUrl, tx.id);

    expect(confirmed.height).toBeGreaterThan(0);
    expect(dsLatencyMs).toBeLessThanOrEqual(DS_MAX_WAIT_MS);
  });

  it('mass transfer flows to data-service', async () => {
    const recipients = Array.from({ length: 3 }, () => randomTestAccount(CHAIN_ID));
    const tx = massTransfer(
      {
        chainId: CHAIN_ID,
        transfers: recipients.map((r) => ({ amount: 100_000, recipient: r.address })),
      },
      MASTER_SEED,
    );

    const broadcastStart = Date.now();
    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    const confirmMs = Date.now() - broadcastStart;
    console.log(
      `[pipeline] mass-transfer ${tx.id} confirmed at height ${confirmed.height} in ${confirmMs} ms`,
    );

    const dsUrl = `${DS_URL}/v0/transactions/mass-transfer?sender=${MASTER_ADDR}&limit=50`;
    const dsLatencyMs = await pollDataService(dsUrl, tx.id);

    expect(confirmed.height).toBeGreaterThan(0);
    expect(dsLatencyMs).toBeLessThanOrEqual(DS_MAX_WAIT_MS);
  });
});
