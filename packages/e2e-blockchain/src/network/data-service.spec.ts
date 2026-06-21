/**
 * Data Service API smoke tests.
 *
 * Covers:
 *   - /v0/transactions/transfer     — reachability, sender filter, TX lookup by id
 *   - /v0/transactions/mass-transfer — list endpoint
 *   - /v0/transactions/set-script    — list endpoint
 *   - /v0/transactions/sponsorship   — list endpoint
 *   - /v0/transactions/issue         — list endpoint (used to derive asset id)
 *   - /v0/assets/:assetId            — asset detail lookup
 *
 * These are black-box smoke tests; they validate the API surface, not
 * specific values, so they stay green across chain restarts. Empty item
 * arrays on a young chain are treated as acceptable.
 */

import { address } from '@decentralchain/ts-lib-crypto';
import { CHAIN_ID, DS_URL, MASTER_SEED } from '../setup/env';

const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);
const TIMEOUT = 60_000;

describe('Data Service API', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  // ── reachability ────────────────────────────────────────────────────────────

  it('data service is reachable', async () => {
    const res = await fetch(`${DS_URL}/v0/transactions/transfer?limit=1`);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
    expect('items' in body || 'data' in body).toBe(true);
  });

  // ── transfer ────────────────────────────────────────────────────────────────

  describe('/v0/transactions/transfer', () => {
    it('data service TX lookup by type/id returns correct format', async () => {
      const listRes = await fetch(
        `${DS_URL}/v0/transactions/transfer?sender=${MASTER_ADDR}&limit=1`,
      );
      expect(listRes.ok).toBe(true);
      const listBody = (await listRes.json()) as { items?: Array<{ data: { id: string } }> };
      const items = listBody.items ?? [];

      if (items.length > 0) {
        const id = items.at(0)?.data.id;
        const detRes = await fetch(`${DS_URL}/v0/transactions/transfer/${id}`);
        expect(detRes.ok).toBe(true);
        const detBody = (await detRes.json()) as { data: { id: string } };
        expect(detBody.data.id).toBe(id);
      }
      // No items on a young chain is acceptable — test passes either way
    });

    it('data service transfer history for sender returns list', async () => {
      const res = await fetch(`${DS_URL}/v0/transactions/transfer?sender=${MASTER_ADDR}&limit=5`);
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { items?: unknown[] };
      expect(Array.isArray(body.items ?? [])).toBe(true);
    });
  });

  // ── mass-transfer ───────────────────────────────────────────────────────────

  it('data service mass-transfer history endpoint', async () => {
    const res = await fetch(
      `${DS_URL}/v0/transactions/mass-transfer?sender=${MASTER_ADDR}&limit=5`,
    );
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { items?: unknown[] };
    expect(Array.isArray(body.items ?? [])).toBe(true);
  });

  // ── set-script ──────────────────────────────────────────────────────────────

  it('data service set-script history endpoint', async () => {
    const res = await fetch(`${DS_URL}/v0/transactions/set-script?sender=${MASTER_ADDR}&limit=5`);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { items?: unknown[] };
    expect(Array.isArray(body.items ?? [])).toBe(true);
  });

  // ── sponsorship ─────────────────────────────────────────────────────────────

  it('data service sponsorship history endpoint', async () => {
    const res = await fetch(`${DS_URL}/v0/transactions/sponsorship?sender=${MASTER_ADDR}&limit=5`);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { items?: unknown[] };
    expect(Array.isArray(body.items ?? [])).toBe(true);
  });

  // ── asset details ───────────────────────────────────────────────────────────

  it('data service asset details for indexed asset', async () => {
    const listRes = await fetch(`${DS_URL}/v0/transactions/issue?sender=${MASTER_ADDR}&limit=1`);
    expect(listRes.ok).toBe(true);
    const listBody = (await listRes.json()) as {
      items?: Array<{ data: { assetId: string } }>;
    };
    const items = listBody.items ?? [];

    if (items.length > 0) {
      const assetId = items.at(0)?.data.assetId;
      const detRes = await fetch(`${DS_URL}/v0/assets/${assetId}`);
      expect(detRes.ok).toBe(true);
      const detBody = (await detRes.json()) as { data: { id: string } };
      expect(detBody.data.id).toBeTruthy();
    }
    // No issued assets on a young chain is acceptable — test passes either way
  });
});
