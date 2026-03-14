import { create } from '../../src';
import { type TRewards } from '../../src/api-node/rewards';
import { type TLong } from '../../src/interface';
import { NODE_URL } from '../_state';

const api: ReturnType<typeof create> = create(NODE_URL);

const checkRewards = (blockchainRewards: TRewards<TLong>) => {
  expect(blockchainRewards.currentReward).isStringOrNumber();
  expect(blockchainRewards.totalDccAmount).isStringOrNumber();
  expect(blockchainRewards.minIncrement).isStringOrNumber();
  expect(typeof blockchainRewards.height).toBe('number');
  expect(typeof blockchainRewards.term).toBe('number');
  expect(typeof blockchainRewards.nextCheck).toBe('number');
  expect(typeof blockchainRewards.votingIntervalStart).toBe('number');
  expect(typeof blockchainRewards.votingInterval).toBe('number');
  expect(typeof blockchainRewards.votingInterval).toBe('number');
  expect(typeof blockchainRewards.votingThreshold).toBe('number');
  expect(typeof blockchainRewards.votes.decrease).toBe('number');
  expect(typeof blockchainRewards.votes.increase).toBe('number');
};

it('current blockchain rewards', async () => {
  const blockchainRewards = await api.rewards.fetchRewards();
  checkRewards(blockchainRewards);
});

it('blockchain rewards on height', async () => {
  const { height } = await api.blocks.fetchHeadersLast();
  const blockchainRewards = await api.rewards.fetchRewards(height - 1);
  checkRewards(blockchainRewards);
});
