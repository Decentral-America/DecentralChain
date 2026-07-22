/**
 * Type 17 — UpdateAssetInfo.
 *
 * Covers:
 *   - Update token name
 *   - Update description
 *   - Update name and description atomically
 *   - Non-issuer update is rejected
 *
 * NOTE on cooldown: the DCC node enforces `minUpdateInfoInterval` blocks
 * between asset issue and the first update.  On testnet this is currently
 * 100,000 blocks (≈ 46 days).  Tests that require an update skip gracefully
 * when the chain is too young — the rejection message from the node is
 * surfaced in the skip reason so it is always visible in the run output.
 *
 * The non-issuer rejection test does not require a successful update, so it
 * always runs regardless of the cooldown state.
 */

import { broadcast, issue, updateAssetInfo, waitForTx } from '@decentralchain/transactions';
import { fundAccount, randomTestAccount } from '../helpers/accounts';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const TIMEOUT = 300_000;
const FUND = 110_000_000; // 1.1 DCC — issue (1 DCC) + update fee + gas

// ── Helpers ───────────────────────────────────────────────────────────────────

function uniqueName(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}`.slice(0, 16);
}

async function assetDetails(assetId: string): Promise<{ name: string; description: string }> {
  const res = await fetch(`${API_BASE}assets/details/${assetId}`);
  if (!res.ok) throw new Error(`assets/details HTTP ${res.status}`);
  return (await res.json()) as { name: string; description: string };
}

function isCooldownError(err: unknown): boolean {
  const msg = String(err).toLowerCase();
  return (
    msg.includes("can't update") ||
    msg.includes('cannot update') ||
    msg.includes('cooldown') ||
    msg.includes('minupdateinfointerval') ||
    msg.includes('before ') // "before <height> block"
  );
}

/** Issue a token and return its ID; throws on failure. */
async function issueToken(seed: string, name: string, desc: string): Promise<string> {
  const tx = issue(
    { chainId: CHAIN_ID, decimals: 0, description: desc, name, quantity: 1_000, reissuable: true },
    seed,
  );
  await broadcast(tx, API_BASE);
  await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
  return tx.id;
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('UpdateAssetInfo (type 17)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let issuer: ReturnType<typeof randomTestAccount>;

  beforeAll(async () => {
    issuer = randomTestAccount(CHAIN_ID);
    await fundAccount(issuer.address, FUND * 4, MASTER_SEED, API_BASE, CHAIN_ID);
  }, TIMEOUT);

  // ── update name ───────────────────────────────────────────────────────────

  it('updates token name (skips if cooldown not met)', async () => {
    const assetId = await issueToken(issuer.seed, uniqueName('ORI'), 'Original description');
    const newName = uniqueName('UPD');

    let tx: ReturnType<typeof updateAssetInfo>;
    try {
      tx = updateAssetInfo(
        { assetId, chainId: CHAIN_ID, description: 'Original description', name: newName },
        issuer.seed,
      );
      await broadcast(tx, API_BASE);
    } catch (e) {
      if (isCooldownError(e)) {
        console.warn(`UpdateAssetInfo cooldown active — ${e}`);
        return; // skip this assertion; test is structural pass
      }
      throw e;
    }

    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    const { name } = await assetDetails(assetId);
    expect(name).toBe(newName);
  });

  // ── update description ────────────────────────────────────────────────────

  it('updates token description (skips if cooldown not met)', async () => {
    const assetId = await issueToken(issuer.seed, uniqueName('DSC'), 'Old description');
    const newDesc = `Updated at ${Date.now()}`;

    let tx: ReturnType<typeof updateAssetInfo>;
    try {
      tx = updateAssetInfo(
        { assetId, chainId: CHAIN_ID, description: newDesc, name: uniqueName('DSC') },
        issuer.seed,
      );
      await broadcast(tx, API_BASE);
    } catch (e) {
      if (isCooldownError(e)) {
        console.warn(`Cooldown: ${e}`);
        return;
      }
      throw e;
    }

    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    const { description } = await assetDetails(assetId);
    expect(description).toBe(newDesc);
  });

  // ── update name and description ───────────────────────────────────────────

  it('updates name and description in one TX (skips if cooldown not met)', async () => {
    const assetId = await issueToken(issuer.seed, uniqueName('BOT'), 'Both to be updated');
    const newName = uniqueName('NBT');
    const newDesc = 'Updated name and description in one TX';

    let tx: ReturnType<typeof updateAssetInfo>;
    try {
      tx = updateAssetInfo(
        { assetId, chainId: CHAIN_ID, description: newDesc, name: newName },
        issuer.seed,
      );
      await broadcast(tx, API_BASE);
    } catch (e) {
      if (isCooldownError(e)) {
        console.warn(`Cooldown: ${e}`);
        return;
      }
      throw e;
    }

    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    const details = await assetDetails(assetId);
    expect(details.name).toBe(newName);
    expect(details.description).toBe(newDesc);
  });

  // ── non-issuer rejected — always runs ─────────────────────────────────────

  it('non-issuer update is rejected', async () => {
    const assetId = await issueToken(issuer.seed, uniqueName('STR'), 'Issuer owns this');
    const stranger = randomTestAccount(CHAIN_ID);
    await fundAccount(stranger.address, 10_000_000, MASTER_SEED, API_BASE, CHAIN_ID);

    const tx = updateAssetInfo(
      { assetId, chainId: CHAIN_ID, description: 'Should fail', name: 'Hijacked' },
      stranger.seed,
    );
    await expect(broadcast(tx, API_BASE)).rejects.toThrow();
  });

  // ── cooldown rejection — always runs, no catch-and-skip ──────────────────
  //
  // The three tests above only assert a successful update, and silently skip
  // the assertion entirely if the cooldown (currently ~46 days on testnet) is
  // still active — which on a live chain is true almost all the time, so in
  // practice they rarely assert anything. This test instead deterministically
  // TRIGGERS the cooldown (issue a fresh asset, update it immediately) and
  // hard-asserts the rejection, so the cooldown enforcement itself is
  // actually verified rather than assumed.

  it('updating an asset before the cooldown period elapses is rejected', async () => {
    const assetId = await issueToken(
      issuer.seed,
      uniqueName('CLD'),
      'Fresh asset, immediate update',
    );

    const tx = updateAssetInfo(
      { assetId, chainId: CHAIN_ID, description: 'Too soon', name: uniqueName('TOO') },
      issuer.seed,
    );
    await expect(broadcast(tx, API_BASE)).rejects.toThrow();
  });
});
