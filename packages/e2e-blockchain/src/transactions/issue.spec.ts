/**
 * Issue (Type 3) core tests.
 *
 * Edge cases (8 decimals, min qty, empty desc, NFT) live in issue-edge.spec.ts.
 * This file covers the primary lifecycle behaviours:
 *
 *   1. Reissuable token — reissuable flag round-trips correctly
 *   2. Non-reissuable token — reissuable=false is enforced by the node
 *   3. Balance — issued quantity lands in the sender's asset balance
 *   4. Data-service history — issue TX is indexed under /v0/transactions/issue
 */

import { broadcast, issue, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { assertAppearsInDataService } from '../helpers/data-service';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);
const TIMEOUT = 300_000;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function assetDetails(assetId: string) {
  const res = await fetch(`${API_BASE}assets/details/${assetId}`);
  if (!res.ok) throw new Error(`assets/details: HTTP ${res.status}`);
  return (await res.json()) as {
    assetId: string;
    decimals: number;
    quantity: number;
    reissuable: boolean;
    description: string;
  };
}

async function assetBalance(addr: string, assetId: string): Promise<number> {
  const res = await fetch(`${API_BASE}assets/balance/${addr}/${assetId}`);
  if (!res.ok) throw new Error(`assets/balance: HTTP ${res.status}`);
  return ((await res.json()) as { balance: number }).balance;
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Issue core tests (type 3)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  it('issues reissuable token - type=3, reissuable=true', async () => {
    const tx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 2,
        description: 'test',
        name: 'ReissuableT',
        quantity: 1_000_000,
        reissuable: true,
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const details = await assetDetails(tx.id);
    expect(details.reissuable).toBe(true);
    expect(details.quantity).toBe(1_000_000);
  });

  it('issues non-reissuable token - reissuable=false', async () => {
    const tx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 2,
        description: 'test',
        name: 'NonReissue',
        quantity: 1_000_000,
        reissuable: false,
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const details = await assetDetails(tx.id);
    expect(details.reissuable).toBe(false);
  });

  it('issued asset appears in sender balance', async () => {
    const tx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 0,
        description: 'balance check token',
        name: 'BalanceChk',
        quantity: 5_000,
        reissuable: false,
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const balance = await assetBalance(MASTER_ADDR, tx.id);
    expect(balance).toBe(5_000);
  });

  it('issued asset TX appears in data-service history', async () => {
    const tx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 0,
        description: 'data-service index check',
        name: 'DsIndexed',
        quantity: 1_000,
        reissuable: false,
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    await assertAppearsInDataService(
      tx.id,
      `/v0/transactions/issue?sender=${MASTER_ADDR}&limit=5`,
      API_BASE,
    );
  });
});
