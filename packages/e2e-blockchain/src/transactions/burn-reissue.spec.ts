/**
 * Burn (Type 6) & Reissue (Type 5) — edge cases and rejection paths.
 *
 * The happy paths (burn partial, reissue increases supply) are already covered
 * in asset-lifecycle.spec.ts. This file adds the rejection and edge-case tests
 * that are required for mainnet-equivalent coverage.
 *
 * Covers:
 *   Burn:
 *   - Non-issuer holder can burn their own balance
 *   - Burning more than held is rejected
 *
 *   Reissue:
 *   - Reissue on non-reissuable asset is rejected
 *   - Reissuing with reissuable=false locks the asset permanently
 *   - Large-quantity reissue (BigInt range) confirms correctly
 */

import { broadcast, burn, issue, reissue, transfer, waitForTx } from '@decentralchain/transactions';
import { fundAccount, randomTestAccount } from '../helpers/accounts';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const TIMEOUT = 300_000;
const FUND = 110_000_000; // 1.1 DCC — covers issue fee (1 DCC) + extras

// ── Helpers ───────────────────────────────────────────────────────────────────

async function assetBalance(addr: string, assetId: string): Promise<number> {
  const res = await fetch(`${API_BASE}assets/balance/${addr}/${assetId}`);
  if (!res.ok) throw new Error(`assets/balance: HTTP ${res.status}`);
  const { balance } = (await res.json()) as { balance: number };
  return balance;
}

async function assetDetails(assetId: string) {
  const res = await fetch(`${API_BASE}assets/details/${assetId}`);
  if (!res.ok) throw new Error(`assets/details: HTTP ${res.status}`);
  return (await res.json()) as { reissuable: boolean; quantity: number };
}

// ── Burn edge cases ───────────────────────────────────────────────────────────

describe('Burn edge cases (type 6)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let issuer: ReturnType<typeof randomTestAccount>;
  let assetId: string;

  beforeAll(async () => {
    issuer = randomTestAccount(CHAIN_ID);
    await fundAccount(issuer.address, FUND, MASTER_SEED, API_BASE, CHAIN_ID);

    const tx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 0,
        description: '',
        name: 'BurnEdge',
        quantity: 10_000,
        reissuable: true,
      },
      issuer.seed,
    );
    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    assetId = tx.id;
  }, TIMEOUT);

  it('non-issuer holder burns their own balance', async () => {
    const holder = randomTestAccount(CHAIN_ID);
    await fundAccount(holder.address, 10_000_000, MASTER_SEED, API_BASE, CHAIN_ID);

    // Give 500 tokens to holder
    const xfer = transfer(
      { amount: 500, assetId, chainId: CHAIN_ID, recipient: holder.address },
      issuer.seed,
    );
    await broadcast(xfer, API_BASE);
    await waitForTx(xfer.id, { apiBase: API_BASE, timeout: TIMEOUT });

    // Holder burns 200 of their 500
    const burnTx = burn({ amount: 200, assetId, chainId: CHAIN_ID }, holder.seed);
    await broadcast(burnTx, API_BASE);
    const confirmed = await waitForTx(burnTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);

    const bal = await assetBalance(holder.address, assetId);
    expect(bal).toBe(300);
  });

  it('burning more than balance is rejected', async () => {
    const holder = randomTestAccount(CHAIN_ID);
    await fundAccount(holder.address, 10_000_000, MASTER_SEED, API_BASE, CHAIN_ID);

    // Give 50 tokens
    const xfer = transfer(
      { amount: 50, assetId, chainId: CHAIN_ID, recipient: holder.address },
      issuer.seed,
    );
    await broadcast(xfer, API_BASE);
    await waitForTx(xfer.id, { apiBase: API_BASE, timeout: TIMEOUT });

    // Try to burn 1,000 — more than they have
    const burnTx = burn({ amount: 1_000, assetId, chainId: CHAIN_ID }, holder.seed);
    await expect(broadcast(burnTx, API_BASE)).rejects.toThrow();
  });
});

// ── Reissue edge cases ────────────────────────────────────────────────────────

describe('Reissue edge cases (type 5)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let issuer: ReturnType<typeof randomTestAccount>;

  beforeAll(async () => {
    issuer = randomTestAccount(CHAIN_ID);
    await fundAccount(issuer.address, FUND * 4, MASTER_SEED, API_BASE, CHAIN_ID);
  }, TIMEOUT);

  it('reissue sets reissuable=false — further reissue rejected', async () => {
    const issueTx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 0,
        description: '',
        name: 'LockTest',
        quantity: 1_000,
        reissuable: true,
      },
      issuer.seed,
    );
    await broadcast(issueTx, API_BASE);
    await waitForTx(issueTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    const assetId = issueTx.id;

    // Reissue with reissuable=false — locks supply permanently
    const reissueTx = reissue(
      { assetId, chainId: CHAIN_ID, quantity: 500, reissuable: false },
      issuer.seed,
    );
    await broadcast(reissueTx, API_BASE);
    await waitForTx(reissueTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const details = await assetDetails(assetId);
    expect(details.reissuable).toBe(false);
    expect(details.quantity).toBe(1_500);

    // Any further reissue must fail
    const again = reissue(
      { assetId, chainId: CHAIN_ID, quantity: 100, reissuable: false },
      issuer.seed,
    );
    await expect(broadcast(again, API_BASE)).rejects.toThrow();
  });

  it('reissuing non-reissuable asset is rejected from the start', async () => {
    const issueTx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 0,
        description: '',
        name: 'NRTest',
        quantity: 1_000,
        reissuable: false,
      },
      issuer.seed,
    );
    await broadcast(issueTx, API_BASE);
    await waitForTx(issueTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    const assetId = issueTx.id;

    const reissueTx = reissue(
      { assetId, chainId: CHAIN_ID, quantity: 100, reissuable: false },
      issuer.seed,
    );
    await expect(broadcast(reissueTx, API_BASE)).rejects.toThrow();
  });

  it('large-quantity reissue confirms and reflects in asset details', async () => {
    const initialQty = 1_000_000;
    const reissueQty = 999_000_000; // large but within Number.MAX_SAFE_INTEGER

    const issueTx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 0,
        description: '',
        name: 'BigReissue',
        quantity: initialQty,
        reissuable: true,
      },
      issuer.seed,
    );
    await broadcast(issueTx, API_BASE);
    await waitForTx(issueTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    const assetId = issueTx.id;

    const reissueTx = reissue(
      { assetId, chainId: CHAIN_ID, quantity: reissueQty, reissuable: true },
      issuer.seed,
    );
    await broadcast(reissueTx, API_BASE);
    const confirmed = await waitForTx(reissueTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);

    const details = await assetDetails(assetId);
    expect(details.quantity).toBe(initialQty + reissueQty);
    expect(details.reissuable).toBe(true);
  });
});
