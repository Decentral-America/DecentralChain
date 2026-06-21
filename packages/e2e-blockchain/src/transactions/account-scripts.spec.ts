/**
 * Type 13 — SetScript: full account-script lifecycle.
 *
 * Covers:
 *   - Compiling and deploying an always-true verifier
 *   - Verifying /addresses/scriptInfo reports the script
 *   - Transfers from a scripted account still confirm (always-true passes)
 *   - A transfer-only restrictor blocks data entries (rejected on-chain)
 *   - Removing the script reverts the account to plain
 *
 * Each test uses an isolated funded wallet so tests are fully independent.
 */

import { broadcast, data, setScript, transfer, waitForTx } from '@decentralchain/transactions';
import { fundAccount, randomTestAccount } from '../helpers/accounts';
import { compileScript } from '../helpers/compile';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const TIMEOUT = 300_000;
const FUND = 20_000_000; // 0.2 DCC — covers setScript × 3 + transfer + data fees

// ── RIDE sources ──────────────────────────────────────────────────────────────

const ALWAYS_TRUE = `
{-# STDLIB_VERSION 5 #-}
{-# CONTENT_TYPE EXPRESSION #-}
{-# SCRIPT_TYPE ACCOUNT #-}
true
`.trim();

/** Permits only TransferTransaction — all other TX types rejected. */
const TRANSFER_ONLY = `
{-# STDLIB_VERSION 5 #-}
{-# CONTENT_TYPE EXPRESSION #-}
{-# SCRIPT_TYPE ACCOUNT #-}
match tx {
  case _: TransferTransaction => true
  case _ => false
}
`.trim();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function scriptInfoOf(addr: string) {
  const res = await fetch(`${API_BASE}addresses/scriptInfo/${addr}`);
  return (await res.json()) as {
    address: string;
    script?: string;
    scriptText?: string;
    complexity: number;
    extraFee: number;
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Account scripts (type 13)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  // ── always-true lifecycle ─────────────────────────────────────────────────

  describe('always-true verifier', () => {
    const wallet = randomTestAccount(CHAIN_ID);
    let compiledB64: string;

    beforeAll(async () => {
      // Compile first — skip entire suite if the node's compile endpoint is down
      try {
        compiledB64 = await compileScript(ALWAYS_TRUE, API_BASE);
      } catch (e) {
        console.warn('RIDE compile endpoint unavailable — skipping account-script tests:', e);
        return;
      }
      await fundAccount(wallet.address, FUND, MASTER_SEED, API_BASE, CHAIN_ID);
    }, TIMEOUT);

    it('deploys always-true verifier (type=13)', async () => {
      const tx = setScript({ chainId: CHAIN_ID, fee: 1_000_000, script: compiledB64 }, wallet.seed);
      await broadcast(tx, API_BASE);
      const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
      expect(confirmed.height).toBeGreaterThan(0);
    });

    it('scriptInfo endpoint reports script is active', async () => {
      const info = await scriptInfoOf(wallet.address);
      expect(info.script ?? info.scriptText).toBeTruthy();
    });

    it('transfer from scripted account confirms (always-true lets it through)', async () => {
      // Use a fresh recipient so we can assert balance
      const recipient = randomTestAccount(CHAIN_ID);
      const tx = transfer(
        { amount: 100_000, chainId: CHAIN_ID, fee: 500_000, recipient: recipient.address },
        wallet.seed,
      );
      await broadcast(tx, API_BASE);
      const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
      expect(confirmed.height).toBeGreaterThan(0);
    });

    it('removes script (setScript null) — account reverts to plain', async () => {
      const tx = setScript({ chainId: CHAIN_ID, fee: 1_000_000, script: null }, wallet.seed);
      await broadcast(tx, API_BASE);
      const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
      expect(confirmed.height).toBeGreaterThan(0);

      const info = await scriptInfoOf(wallet.address);
      // After removal the field is absent or null
      expect(info.script ?? info.scriptText ?? null).toBeNull();
    });
  });

  // ── transfer-only restrictor ──────────────────────────────────────────────

  describe('transfer-only restrictor', () => {
    const wallet = randomTestAccount(CHAIN_ID);
    let compiledB64: string;

    beforeAll(async () => {
      try {
        compiledB64 = await compileScript(TRANSFER_ONLY, API_BASE);
      } catch {
        return;
      }
      await fundAccount(wallet.address, FUND, MASTER_SEED, API_BASE, CHAIN_ID);

      const tx = setScript({ chainId: CHAIN_ID, fee: 1_000_000, script: compiledB64 }, wallet.seed);
      await broadcast(tx, API_BASE);
      await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    }, TIMEOUT);

    it('data TX from restricted account is rejected by the node', async () => {
      const tx = data(
        {
          chainId: CHAIN_ID,
          data: [{ key: 'should-be-rejected', type: 'integer', value: 1 }],
          fee: 500_000,
        },
        wallet.seed,
      );
      // broadcast must throw (node 400 / script denial)
      await expect(broadcast(tx, API_BASE)).rejects.toThrow();
    });

    it('transfer from restricted account still confirms', async () => {
      const recipient = randomTestAccount(CHAIN_ID);
      const tx = transfer(
        { amount: 100_000, chainId: CHAIN_ID, fee: 500_000, recipient: recipient.address },
        wallet.seed,
      );
      await broadcast(tx, API_BASE);
      const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
      expect(confirmed.height).toBeGreaterThan(0);
    });

    afterAll(async () => {
      // Best-effort cleanup: remove script so wallet can be garbage-collected cleanly
      try {
        const tx = setScript({ chainId: CHAIN_ID, fee: 1_000_000, script: null }, wallet.seed);
        await broadcast(tx, API_BASE);
        await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
      } catch {
        /* ignore */
      }
    }, TIMEOUT);
  });
});
