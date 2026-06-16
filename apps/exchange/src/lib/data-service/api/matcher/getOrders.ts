import { type Asset, AssetPair, Money } from '@decentralchain/data-entities';
import { DCC_ID } from '@decentralchain/signature-adapter';
import { get as configGet } from '../../config';
import { type IHash, type IMoneyFactory, type IPriceMoneyFactory } from '../../interface';
import { request } from '../../utils/request';
import { Signal } from '../../utils/Signal';
import { coinsMoneyFactory, normalizeAssetId, priceMoneyFactory, toHash } from '../../utils/utils';
import { get as getAsset } from '../assets/assets';
import { type api, type IOrder } from './interface';

let signatureData: ISignatureData | undefined;
let timer: ReturnType<typeof setTimeout> | null = null;
let matcherAuthFailed = false; // Track if matcher authentication has failed

export const factory = {
  money: coinsMoneyFactory,
  price: priceMoneyFactory,
};

export const remapOrder =
  (factory: IFactory) =>
  (assets: IHash<Asset>) =>
  (order: api.IOrder): IOrder => {
    const amountAsset = assets[normalizeAssetId(order.assetPair.amountAsset)] as Asset;
    const priceAsset = assets[normalizeAssetId(order.assetPair.priceAsset)] as Asset;
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
  signatureData = undefined;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export const signatureTimeout: Signal<Record<string, never>> = new Signal();

const fetch = <T>(url: string): Promise<T> => {
  const sig = signatureData;
  if (!sig) return Promise.reject(new Error('No active signature data')) as Promise<T>;
  return request<T>({
    fetchOptions: {
      headers: {
        Signature: sig.signature,
        Timestamp: sig.timestamp,
      },
    },
    url: `${configGet('matcher')}/${url}`,
  }).catch((error) => {
    // Silently handle common matcher authentication errors
    // These are expected and don't need to be logged
    throw error; // Re-throw so caller can handle it
  });
};

export const parse = (list: api.IOrder[]) => {
  const assets = getAssetsFromOrderList(list);
  return getAsset(assets).then((assets) => {
    const hash = toHash(assets, 'id');
    return list.map((order) => matcherOrderRemap(hash)(order));
  });
};

export function getOrders(options?: IGetOrdersOptions): Promise<Array<IOrder>> {
  const sig = signatureData;
  if (!sig) {
    throw new Error('Get orders without signature! Call method "addSignature"!');
  }

  options = options ? options : { isActive: true };
  const activeOnly = options.isActive;

  return fetch<Array<api.IOrder>>(`orderbook/${sig.publicKey}?activeOnly=${activeOnly}`).then(
    parse,
  );
}

export function getOrdersByPair(pair: AssetPair): Promise<Array<IOrder>> {
  const sig = signatureData;
  if (!sig) {
    throw new Error('Get orders without signature! Call method "addSignature"!');
  }
  return fetch<Array<api.IOrder>>(
    `orderbook/${pair.amountAsset.id}/${pair.priceAsset.id}/publicKey/${sig.publicKey}`,
  ).then(parse);
}

export function getReservedBalance(): Promise<IHash<Money>> {
  // If matcher auth previously failed, don't keep trying
  if (matcherAuthFailed) {
    return Promise.resolve(Object.create(null));
  }

  // Check if signature is too old (older than 1 minute means it's likely invalid)
  const now = Date.now();
  const sig = signatureData;
  if (!sig) {
    return Promise.resolve(Object.create(null));
  }
  const signatureAge = now - sig.timestamp;
  if (signatureAge > 60000) {
    // Signature is stale, don't attempt the request
    return Promise.resolve(Object.create(null));
  }

  return fetch<IReservedBalanceApi>(`/balance/reserved/${sig.publicKey}`)
    .then(prepareReservedBalance)
    .catch((error: unknown) => {
      // A 404 means the address has no reserved balance — valid and expected
      // when the user has no open orders. Do NOT set matcherAuthFailed; the
      // balance will appear once the user places an order.
      const isNotFound =
        (typeof error === 'object' &&
          error !== null &&
          ('status' in error
            ? (error as { status?: unknown }).status === 404 ||
              (error as { status?: unknown }).status === 'NotFound'
            : false)) ||
        (typeof error === 'string' && error.includes('404'));

      if (!isNotFound) {
        // Real auth / signature failure — stop retrying until next sign-in.
        matcherAuthFailed = true;
      }

      return Object.create(null);
    });
}

export function prepareReservedBalance(data: IReservedBalanceApi): Promise<IHash<Money>> {
  const assetIdList = Object.keys(data);
  return getAsset(assetIdList).then((assets) => {
    return assets.reduce((acc, asset) => {
      const count = data[asset.id] as string | number;
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
    signatureData = undefined;
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
