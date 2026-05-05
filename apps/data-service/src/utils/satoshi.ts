// @ts-nocheck
import { type BigNumber } from '@decentralchain/data-entities';
import { curry } from 'ramda';

export const convertPrice: any = curry(
  (aDecimals: number, pDecimals: number, price: BigNumber): BigNumber =>
    price.shiftedBy(-8 + aDecimals - pDecimals),
);

export const convertAmount: any = curry(
  (decimals: number, amount: BigNumber): BigNumber => amount.shiftedBy(-decimals),
);
