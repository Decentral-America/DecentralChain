/**
 * Issue (Type 3) edge cases.
 *
 * The core issue lifecycle (issue → reissue → burn) is in asset-lifecycle.spec.ts.
 * This file covers the parameter boundary tests required for mainnet coverage:
 *
 *   - 8 decimal token (maximum precision)
 *   - Minimum quantity = 1
 *   - Description is optional (empty string)
 *   - NFT: quantity=1, decimals=0, reissuable=false
 */

import { broadcast, issue, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const TIMEOUT = 300_000;
const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);

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

async function assetBalance(assetId: string): Promise<number> {
  const res = await fetch(`${API_BASE}assets/balance/${MASTER_ADDR}/${assetId}`);
  if (!res.ok) throw new Error(`assets/balance: HTTP ${res.status}`);
  return ((await res.json()) as { balance: number }).balance;
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Issue edge cases (type 3)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  it('8 decimal token — maximum precision', async () => {
    const tx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 8,
        description: '8-decimal precision token',
        name: 'EightDec',
        quantity: 100_000_000_00, // 1000.00000000 with 8 decimals
        reissuable: true,
      },
      MASTER_SEED,
    );
    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const details = await assetDetails(tx.id);
    expect(details.decimals).toBe(8);
    expect(details.quantity).toBe(100_000_000_00);
  });

  it('minimum quantity = 1 — boundary value', async () => {
    const tx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 0,
        description: 'Minimum quantity token',
        name: 'MinQty',
        quantity: 1,
        reissuable: false,
      },
      MASTER_SEED,
    );
    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const details = await assetDetails(tx.id);
    expect(details.quantity).toBe(1);

    const bal = await assetBalance(tx.id);
    expect(bal).toBe(1);
  });

  it('empty description is accepted', async () => {
    const tx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 0,
        description: '', // empty — must be valid
        name: 'NoDesc',
        quantity: 1_000,
        reissuable: true,
      },
      MASTER_SEED,
    );
    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const details = await assetDetails(tx.id);
    expect(details.description).toBe('');
    expect(details.quantity).toBe(1_000);
  });

  it('NFT: quantity=1, decimals=0, reissuable=false', async () => {
    const tx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 0,
        description: 'Non-fungible token test',
        name: 'TestNFT',
        quantity: 1,
        reissuable: false,
      },
      MASTER_SEED,
    );
    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const details = await assetDetails(tx.id);
    expect(details.quantity).toBe(1);
    expect(details.decimals).toBe(0);
    expect(details.reissuable).toBe(false);

    const bal = await assetBalance(tx.id);
    expect(bal).toBe(1);
  });

  it('decimals exceeding the 8-decimal maximum is rejected', async () => {
    // IssueTransaction.MaxAssetDecimals = 8 (node-scala's IssueTransaction.scala) —
    // 9 must be rejected.
    await expect(async () => {
      const tx = issue(
        {
          chainId: CHAIN_ID,
          decimals: 9,
          description: 'Invalid decimals token',
          name: 'BadDecimals',
          quantity: 1_000,
          reissuable: false,
        },
        MASTER_SEED,
      );
      await broadcast(tx, API_BASE);
    }).rejects.toThrow();
  });

  it('zero quantity is rejected', async () => {
    await expect(async () => {
      const tx = issue(
        {
          chainId: CHAIN_ID,
          decimals: 0,
          description: 'Zero quantity token',
          name: 'ZeroQty',
          quantity: 0,
          reissuable: false,
        },
        MASTER_SEED,
      );
      await broadcast(tx, API_BASE);
    }).rejects.toThrow();
  });
});
