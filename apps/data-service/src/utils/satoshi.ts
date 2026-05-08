import { type BigNumber } from '@decentralchain/data-entities';

export const convertPrice = (aDecimals: number, pDecimals: number, price: BigNumber): BigNumber =>
  price.shiftedBy(-8 + aDecimals - pDecimals);

export const convertAmount = (decimals: number, amount: BigNumber): BigNumber =>
  amount.shiftedBy(-decimals);
