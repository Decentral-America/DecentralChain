import { create } from '../../src';
import { NODE_URL, STATE } from '../_state';

const api: ReturnType<typeof create> = create(NODE_URL);

// The entire /consensus REST API was removed by node-scala's
// "Remove /consensus route (REST API) (#3557)" (commit d0388ebdaa). fetchGeneratingBalance and
// fetchBasetarget now proxy to real, current routes (GET /addresses/balance/details/{address}
// and GET /blocks/headers/last respectively) and are still expected to succeed here.
// fetchConsensusAlgo has no replacement and is expected to reject — see below.

it('Generating balance', async () => {
  const info = await api.consensus.fetchGeneratingBalance(STATE.ACCOUNTS.SIMPLE.address);
  expect(info.address).toBe(STATE.ACCOUNTS.SIMPLE.address);
  expect(typeof info.balance).toBe('number');
});

it('Basetarget', async () => {
  const info = await api.consensus.fetchBasetarget();
  expect(typeof info.baseTarget).toBe('number');
});

it('Consensus algo — deprecated, no replacement, rejects without calling the node', async () => {
  await expect(api.consensus.fetchConsensusAlgo()).rejects.toThrow(/d0388ebdaa/);
});
