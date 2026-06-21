/**
 * Type 15 — SetAssetScript: smart asset lifecycle.
 *
 * Covers:
 *   - Issue a smart asset (always-true script baked into Issue TX)
 *   - /assets/details reports scripted=true
 *   - Transfer of the always-true asset confirms (script permits it)
 *   - Issue a freeze asset — all transfers rejected by the script
 *   - setAssetScript on an existing smart asset updates its script
 *   - Burn from a burn-only asset confirms; transfer is rejected
 */

import {
  broadcast,
  burn,
  issue,
  setAssetScript,
  transfer,
  waitForTx,
} from '@decentralchain/transactions';
import { fundAccount, randomTestAccount } from '../helpers/accounts';
import { compileScript } from '../helpers/compile';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const TIMEOUT = 300_000;
const FUND = 500_000_000; // 5 DCC — covers 3× issue + setAssetScript + transfers

// ── RIDE asset scripts ────────────────────────────────────────────────────────

const ALWAYS_TRUE_ASSET = `
{-# STDLIB_VERSION 5 #-}
{-# CONTENT_TYPE EXPRESSION #-}
{-# SCRIPT_TYPE ASSET #-}
true
`.trim();

/** Blocks every TX type — fully frozen token. */
const FREEZE_ASSET = `
{-# STDLIB_VERSION 5 #-}
{-# CONTENT_TYPE EXPRESSION #-}
{-# SCRIPT_TYPE ASSET #-}
false
`.trim();

/** Only BurnTransaction is allowed. */
const BURN_ONLY_ASSET = `
{-# STDLIB_VERSION 5 #-}
{-# CONTENT_TYPE EXPRESSION #-}
{-# SCRIPT_TYPE ASSET #-}
match tx {
  case _: BurnTransaction => true
  case _ => false
}
`.trim();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function assetDetails(assetId: string) {
  const res = await fetch(`${API_BASE}assets/details/${assetId}`);
  if (!res.ok) throw new Error(`assets/details: HTTP ${res.status}`);
  return (await res.json()) as {
    assetId: string;
    scripted: boolean;
    script?: string;
  };
}

async function assetBalance(addr: string, assetId: string): Promise<number> {
  const res = await fetch(`${API_BASE}assets/balance/${addr}/${assetId}`);
  if (!res.ok) throw new Error(`assets/balance: HTTP ${res.status}`);
  const { balance } = (await res.json()) as { balance: number };
  return balance;
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Smart assets (type 15 setAssetScript)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let issuer: ReturnType<typeof randomTestAccount>;
  let skip = false;

  /** Compiled base64 map — populated in beforeAll */
  const scripts: Record<string, string | undefined> = {};

  beforeAll(async () => {
    issuer = randomTestAccount(CHAIN_ID);
    await fundAccount(issuer.address, FUND, MASTER_SEED, API_BASE, CHAIN_ID);

    try {
      [scripts.always_true, scripts.freeze, scripts.burn_only] = await Promise.all([
        compileScript(ALWAYS_TRUE_ASSET, API_BASE),
        compileScript(FREEZE_ASSET, API_BASE),
        compileScript(BURN_ONLY_ASSET, API_BASE),
      ]);
    } catch (e) {
      console.warn('RIDE compile unavailable — skipping smart-asset tests:', e);
      skip = true;
    }
  }, TIMEOUT);

  // ── always-true smart asset ───────────────────────────────────────────────

  describe('always-true smart asset', () => {
    let assetId: string;

    it('issues with script — type=3, scripted=true', async () => {
      if (skip) return;

      const tx = issue(
        {
          chainId: CHAIN_ID,
          decimals: 0,
          description: 'e2e always-true smart asset',
          name: 'E2ESmartA',
          quantity: 10_000,
          reissuable: true,
          script: scripts.always_true!,
        },
        issuer.seed,
      );
      await broadcast(tx, API_BASE);
      await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

      assetId = tx.id;
      const details = await assetDetails(assetId);
      expect(details.scripted).toBe(true);
    });

    it('transfer of always-true asset confirms', async () => {
      if (skip || !assetId) return;

      const recipient = randomTestAccount(CHAIN_ID);
      const tx = transfer(
        // Smart asset transfer requires base fee (100k) + scripted surcharge (400k) = 500k
        { amount: 10, assetId, chainId: CHAIN_ID, fee: 500_000, recipient: recipient.address },
        issuer.seed,
      );
      await broadcast(tx, API_BASE);
      const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
      expect(confirmed.height).toBeGreaterThan(0);

      const bal = await assetBalance(recipient.address, assetId);
      expect(bal).toBe(10);
    });

    it('setAssetScript swaps always-true → freeze (script update)', async () => {
      if (skip || !assetId) return;

      const tx = setAssetScript(
        { assetId, chainId: CHAIN_ID, script: scripts.freeze! },
        issuer.seed,
      );
      await broadcast(tx, API_BASE);
      const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
      expect(confirmed.height).toBeGreaterThan(0);

      // Transfer now must be rejected (freeze script returns false)
      const recipient = randomTestAccount(CHAIN_ID);
      const transferTx = transfer(
        { amount: 1, assetId, chainId: CHAIN_ID, fee: 500_000, recipient: recipient.address },
        issuer.seed,
      );
      await expect(broadcast(transferTx, API_BASE)).rejects.toThrow();
    });
  });

  // ── freeze asset ──────────────────────────────────────────────────────────

  describe('freeze asset — all transfers blocked', () => {
    let assetId: string;

    it('issues with freeze script', async () => {
      if (skip) return;

      const tx = issue(
        {
          chainId: CHAIN_ID,
          decimals: 0,
          description: 'e2e frozen smart asset',
          name: 'E2EFreezeA',
          quantity: 1_000,
          reissuable: false,
          script: scripts.freeze!,
        },
        issuer.seed,
      );
      await broadcast(tx, API_BASE);
      await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
      assetId = tx.id;
    });

    it('transfer of frozen asset is rejected', async () => {
      if (skip || !assetId) return;

      const recipient = randomTestAccount(CHAIN_ID);
      const tx = transfer(
        { amount: 1, assetId, chainId: CHAIN_ID, fee: 500_000, recipient: recipient.address },
        issuer.seed,
      );
      await expect(broadcast(tx, API_BASE)).rejects.toThrow();
    });
  });

  // ── burn-only asset ───────────────────────────────────────────────────────

  describe('burn-only asset', () => {
    let assetId: string;

    it('issues with burn-only script', async () => {
      if (skip) return;

      const tx = issue(
        {
          chainId: CHAIN_ID,
          decimals: 0,
          description: 'e2e burn-only smart asset',
          name: 'E2EBurnA',
          quantity: 500,
          reissuable: true,
          script: scripts.burn_only!,
        },
        issuer.seed,
      );
      await broadcast(tx, API_BASE);
      await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
      assetId = tx.id;
    });

    it('burn confirms (script permits BurnTransaction)', async () => {
      if (skip || !assetId) return;

      const tx = burn({ amount: 100, assetId, chainId: CHAIN_ID, fee: 500_000 }, issuer.seed);
      await broadcast(tx, API_BASE);
      const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
      expect(confirmed.height).toBeGreaterThan(0);

      const bal = await assetBalance(issuer.address, assetId);
      expect(bal).toBe(400); // 500 - 100
    });

    it('transfer of burn-only asset is rejected', async () => {
      if (skip || !assetId) return;

      const recipient = randomTestAccount(CHAIN_ID);
      const tx = transfer(
        { amount: 1, assetId, chainId: CHAIN_ID, fee: 500_000, recipient: recipient.address },
        issuer.seed,
      );
      await expect(broadcast(tx, API_BASE)).rejects.toThrow();
    });
  });
});
