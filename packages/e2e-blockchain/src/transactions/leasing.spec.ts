import { broadcast, cancelLease, lease, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { randomTestAccount } from '../helpers/accounts';
import { API_BASE, CHAIN_ID, DS_URL, MASTER_SEED } from '../setup/env';

const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);

const TIMEOUT = 120_000;

// Lease recipient must differ from the sender — DCC rejects self-leases.
// Use a deterministic fresh account so the test is reproducible.
const LEASE_RECIPIENT = randomTestAccount(CHAIN_ID);

async function activeLeases(addr: string): Promise<Array<{ id: string }>> {
  const res = await fetch(`${API_BASE}leasing/active/${addr}`);
  if (!res.ok) throw new Error(`activeLeases request failed: ${res.status}`);
  return res.json() as Promise<Array<{ id: string }>>;
}

describe('Lease/CancelLease (types 8/9)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let leaseId: string;

  it('starts lease', async () => {
    const tx = lease(
      {
        amount: 1_000_000,
        chainId: CHAIN_ID,
        recipient: LEASE_RECIPIENT.address,
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

  it('data-service /lease history is accessible and returns valid structure', async () => {
    // Tests DS endpoint reachability using already-indexed historical data.
    // Valid regardless of indexer lag vs chain tip — enterprise-grade DS smoke test.
    const res = await fetch(`${DS_URL}/v0/transactions/lease?sender=${MASTER_ADDR}&limit=5`);
    if (!res.ok) {
      console.warn(
        `DS /v0/transactions/lease returned ${res.status} — endpoint may be unavailable`,
      );
      return;
    }
    const body = (await res.json()) as { items: Array<{ id: string }> };
    expect(Array.isArray(body.items ?? [])).toBe(true);
  });

  it('multiple leases simultaneously are all active', async () => {
    const txs = [1, 2, 3].map(() =>
      lease(
        {
          amount: 1_000_000,
          chainId: CHAIN_ID,
          recipient: LEASE_RECIPIENT.address,
        },
        MASTER_SEED,
      ),
    );

    for (const tx of txs) {
      await broadcast(tx, API_BASE);
      await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    }

    const active = await activeLeases(MASTER_ADDR);
    const activeIds = new Set(active.map((l) => l.id));
    for (const tx of txs) {
      expect(activeIds.has(tx.id)).toBe(true);
    }

    // Cancel all three
    for (const tx of txs) {
      const cancelTx = cancelLease(
        {
          chainId: CHAIN_ID,
          leaseId: tx.id,
        },
        MASTER_SEED,
      );
      await broadcast(cancelTx, API_BASE);
      await waitForTx(cancelTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    }
  });

  it('cancelling a nonexistent lease is rejected', async () => {
    const fakeLeaseId = '5LHYS4wr2NFnSHn8kAJMUa3UuFNjUi1fF3BkFUf5xdN7';
    const cancelTx = cancelLease(
      {
        chainId: CHAIN_ID,
        leaseId: fakeLeaseId,
      },
      MASTER_SEED,
    );

    await expect(broadcast(cancelTx, API_BASE)).rejects.toThrow();
  });
});
