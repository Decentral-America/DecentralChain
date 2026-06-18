import { broadcast, cancelLease, lease, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { API_BASE, CHAIN_ID, DS_URL, MASTER_SEED } from '../setup/env';

const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);
const TIMEOUT = 120_000;

describe('Lease/CancelLease (types 8/9)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let leaseId: string;

  it('starts lease', async () => {
    const tx = lease(
      {
        amount: 1_000_000,
        chainId: CHAIN_ID,
        recipient: MASTER_ADDR,
      },
      MASTER_SEED,
    );

    leaseId = tx.id;
    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(leaseId, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);
  });

  it('cancels lease', async () => {
    const tx = cancelLease(
      {
        chainId: CHAIN_ID,
        leaseId,
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);
  });

  it('appears in data-service /v0/transactions/lease', async () => {
    const url = `${DS_URL}/v0/transactions/lease?sender=${MASTER_ADDR}&limit=10`;
    const res = await fetch(url);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { items: Array<{ id: string }> };
    const found = body.items.some((item) => item.id === leaseId);
    expect(found).toBe(true);
  });
});
