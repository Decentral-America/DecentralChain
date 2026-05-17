import { type TLong } from '../../interface';
import request from '../../tools/request';
import { pathSegment } from '../../tools/utils';

/**
 * GET /blockchain/rewards
 * Current reward status
 */
export function fetchRewards(
  base: string,
  height?: number,
  options: RequestInit = {},
): Promise<TRewards<TLong>> {
  return request({
    base,
    options,
    url: height ? `/blockchain/rewards/${pathSegment(height)}` : '/blockchain/rewards',
  });
}

export interface TRewards<LONG> {
  height: number;
  totalDccAmount: LONG;
  currentReward: LONG;
  minIncrement: LONG;
  term: number;
  nextCheck: number;
  votingIntervalStart: number;
  votingInterval: number;
  votingThreshold: number;
  votes: {
    increase: number;
    decrease: number;
  };
}
