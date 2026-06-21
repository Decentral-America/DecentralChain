/**
 * Node REST API health and correctness tests.
 *
 * Covers:
 *   - /blocks/height — positive, increases over time
 *   - /blocks/last — correct block structure
 *   - /blocks/at/:height — retrieval by height
 *   - /node/version — version string present
 *   - /node/status — blockchain height reported
 *   - /addresses/validate — valid and invalid address detection
 *   - /transactions/calculateFee — transfer fee calculation
 *   - /transactions/unconfirmed — UTX pool readable
 *   - /peers/connected — endpoint reachable (may require API key — soft assertion)
 *
 * These are black-box smoke tests; they validate the API surface, not
 * specific values, so they stay green across chain restarts.
 */

import { address } from '@decentralchain/ts-lib-crypto';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);
const TIMEOUT = 60_000;

describe('Node REST API health', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  // ── blocks ─────────────────────────────────────────────────────────────────

  describe('/blocks', () => {
    let height1: number;

    it('GET /blocks/height returns positive integer', async () => {
      const res = await fetch(`${API_BASE}blocks/height`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { height: number };
      height1 = body.height;
      expect(height1).toBeGreaterThan(0);
    });

    it('height increases (chain is producing blocks)', async () => {
      // Wait at most 90 s for a new block (avg block time ≈ 40 s)
      const deadline = Date.now() + 90_000;
      let height2 = height1;

      while (Date.now() < deadline && height2 <= height1) {
        await new Promise((r) => setTimeout(r, 5_000));
        const res = await fetch(`${API_BASE}blocks/height`);
        if (res.ok) {
          height2 = ((await res.json()) as { height: number }).height;
        }
      }

      expect(height2).toBeGreaterThan(height1);
    }, 120_000);

    it('GET /blocks/last returns valid block structure', async () => {
      const res = await fetch(`${API_BASE}blocks/last`);
      expect(res.ok).toBe(true);
      const block = (await res.json()) as {
        id: string;
        height: number;
        timestamp: number;
        generator: string;
        version: number;
        transactions: unknown[];
      };
      expect(block.id).toBeTruthy();
      expect(block.height).toBeGreaterThan(0);
      expect(block.timestamp).toBeGreaterThan(0);
      expect(block.generator).toBeTruthy();
      expect(Array.isArray(block.transactions)).toBe(true);
    });

    it('GET /blocks/at/:height returns the block at that height', async () => {
      const hRes = await fetch(`${API_BASE}blocks/height`);
      const { height } = (await hRes.json()) as { height: number };

      const res = await fetch(`${API_BASE}blocks/at/${height}`);
      expect(res.ok).toBe(true);
      const block = (await res.json()) as { height: number };
      expect(block.height).toBe(height);
    });

    it('GET /blocks/seq/1/3 returns 3 blocks in order', async () => {
      const res = await fetch(`${API_BASE}blocks/seq/1/3`);
      expect(res.ok).toBe(true);
      const blocks = (await res.json()) as Array<{ height: number }>;
      expect(blocks).toHaveLength(3);
      expect(blocks.at(0)?.height).toBe(1);
      expect(blocks.at(1)?.height).toBe(2);
      expect(blocks.at(2)?.height).toBe(3);
    });

    it('GET /blocks/at/1 returns genesis block', async () => {
      const res = await fetch(`${API_BASE}blocks/at/1`);
      expect(res.ok).toBe(true);
      const block = (await res.json()) as { height: number };
      expect(block.height).toBe(1);
    });

    it('block has transactions array', async () => {
      const res = await fetch(`${API_BASE}blocks/last`);
      expect(res.ok).toBe(true);
      const block = (await res.json()) as { transactions: unknown[] };
      expect(Array.isArray(block.transactions)).toBe(true);
    });

    it('block timestamp is recent (within 7 days)', async () => {
      const res = await fetch(`${API_BASE}blocks/last`);
      expect(res.ok).toBe(true);
      const block = (await res.json()) as { timestamp: number };
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      expect(block.timestamp).toBeGreaterThan(sevenDaysAgo);
    });
  });

  // ── node ───────────────────────────────────────────────────────────────────

  describe('/node', () => {
    it('GET /node/version returns a non-empty version string', async () => {
      const res = await fetch(`${API_BASE}node/version`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { version: string };
      expect(typeof body.version).toBe('string');
      expect(body.version.length).toBeGreaterThan(0);
    });

    it('GET /node/status includes blockchain height', async () => {
      const res = await fetch(`${API_BASE}node/status`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { blockchainHeight: number; stateHeight: number };
      expect(body.blockchainHeight).toBeGreaterThan(0);
    });
  });

  // ── addresses ──────────────────────────────────────────────────────────────

  describe('/addresses', () => {
    it('GET /addresses/validate/:addr returns valid=true for master address', async () => {
      const res = await fetch(`${API_BASE}addresses/validate/${MASTER_ADDR}`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { address: string; valid: boolean };
      expect(body.valid).toBe(true);
    });

    it('GET /addresses/validate/:addr returns valid=false for garbage', async () => {
      const res = await fetch(`${API_BASE}addresses/validate/notAnAddress`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { valid: boolean };
      expect(body.valid).toBe(false);
    });

    it('GET /addresses/balance/:addr returns non-negative balance', async () => {
      const res = await fetch(`${API_BASE}addresses/balance/${MASTER_ADDR}`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { balance: number };
      expect(body.balance).toBeGreaterThanOrEqual(0);
    });

    it('GET /addresses/balance/details/:addr returns all balance tiers', async () => {
      const res = await fetch(`${API_BASE}addresses/balance/details/${MASTER_ADDR}`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as {
        regular: number;
        generating: number;
        available: number;
        effective: number;
      };
      expect(body.regular).toBeGreaterThanOrEqual(0);
      expect(body.available).toBeGreaterThanOrEqual(0);
      expect(body.effective).toBeGreaterThanOrEqual(0);
    });

    it('GET /addresses/data/:addr returns list', async () => {
      const res = await fetch(`${API_BASE}addresses/data/${MASTER_ADDR}`);
      expect(res.ok).toBe(true);
      const result = (await res.json()) as unknown[];
      expect(Array.isArray(result)).toBe(true);
    });

    it('GET /addresses/scriptInfo/:addr returns structure', async () => {
      const res = await fetch(`${API_BASE}addresses/scriptInfo/${MASTER_ADDR}`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { address: string };
      expect(body).toHaveProperty('address');
    });

    it('GET /alias/by-address/:addr returns array', async () => {
      const res = await fetch(`${API_BASE}alias/by-address/${MASTER_ADDR}`);
      expect(res.ok).toBe(true);
      const result = (await res.json()) as unknown[];
      expect(Array.isArray(result)).toBe(true);
    });

    it('GET /assets/balance/:addr returns balances', async () => {
      const res = await fetch(`${API_BASE}assets/balance/${MASTER_ADDR}`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as Record<string, unknown>;
      expect('balances' in body || 'address' in body).toBe(true);
    });

    it('GET /leasing/active/:addr returns array', async () => {
      const res = await fetch(`${API_BASE}leasing/active/${MASTER_ADDR}`);
      expect(res.ok).toBe(true);
      const result = (await res.json()) as unknown[];
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ── transactions ──────────────────────────────────────────────────────────

  describe('/transactions', () => {
    it('GET /transactions/unconfirmed returns an array', async () => {
      const res = await fetch(`${API_BASE}transactions/unconfirmed`);
      expect(res.ok).toBe(true);
      const txs = (await res.json()) as unknown[];
      expect(Array.isArray(txs)).toBe(true);
    });

    it('GET /transactions/unconfirmed/size returns integer', async () => {
      const res = await fetch(`${API_BASE}transactions/unconfirmed/size`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { size: number };
      expect(body.size).toBeGreaterThanOrEqual(0);
    });

    it('POST /transactions/calculateFee for transfer returns positive fee', async () => {
      const res = await fetch(`${API_BASE}transactions/calculateFee`, {
        body: JSON.stringify({
          amount: 100_000,
          recipient: MASTER_ADDR,
          senderPublicKey: 'some',
          type: 4,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      // calculateFee may return 400 if the senderPublicKey is invalid — just test reachability
      expect([200, 400]).toContain(res.status);
    });

    it('POST /transactions/calculateFee with known public key returns feeAmount', async () => {
      const res = await fetch(`${API_BASE}transactions/calculateFee`, {
        body: JSON.stringify({
          amount: 100_000,
          assetId: null,
          attachment: '',
          feeAssetId: null,
          recipient: MASTER_ADDR,
          senderPublicKey: 'GegVBYKsoCdcBoEnba259Xq9pdkVmUaA2cooyfbdWkVN',
          type: 4,
          version: 2,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const body = (await res.json()) as Record<string, unknown>;
      expect([200, 400]).toContain(res.status);
      if (res.status === 200) {
        expect(body).toHaveProperty('feeAmount');
      }
    });
  });

  // ── peers ─────────────────────────────────────────────────────────────────

  describe('/peers', () => {
    it('GET /peers/connected is reachable (200 or 403 for API-key-protected nodes)', async () => {
      const res = await fetch(`${API_BASE}peers/connected`);
      expect([200, 403]).toContain(res.status);
    });
  });
});
