import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Unit tests for the node-api SDK functions whose underlying node-scala REST routes were
 * deliberately removed (see the Tier-5 dead-endpoint audit). Unlike test/api-node/**, these
 * don't need a running node — either because the function now throws before making any
 * request (fully obsolete, no replacement), or because it proxies to a real, current route and
 * we can verify that with a mocked `fetch` instead of a live integration test.
 *
 * Kept at the top level of test/ (not under test/api-node/) so it runs as part of the fast unit
 * suite (`pnpm test`) rather than being swept into the integration-only exclude pattern in
 * vitest.config.ts.
 */

let debugApi: typeof import('../src/api-node/debug');
let consensusApi: typeof import('../src/api-node/consensus');
let utilsApi: typeof import('../src/api-node/utils');
let blocksApi: typeof import('../src/api-node/blocks');

const BASE = 'https://nodes.example.com';

describe('deprecated node-api functions (removed node-scala routes)', () => {
  const mockFetch = vi.fn<typeof fetch>();

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', mockFetch);
    debugApi = await import('../src/api-node/debug');
    consensusApi = await import('../src/api-node/consensus');
    utilsApi = await import('../src/api-node/utils');
    blocksApi = await import('../src/api-node/blocks');
  });

  afterEach(() => {
    mockFetch.mockReset();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('genuinely obsolete — throw instead of 404ing', () => {
    it('debug.fetchPortfolios rejects and never calls fetch (/debug/portfolios/{address} removed, no replacement)', async () => {
      await expect(debugApi.fetchPortfolios(BASE, 'someAddress', 'apiKey')).rejects.toThrow(
        /c82177af69/,
      );
      await expect(debugApi.fetchPortfolios(BASE, 'someAddress', 'apiKey')).rejects.toThrow(
        /NODE-2496/,
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('consensus.fetchConsensusAlgo rejects and never calls fetch (/consensus route removed entirely, no replacement)', async () => {
      await expect(consensusApi.fetchConsensusAlgo(BASE)).rejects.toThrow(/d0388ebdaa/);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('utils.fetchScriptMeta rejects and never calls fetch (/utils/script/meta removed, no drop-in replacement)', async () => {
      await expect(utilsApi.fetchScriptMeta(BASE, 'base64:abc')).rejects.toThrow(/9b85f1dacd/);
      await expect(utilsApi.fetchScriptMeta(BASE, 'base64:abc')).rejects.toThrow(
        /fetchScriptInfoMeta/,
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('real replacement found — now proxies to the current route', () => {
    it('debug.fetchStateChangesByTxId calls GET /transactions/info/{id}, not the removed /debug/stateChanges/info route', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'tx1', stateChanges: { data: [] }, type: 16 }), {
          status: 200,
        }),
      );

      const result = await debugApi.fetchStateChangesByTxId(BASE, 'tx1');

      expect(mockFetch).toHaveBeenCalledOnce();
      const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
      expect(calledUrl).toBe(`${BASE}/transactions/info/tx1`);
      expect(result.stateChanges).toEqual({ data: [] });
    });

    it('debug.fetchStateChangesByAddress calls GET /transactions/address/{address}/limit/{limit}, not the removed /debug/stateChanges/address route', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify([[{ id: 'tx1', stateChanges: { data: [] }, type: 16 }]]), {
          status: 200,
        }),
      );

      const result = await debugApi.fetchStateChangesByAddress(BASE, 'addr1', 10);

      expect(mockFetch).toHaveBeenCalledOnce();
      const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
      expect(calledUrl).toBe(`${BASE}/transactions/address/addr1/limit/10`);
      expect(result).toHaveLength(1);
      expect(result[0]?.stateChanges).toEqual({ data: [] });
    });

    it('debug.debugRollbackTo resolves the block id to a height via GET /blocks/height/{id}, then POSTs to /debug/rollback (not the removed DELETE /debug/rollback-to/{id})', async () => {
      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify({ height: 42 }), { status: 200 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ BlockId: 'block1' }), { status: 200 }),
        );

      await debugApi.debugRollbackTo(BASE, 'block1', 'apiKey');

      expect(mockFetch).toHaveBeenCalledTimes(2);

      const firstUrl = mockFetch.mock.calls[0]?.[0] as string;
      expect(firstUrl).toBe(`${BASE}/blocks/height/block1`);

      const secondUrl = mockFetch.mock.calls[1]?.[0] as string;
      const secondOptions = mockFetch.mock.calls[1]?.[1] as RequestInit;
      expect(secondUrl).toBe(`${BASE}/debug/rollback`);
      expect(secondOptions.method).toBe('POST');
      expect(JSON.parse(secondOptions.body as string)).toEqual({
        returnTransactionsToUtx: false,
        rollbackTo: 42,
      });
    });

    it('consensus.fetchGeneratingBalance calls GET /addresses/balance/details/{address}, not the removed /consensus/generatingbalance route', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            address: 'addr1',
            available: 100,
            effective: 100,
            generating: 55,
            regular: 100,
          }),
          { status: 200 },
        ),
      );

      const result = await consensusApi.fetchGeneratingBalance(BASE, 'addr1');

      expect(mockFetch).toHaveBeenCalledOnce();
      const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
      expect(calledUrl).toBe(`${BASE}/addresses/balance/details/addr1`);
      expect(result).toEqual({ address: 'addr1', balance: 55 });
    });

    it('consensus.fetchBasetarget calls GET /blocks/headers/last, not the removed /consensus/basetarget route', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ 'nxt-consensus': { 'base-target': 65 } }), { status: 200 }),
      );

      const result = await consensusApi.fetchBasetarget(BASE);

      expect(mockFetch).toHaveBeenCalledOnce();
      const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
      expect(calledUrl).toBe(`${BASE}/blocks/headers/last`);
      expect(result).toEqual({ baseTarget: 65 });
    });

    it('blocks.fetchFirst calls GET /blocks/at/1, not the removed /blocks/first route', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ height: 1, transactions: [] }), { status: 200 }),
      );

      const result = await blocksApi.fetchFirst(BASE);

      expect(mockFetch).toHaveBeenCalledOnce();
      const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
      expect(calledUrl).toBe(`${BASE}/blocks/at/1`);
      expect(result.height).toBe(1);
    });
  });
});
