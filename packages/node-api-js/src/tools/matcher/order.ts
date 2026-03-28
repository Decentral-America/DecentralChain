import { type ExchangeTransactionOrder } from '@decentralchain/ts-types';
import request from '../request';
import stringify from '../stringify';

export type TMatcherOrder = ExchangeTransactionOrder & {
  senderPublicKey: string;
  proofs: string[];
};

export type TCancelOrder = {
  orderId: string;
  sender?: string;
  senderPublicKey?: string;
  proofs?: string[];
  signature?: string;
};

export interface ISubmitOrderOptions {
  market?: boolean;
}

export function submitOrder(
  base: string,
  ord: TMatcherOrder,
  options: ISubmitOrderOptions = {},
): Promise<unknown> {
  const endpoint = options.market ? 'matcher/orderbook/market' : 'matcher/orderbook';

  return request({
    base,
    options: {
      body: stringify(ord),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
    url: endpoint,
  });
}

export function cancelSubmittedOrder(
  base: string,
  co: TCancelOrder,
  amountAsset: string | null,
  priceAsset: string | null,
): Promise<unknown> {
  const endpoint = `matcher/orderbook/${amountAsset ?? 'WAVES'}/${priceAsset ?? 'WAVES'}/cancel`;

  return request({
    base,
    options: {
      body: stringify(co),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
    url: endpoint,
  });
}
