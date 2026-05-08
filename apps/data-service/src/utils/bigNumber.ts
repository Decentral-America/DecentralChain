import { BigNumber } from '@decentralchain/data-entities';
export const toBigNumber = (x: string | number | BigNumber): BigNumber => new BigNumber(x);
