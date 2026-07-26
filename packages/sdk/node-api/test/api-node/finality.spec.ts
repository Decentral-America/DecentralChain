import { create } from '../../src';
import {
  fetchCommittedGeneratorIndex,
  fetchCommittedGeneratorsAt,
  fetchFinalityInfo,
  fetchFinalized,
  fetchFinalizedHeight,
  fetchFinalizedHeightAt,
} from '../../src/api-node/finality';
import { NODE_URL } from '../_state';

/**
 * Live-node integration tests, same pattern as sibling `test/api-node/*.spec.ts`
 * files (`blocks.spec.ts`, `activation.spec.ts`, ...). Only run via
 * `npm run test:integration` against a real node — see `vitest.integration.config.ts`.
 *
 * `fetchFinalityInfo` no longer calls the nonexistent `GET /blockchain/finality`;
 * it composes real endpoints, see the JSDoc in `src/api-node/finality/index.ts`.
 * Deterministic unit coverage of the composition and the ported generation-period
 * algorithm lives in `test/tools/finality/*.spec.ts` (mocked fetch / pure functions,
 * run as part of the default `npm test`).
 */
const api = create(NODE_URL);

it('fetchFinalized', async () => {
  const header = await api.finality.fetchFinalized();
  expect(typeof header.height).toBe('number');
  expect(typeof header.id).toBe('string');

  const header2 = await fetchFinalized(NODE_URL);
  expect(typeof header2.height).toBe('number');
});

it('fetchFinalizedHeight', async () => {
  const { height } = await api.finality.fetchFinalizedHeight();
  expect(typeof height).toBe('number');

  const { height: height2 } = await fetchFinalizedHeight(NODE_URL);
  expect(typeof height2).toBe('number');
});

it('fetchFinalizedHeightAt', async () => {
  const { height: finalizedHeight } = await api.finality.fetchFinalizedHeight();
  const { height } = await fetchFinalizedHeightAt(NODE_URL, finalizedHeight);
  expect(typeof height).toBe('number');
});

it('fetchCommittedGeneratorsAt', async () => {
  const { height } = await api.blocks.fetchHeight();
  const generators = await fetchCommittedGeneratorsAt(NODE_URL, height);
  expect(generators).toBeInstanceOf(Array);
  generators.forEach((generator) => {
    expect(typeof generator.address).toBe('string');
    expect(typeof generator.transactionId).toBe('string');
  });
});

it('fetchCommittedGeneratorIndex', async () => {
  const { height } = await api.blocks.fetchHeight();
  const generators = await fetchCommittedGeneratorsAt(NODE_URL, height);

  if (generators.length === 0) return;

  const index = await fetchCommittedGeneratorIndex(NODE_URL, height, generators[0].address);
  expect(index).toBe(0);

  const missingIndex = await fetchCommittedGeneratorIndex(NODE_URL, height, '3Nunknown');
  expect(missingIndex).toBe(-1);
});

it('fetchFinalityInfo composes height, finalizedHeight and currentGenerators for real', async () => {
  const info = await fetchFinalityInfo(NODE_URL);

  expect(typeof info.height).toBe('number');
  expect(typeof info.finalizedHeight).toBe('number');
  expect(info.currentGenerators).toBeInstanceOf(Array);

  // Gap #2 is always honestly surfaced as `null`, never a lying `[]`.
  expect(info.nextGenerators).toBeNull();

  // Generation periods are only present once Deterministic Finality (feature
  // 25) is activated on the network under test; either shape is valid.
  if (info.currentGenerationPeriod) {
    expect(info.currentGenerationPeriod.start).toBeLessThanOrEqual(
      info.currentGenerationPeriod.end,
    );
    expect(info.nextGenerationPeriod).toBeDefined();
    expect(info.nextGenerationPeriod?.start).toBe(info.currentGenerationPeriod.end + 1);
  }
});
