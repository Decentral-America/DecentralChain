/**
 * REST endpoint coverage, round 2 — a fresh full-endpoint audit (beyond the
 * "high value" subset closed in rest-coverage.spec.ts) found these still
 * untested, several of them the primary endpoints real wallets/explorers use.
 *
 * Same black-box smoke-test style as node-api.spec.ts / rest-coverage.spec.ts:
 * validates the API surface is reachable and shaped correctly, not specific
 * values, so it stays green across restarts.
 *
 * Covers:
 *   - GET /transactions/address/{addr}/limit/{n} — tx history, the single
 *     highest-value gap found: the primary endpoint wallets/explorers use
 *   - GET /transactions/snapshot/{id}
 *   - GET /addresses/balance/{addr}/{confirmations}, /effectiveBalance/{addr}(/{confs}),
 *     /publicKey/{pk}, /scriptInfo/{addr}/meta
 *   - GET /alias/by-alias/{name}
 *   - GET /leasing/info/{leaseId}
 *   - GET /peers/blacklisted, /peers/suspended
 *   - GET /blocks/height/{blockId}, /blocks/finalized/at/{height}
 */

import { alias, broadcast, lease, transfer, waitForTx } from '@decentralchain/transactions';
import { address, publicKey } from '@decentralchain/ts-lib-crypto';
import { randomTestAccount } from '../helpers/accounts';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);
const MASTER_PUBLIC_KEY = publicKey(MASTER_SEED);
const TIMEOUT = 120_000;

async function currentHeight(): Promise<number> {
  const res = await fetch(`${API_BASE}blocks/height`);
  const { height } = (await res.json()) as { height: number };
  return height;
}

describe('REST endpoint coverage, round 2', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  // ── transactions ──────────────────────────────────────────────────────────

  describe('/transactions', () => {
    let txId: string;

    beforeAll(async () => {
      const recipient = randomTestAccount(CHAIN_ID);
      const tx = transfer(
        { amount: 1, chainId: CHAIN_ID, recipient: recipient.address },
        MASTER_SEED,
      );
      txId = tx.id;
      await broadcast(tx, API_BASE);
      await waitForTx(txId, { apiBase: API_BASE, timeout: TIMEOUT });
    }, TIMEOUT);

    it('GET /transactions/address/{addr}/limit/{n} returns this tx for the sender', async () => {
      const res = await fetch(`${API_BASE}transactions/address/${MASTER_ADDR}/limit/20`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as Array<Array<{ id: string }>>;
      expect(Array.isArray(body)).toBe(true);
      const flat = body.flat();
      expect(flat.some((tx) => tx.id === txId)).toBe(true);
    });

    it('GET /transactions/snapshot/{id} is reachable for a confirmed transaction', async () => {
      const res = await fetch(`${API_BASE}transactions/snapshot/${txId}`);
      // Snapshot data may not be retained for all tx types/heights — 200 or 404
      // both confirm the route isn't crashing; a 5xx would not.
      expect([200, 404]).toContain(res.status);
    });
  });

  // ── addresses ─────────────────────────────────────────────────────────────

  describe('/addresses', () => {
    it('GET /addresses/balance/{addr}/{confirmations} returns a balance', async () => {
      const res = await fetch(`${API_BASE}addresses/balance/${MASTER_ADDR}/1`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { balance: number };
      expect(body.balance).toBeGreaterThanOrEqual(0);
    });

    it('GET /addresses/effectiveBalance/{addr} returns a balance', async () => {
      const res = await fetch(`${API_BASE}addresses/effectiveBalance/${MASTER_ADDR}`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { balance: number };
      expect(body.balance).toBeGreaterThanOrEqual(0);
    });

    it('GET /addresses/effectiveBalance/{addr}/{confirmations} returns a balance', async () => {
      const res = await fetch(`${API_BASE}addresses/effectiveBalance/${MASTER_ADDR}/1`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { balance: number };
      expect(body.balance).toBeGreaterThanOrEqual(0);
    });

    it('GET /addresses/publicKey/{pk} derives the correct address', async () => {
      const res = await fetch(`${API_BASE}addresses/publicKey/${MASTER_PUBLIC_KEY}`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { address: string };
      expect(body.address).toBe(MASTER_ADDR);
    });

    it('GET /addresses/scriptInfo/{addr}/meta is reachable for a plain (unscripted) account', async () => {
      const account = randomTestAccount(CHAIN_ID);
      const res = await fetch(`${API_BASE}addresses/scriptInfo/${account.address}/meta`);
      // A never-used account with no script should still return a shaped response, not crash.
      expect([200, 404]).toContain(res.status);
    });
  });

  // ── alias ─────────────────────────────────────────────────────────────────

  describe('/alias', () => {
    let aliasName: string;

    beforeAll(async () => {
      aliasName = `e2ercv2${Date.now().toString(36)}`.slice(0, 20);
      const tx = alias({ alias: aliasName, chainId: CHAIN_ID }, MASTER_SEED);
      await broadcast(tx, API_BASE);
      await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    }, TIMEOUT);

    it('GET /alias/by-alias/{name} resolves back to the owning address', async () => {
      const res = await fetch(`${API_BASE}alias/by-alias/${aliasName}`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { address: string };
      expect(body.address).toBe(MASTER_ADDR);
    });
  });

  // ── leasing ───────────────────────────────────────────────────────────────

  describe('/leasing', () => {
    let leaseId: string;
    const recipient = randomTestAccount(CHAIN_ID);

    beforeAll(async () => {
      const tx = lease(
        { amount: 1_000_000, chainId: CHAIN_ID, recipient: recipient.address },
        MASTER_SEED,
      );
      leaseId = tx.id;
      await broadcast(tx, API_BASE);
      await waitForTx(leaseId, { apiBase: API_BASE, timeout: TIMEOUT });
    }, TIMEOUT);

    it('GET /leasing/info/{leaseId} returns the lease details', async () => {
      const res = await fetch(`${API_BASE}leasing/info/${leaseId}`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { id: string; amount: number };
      expect(body.id).toBe(leaseId);
      expect(body.amount).toBe(1_000_000);
    });
  });

  // ── peers ─────────────────────────────────────────────────────────────────

  describe('/peers', () => {
    it('GET /peers/blacklisted returns an array', async () => {
      const res = await fetch(`${API_BASE}peers/blacklisted`);
      expect(res.ok).toBe(true);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });

    it('GET /peers/suspended returns an array', async () => {
      const res = await fetch(`${API_BASE}peers/suspended`);
      expect(res.ok).toBe(true);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });
  });

  // ── blocks ────────────────────────────────────────────────────────────────

  describe('/blocks', () => {
    it('GET /blocks/height/{blockId} returns the height for a known block', async () => {
      const height = await currentHeight();
      const headerRes = await fetch(`${API_BASE}blocks/headers/at/${height}`);
      expect(headerRes.ok).toBe(true);
      const { id: blockId } = (await headerRes.json()) as { id: string };

      const res = await fetch(`${API_BASE}blocks/height/${blockId}`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { height: number };
      expect(body.height).toBe(height);
    });

    it('GET /blocks/finalized/at/{height} is reachable for a safely-past height', async () => {
      const height = Math.max(1, (await currentHeight()) - 5);
      const res = await fetch(`${API_BASE}blocks/finalized/at/${height}`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { height: number };
      expect(body.height).toBeGreaterThan(0);
    });
  });
});
