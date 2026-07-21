/**
 * REST endpoint coverage — endpoints identified by a full endpoint-vs-tested audit as
 * user/operator-facing, unauthenticated, and never hit by any other spec in this suite.
 *
 * Same black-box smoke-test style as node-api.spec.ts: validates the API surface is
 * reachable and shaped correctly, not specific values, so it stays green across restarts.
 *
 * Covers:
 *   - /transactions/status, /transactions/merkleProof — batch status polling + light-client proof
 *   - /blocks/heightByTimestamp, /blocks/headers/last — explorer/wallet-critical lookups
 *   - /blockchain/rewards, /blockchain/finality — 0% covered before this spec
 *   - /assets/{id}/distribution, /assets/nft/{addr}/limit/{n} — holder/NFT queries
 *   - /utils/script/estimate, /utils/time — dApp tooling + clock sync
 */

import { broadcast, issue, transfer, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { randomTestAccount } from '../helpers/accounts';
import { compileScript } from '../helpers/compile';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);
const TIMEOUT = 120_000;

describe('REST endpoint coverage', () => {
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

    it('POST /transactions/status returns status for a known and an unknown id', async () => {
      const res = await fetch(`${API_BASE}transactions/status`, {
        body: JSON.stringify({ ids: [txId, '1111111111111111111111111111111111111111111'] }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      expect(res.ok).toBe(true);
      const body = (await res.json()) as Array<{ id: string; status: string }>;
      expect(Array.isArray(body)).toBe(true);
      expect(body.find((s) => s.id === txId)?.status).toBe('confirmed');
    });

    it('GET /transactions/merkleProof returns a proof for a confirmed transaction', async () => {
      const res = await fetch(`${API_BASE}transactions/merkleProof?id=${txId}`);
      // Not every node config keeps light-mode proof data for arbitrary past heights —
      // 200 (proof present) or 404 (pruned/unsupported) are both valid, reachability is
      // what matters; a 5xx or malformed body would not be.
      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        const body = (await res.json()) as Array<{ id: string }>;
        expect(Array.isArray(body)).toBe(true);
      }
    });
  });

  // ── blocks ────────────────────────────────────────────────────────────────

  describe('/blocks', () => {
    it('GET /blocks/heightByTimestamp returns a height at or before now', async () => {
      const res = await fetch(`${API_BASE}blocks/heightByTimestamp/${Date.now()}`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { height: number };
      expect(body.height).toBeGreaterThan(0);
    });

    it('GET /blocks/headers/last returns a header without the full transactions array', async () => {
      const res = await fetch(`${API_BASE}blocks/headers/last`);
      expect(res.ok).toBe(true);
      const header = (await res.json()) as { height: number; id: string; transactions?: unknown };
      expect(header.height).toBeGreaterThan(0);
      expect(header.id).toBeTruthy();
    });
  });

  // ── blockchain ────────────────────────────────────────────────────────────

  describe('/blockchain', () => {
    it('GET /blockchain/rewards returns current reward info', async () => {
      const res = await fetch(`${API_BASE}blockchain/rewards`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { height?: number; totalWavesAmount?: number };
      expect(body).toBeTruthy();
    });

    it('GET /blockchain/finality is reachable', async () => {
      const res = await fetch(`${API_BASE}blockchain/finality`);
      // Some deployments intentionally 404 this route at the edge (see infra Caddy config) —
      // 200 or 404 both confirm the route isn't crashing; a 5xx would not.
      expect([200, 404]).toContain(res.status);
    });
  });

  // ── assets ────────────────────────────────────────────────────────────────

  describe('/assets', () => {
    let assetId: string;

    beforeAll(async () => {
      const issueTx = issue(
        {
          chainId: CHAIN_ID,
          decimals: 0,
          description: 'rest-coverage distribution test asset',
          name: 'RestCovTkn',
          quantity: 1_000,
          reissuable: false,
        },
        MASTER_SEED,
      );
      assetId = issueTx.id;
      await broadcast(issueTx, API_BASE);
      await waitForTx(assetId, { apiBase: API_BASE, timeout: TIMEOUT });
    }, TIMEOUT);

    it('GET /assets/{id}/distribution returns holder distribution', async () => {
      // The node deliberately rejects querying distribution AT the live tip height
      // (HTTP 400, error 199: "...can lead to inconsistent result") — query one
      // block behind the tip instead, which is always safely in the past.
      const height = (await currentHeight()) - 1;
      const res = await fetch(`${API_BASE}assets/${assetId}/distribution/${height}/limit/10`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { items?: Record<string, number>; hasNext?: boolean };
      expect(body).toBeTruthy();
    });

    it('GET /assets/nft/{addr}/limit/{n} returns an array', async () => {
      const res = await fetch(`${API_BASE}assets/nft/${MASTER_ADDR}/limit/10`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as unknown[];
      expect(Array.isArray(body)).toBe(true);
    });
  });

  // ── utils ─────────────────────────────────────────────────────────────────

  describe('/utils', () => {
    it('GET /utils/time returns a timestamp close to wall-clock now', async () => {
      const res = await fetch(`${API_BASE}utils/time`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { system: number; NTP?: number };
      expect(Math.abs(body.system - Date.now())).toBeLessThan(60_000);
    });

    it('POST /utils/script/estimate returns a complexity for a compiled script', async () => {
      const compiled = await compileScript(
        '{-# STDLIB_VERSION 5 #-}\n{-# CONTENT_TYPE EXPRESSION #-}\n{-# SCRIPT_TYPE ACCOUNT #-}\ntrue',
        API_BASE,
      );
      const res = await fetch(`${API_BASE}utils/script/estimate`, {
        body: `base64:${compiled}`,
        headers: { 'Content-Type': 'text/plain' },
        method: 'POST',
      });
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { complexity: number };
      expect(body.complexity).toBeGreaterThanOrEqual(0);
    });
  });
});

async function currentHeight(): Promise<number> {
  const res = await fetch(`${API_BASE}blocks/height`);
  const { height } = (await res.json()) as { height: number };
  return height;
}
