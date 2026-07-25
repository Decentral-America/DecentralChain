import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Unit tests for `fetchFinalityInfo`'s composition logic.
 *
 * `fetchFinalityInfo` lives in `src/api-node/finality/index.ts` (it makes
 * real HTTP calls, hence `api-node/`), but — same as `test/tools/request.spec.ts`
 * does for the transport layer — we mock `fetch` here so the *composition*
 * (which endpoints get called, with which arguments, and how the two known
 * gaps are surfaced) can be verified deterministically, without a live node.
 * Live-node coverage of the individual endpoints this composes
 * (`/blocks/height`, `/blocks/height/finalized`, `/generators/at/{height}`,
 * `/activation/status`) already exists in their respective `test/api-node/*.spec.ts`
 * integration suites.
 */

let fetchFinalityInfo: typeof import('../../../src/api-node/finality').fetchFinalityInfo;

const BASE = 'https://nodes.example.com';

// node-scala BlockchainFeature.DeterministicFinality id (BlockchainFeature.scala:31).
// Not exported from src/api-node/finality (would break the `create()` wrapRecord
// contract — see the comment above its module-private declaration), so duplicated
// here for test-stub purposes.
const DETERMINISTIC_FINALITY_FEATURE_ID = 25;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('fetchFinalityInfo – composes /blockchain/finality from real endpoints', () => {
  const mockFetch = vi.fn<typeof fetch>();

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', mockFetch);
    const mod = await import('../../../src/api-node/finality');
    fetchFinalityInfo = mod.fetchFinalityInfo;
  });

  afterEach(() => {
    mockFetch.mockReset();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function stubResponses(opts: {
    height: number;
    finalizedHeight: number;
    activationHeight?: number;
    generators?: unknown[];
  }) {
    const { height, finalizedHeight, activationHeight, generators = [] } = opts;

    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.endsWith('/blocks/height')) return jsonResponse({ height });
      if (url.endsWith('/blocks/height/finalized'))
        return jsonResponse({ height: finalizedHeight });
      if (url.endsWith('/activation/status')) {
        return jsonResponse({
          features:
            activationHeight === undefined
              ? []
              : [
                  {
                    activationHeight,
                    blockchainStatus: 'Activated',
                    description: 'Deterministic Finality & RIDE V9',
                    id: DETERMINISTIC_FINALITY_FEATURE_ID,
                    nodeStatus: 'Implemented',
                  },
                ],
          height,
          nextCheck: height,
          votingInterval: 1,
          votingThreshold: 1,
        });
      }
      if (url.includes('/generators/at/')) return jsonResponse(generators);

      throw new Error(`Unexpected URL in test: ${url}`);
    });
  }

  it('composes height, finalizedHeight and currentGenerators from the real endpoints', async () => {
    stubResponses({
      activationHeight: 100,
      finalizedHeight: 1090,
      generators: [{ address: '3Ltest', balance: 42, transactionId: 'txid' }],
      height: 1100,
    });

    const info = await fetchFinalityInfo(BASE, 1000);

    expect(info.height).toBe(1100);
    expect(info.finalizedHeight).toBe(1090);
    expect(info.currentGenerators).toEqual([
      { address: '3Ltest', balance: 42, transactionId: 'txid' },
    ]);

    // Verify the real endpoints were hit — not the nonexistent /blockchain/finality.
    const calledUrls = mockFetch.mock.calls.map(
      (call) => new URL(typeof call[0] === 'string' ? call[0] : call[0].toString()).pathname,
    );
    expect(calledUrls).toContain('/blocks/height');
    expect(calledUrls).toContain('/blocks/height/finalized');
    expect(calledUrls).toContain('/activation/status');
    expect(calledUrls).toContain('/generators/at/1100');
    expect(calledUrls).not.toContain('/blockchain/finality');
  });

  it('computes currentGenerationPeriod/nextGenerationPeriod from the ported algorithm', async () => {
    // activation=100, length=1000: zero period is [100, 1100]; height=1100 is
    // its last block, so current = [100, 1100], next = [1101, 2100].
    stubResponses({ activationHeight: 100, finalizedHeight: 1100, height: 1100 });

    const info = await fetchFinalityInfo(BASE, 1000);

    expect(info.currentGenerationPeriod).toEqual({ end: 1100, start: 100 });
    expect(info.nextGenerationPeriod).toEqual({ end: 2100, start: 1101 });
  });

  it('omits generation periods when Deterministic Finality is not activated', async () => {
    stubResponses({ activationHeight: undefined, finalizedHeight: 50, height: 60 });

    const info = await fetchFinalityInfo(BASE, 1000);

    expect(info.currentGenerationPeriod).toBeUndefined();
    expect(info.nextGenerationPeriod).toBeUndefined();
  });

  it('gap #2: nextGenerators is always null, never an empty array', async () => {
    stubResponses({ activationHeight: 100, finalizedHeight: 1100, height: 1100 });

    const info = await fetchFinalityInfo(BASE, 1000);

    expect(info.nextGenerators).toBeNull();
    // Distinct from `[]` — this is the point of the honesty requirement.
    expect(info.nextGenerators).not.toEqual([]);
  });

  it('gap #1: generationPeriodLength is a required parameter, not silently defaulted', async () => {
    stubResponses({ activationHeight: 100, finalizedHeight: 1100, height: 1100 });

    // `generationPeriodLength` is a required positional parameter at the type
    // level (verified separately by the compiler — there is no runtime way to
    // "omit" a required parameter in JS). At runtime, an explicitly-invalid
    // length throws rather than silently computing wrong period boundaries.
    await expect(fetchFinalityInfo(BASE, 0)).rejects.toThrow(/positive integer/);
    await expect(fetchFinalityInfo(BASE, -1)).rejects.toThrow(/positive integer/);
  });
});
