import { type Asset, AssetPair, Money } from '@decentralchain/data-entities';
import { DCC_ID } from '@decentralchain/signature-adapter';
import { Signal } from 'ts-utils';
import { get as configGet } from '../../config';
import { type IHash, type IMoneyFactory, type IPriceMoneyFactory } from '../../interface';
import { request } from '../../utils/request';
import { coinsMoneyFactory, normalizeAssetId, priceMoneyFactory, toHash } from '../../utils/utils';
import { get as getAsset } from '../assets/assets';
import { type api, type IOrder } from './interface';

let signatureData: ISignatureData;
let timer = null;
let matcherAuthFailed = false; // Track if matcher authentication has failed

export const factory = {
  money: coinsMoneyFactory,
  price: priceMoneyFactory,
};

export const remapOrder =
  (factory: IFactory) =>
  (assets: IHash<Asset>) =>
  (order: api.IOrder): IOrder => {
    const amountAsset = assets[normalizeAssetId(order.assetPair.amountAsset)];
    const priceAsset = assets[normalizeAssetId(order.assetPair.priceAsset)];
    const assetPair = new AssetPair(amountAsset, priceAsset);
    const amount = factory.money(order.amount, amountAsset);
    const price = factory.price(order.price, assetPair);
    const filled = factory.money(order.filled, amountAsset);
    const total = Money.fromTokens(amount.getTokens().mul(price.getTokens()), priceAsset);
    const progress = Number(filled.getTokens().div(amount.getTokens()).toFixed());
    const timestamp = new Date(order.timestamp);
    const isActive = order.status === 'Accepted' || order.status === 'PartiallyFilled';
    return { ...order, amount, assetPair, filled, isActive, price, progress, timestamp, total };
  };

export const matcherOrderRemap = remapOrder(factory);

export function addSignature(signature: string, publicKey: string, timestamp: number): void {
  matcherAuthFailed = false; // Reset the failed flag when new signature is added
  addTimer({
    publicKey,
    signature,
    timestamp: timestamp,
  });
}

export function hasSignature(): boolean {
  return !!signatureData;
}

export function clearSignature() {
  signatureData = null;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export const signatureTimeout: Signal<Record<string, never>> = new Signal();

const fetch = <T>(url: string): Promise<T> => {
  return request<T>({
    fetchOptions: {
      headers: {
        Signature: signatureData.signature,
        Timestamp: signatureData.timestamp,
      },
    },
    url: `${configGet('matcher')}/${url}`,
  }).catch((error) => {
    // Silently handle common matcher authentication errors
    // These are expected and don't need to be logged
    throw error; // Re-throw so caller can handle it
  });
};

export const parse = (list) => {
  const assets = getAssetsFromOrderList(list);
  return getAsset(assets).then((assets) => {
    const hash = toHash(assets, 'id');
    return list.map((order) => matcherOrderRemap(hash)(order));
  });
};

export function getOrders(options?: IGetOrdersOptions): Promise<Array<IOrder>> {
  if (!signatureData) {
    throw new Error('Get orders without signature! Call method "addSignature"!');
  }

  options = options ? options : { isActive: true };
  const activeOnly = options.isActive;

  return fetch<Array<api.IOrder>>(
    `orderbook/${signatureData.publicKey}?activeOnly=${activeOnly}`,
  ).then(parse);
}

export function getOrdersByPair(pair: AssetPair): Promise<Array<IOrder>> {
  if (!signatureData) {
    throw new Error('Get orders without signature! Call method "addSignature"!');
  }
  return fetch<Array<api.IOrder>>(
    `orderbook/${pair.amountAsset.id}/${pair.priceAsset.id}/publicKey/${signatureData.publicKey}`,
  ).then(parse);
}

export function getReservedBalance(): Promise<IHash<Money>> {
  // If matcher auth previously failed, don't keep trying
  if (matcherAuthFailed) {
    return Promise.resolve(Object.create(null));
  }

  if (!signatureData) {
    // Return empty object - user hasn't authenticated with matcher
    return Promise.resolve(Object.create(null));
  }

  // Check if signature is too old (older than 1 minute means it's likely invalid)
  const now = Date.now();
  const signatureAge = now - signatureData.timestamp;
  if (signatureAge > 60000) {
    // Signature is stale, don't attempt the request
    return Promise.resolve(Object.create(null));
  }

  return fetch<IReservedBalanceApi>(`/balance/reserved/${signatureData.publicKey}`)
    .then(prepareReservedBalance)
    .catch((_error) => {
      // Mark matcher auth as failed to prevent repeated requests
      matcherAuthFailed = true;

      // Silently handle matcher errors - these are expected when:
      // - User has no DEX orders
      // - Matcher signature is invalid/expired
      // - User hasn't authenticated with matcher
      // Return empty object to prevent poll failures
      return Object.create(null);
    });
}

export function prepareReservedBalance(data: IReservedBalanceApi): Promise<IHash<Money>> {
  const assetIdList = Object.keys(data);
  return getAsset(assetIdList).then((assets) => {
    return assets.reduce((acc, asset) => {
      const count = data[asset.id];
      acc[asset.id] = new Money(count, asset);
      return acc;
    }, Object.create(null));
  });
}

function getAssetsFromOrderList(orders: Array<api.IOrder>): Array<string> {
  const hash = Object.create(null);
  hash[DCC_ID] = true;
  return Object.keys(orders.reduce(getAssetsFromOrder, hash));
}

function getAssetsFromOrder(assets: IHash<boolean>, order: api.IOrder) {
  assets[normalizeAssetId(order.assetPair.amountAsset)] = true;
  assets[normalizeAssetId(order.assetPair.priceAsset)] = true;
  return assets;
}

function addTimer(sign: ISignatureData): void {
  clearSignature();
  timer = setTimeout(() => {
    signatureData = null;
    signatureTimeout.dispatch({});
  }, sign.timestamp - Date.now());
  signatureData = sign;
}

export interface IFactory {
  price: IPriceMoneyFactory;
  money: IMoneyFactory;
}

interface ISignatureData {
  publicKey: string;
  timestamp: number;
  signature: string;
}

interface IGetOrdersOptions {
  isActive?: boolean;
}

export interface IReservedBalanceApi {
  [key: string]: string | number;
}
