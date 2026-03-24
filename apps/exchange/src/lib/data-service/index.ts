import * as dccDataEntitiesModule from '@decentralchain/data-entities';
import { AssetPair, type IAssetInfo, Money, OrderPrice } from '@decentralchain/data-entities';
import * as signatureAdapters from '@decentralchain/signature-adapter';
import {
  SIGN_TYPE,
  isValidAddress as utilsIsValidAddress,
} from '@decentralchain/signature-adapter';
import * as apiMethods from './api/API';
import { get as getAssetPair } from './api/pairs/pairs';
import {
  broadcast as broadcastF,
  cancelAllOrdersSend,
  cancelOrderSend,
  createOrderSend,
} from './broadcast/broadcast';
import { DataManager } from './classes/DataManager';
import * as configApi from './config';
import { get } from './config';
import { HttpConnectProvider } from './connect/HttpConnectProvider';
import { PostMessageConnectProvider } from './connect/PostMessageConnectProvider';
import { type TAssetData, type TBigNumberData } from './interface';
import * as sign from './sign';
import { type IUserData } from './sign';
import { toAsset } from './utils/assetUtils';
import { abortDownloading, downloadFile } from './utils/DownloadFile';
import { type IFetchOptions, request } from './utils/request';
import * as utilsModule from './utils/utils';
import { normalizeTime, type TTimeType } from './utils/utils';

export { getAdapterByType, getAvailableList } from '@decentralchain/signature-adapter';
export { Seed } from './classes/Seed';
export * from './store';
export { assetStorage } from './utils/AssetStorage';

export const dccDataEntities = {
  ...dccDataEntitiesModule,
};
export const api = { ...apiMethods };
export const dataManager = new DataManager();
export const config = { ...configApi };
export const utils = { ...utilsModule, abortDownloading, downloadFile };
export const signature = {
  ...sign,
};
export const connect = {
  HttpConnectProvider,
  PostMessageConnectProvider,
};

export const signAdapters = signatureAdapters;
export const isValidAddress = utilsIsValidAddress;

export const broadcast = broadcastF;
export const createOrder = createOrderSend;
export const cancelOrder = cancelOrderSend;
export const cancelAllOrders = cancelAllOrdersSend;

dccDataEntitiesModule.config.set('remapAsset', (data: IAssetInfo) => {
  const name = get('remappedAssetNames')[data.id] || data.name;
  return { ...data, name };
});

export function fetch<T>(url: string, fetchOptions?: IFetchOptions): Promise<T> {
  return request<T>({ fetchOptions, url });
}

export function moneyFromTokens(tokens: TBigNumberData, assetData: TAssetData): Promise<Money> {
  return toAsset(assetData).then((asset) => {
    return dccDataEntities.Money.fromTokens(tokens, asset);
  });
}

export function moneyFromCoins(coins: TBigNumberData, assetData: TAssetData): Promise<Money> {
  return toAsset(assetData).then((asset) => new Money(coins, asset));
}

export function orderPriceFromCoins(coins: TBigNumberData, pair: AssetPair): Promise<OrderPrice>;
export function orderPriceFromCoins(
  coins: TBigNumberData,
  asset1: TAssetData,
  asset2: TAssetData,
): Promise<OrderPrice>;
export function orderPriceFromCoins(
  coins: TBigNumberData,
  pair: AssetPair | TAssetData,
  asset2?: TAssetData,
): Promise<OrderPrice> {
  if (pair instanceof AssetPair) {
    return Promise.resolve(OrderPrice.fromMatcherCoins(coins, pair));
  } else {
    return getAssetPair(pair, asset2).then((pair) => OrderPrice.fromMatcherCoins(coins, pair));
  }
}

export function orderPriceFromTokens(tokens: TBigNumberData, pair: AssetPair): Promise<OrderPrice>;
export function orderPriceFromTokens(
  tokens: TBigNumberData,
  asset1: TAssetData,
  asset2: TAssetData,
): Promise<OrderPrice>;
export function orderPriceFromTokens(
  tokens: TBigNumberData,
  pair: AssetPair | TAssetData,
  asset2?: TAssetData,
): Promise<OrderPrice> {
  if (pair instanceof AssetPair) {
    return Promise.resolve(OrderPrice.fromTokens(tokens, pair));
  } else {
    return getAssetPair(pair, asset2).then((pair) => OrderPrice.fromTokens(tokens, pair));
  }
}

class App {
  public get address(): string {
    return sign.getUserAddress();
  }

  public login(userData: IUserData): void {
    sign.dropSignatureApi();
    sign.setUserData(userData);
    this._initializeDataManager(userData.address);
  }

  public logOut() {
    sign.dropSignatureApi();
    sign.dropUserData();
    dataManager.dropAddress();
  }

  public addMatcherSign(timestamp, signature) {
    const signApi = sign.getSignatureApi();

    if (!signApi) {
      return Promise.reject({ error: 'No exist signature api' });
    }

    return signApi.getPublicKey().then((senderPublicKey) => {
      api.matcher.addSignature(signature, senderPublicKey, timestamp);
    });
  }

  public getTimeStamp(count: number, timeType: TTimeType): number {
    return utilsModule.addTime(normalizeTime(Date.now()), count, timeType).valueOf();
  }

  public getSignIdForMatcher(timestamp): Promise<string> {
    return sign
      .getSignatureApi()
      .makeSignable({
        data: {
          timestamp,
        },
        type: SIGN_TYPE.MATCHER_ORDERS,
      })
      .getId();
  }

  private _initializeDataManager(address: string): void {
    dataManager.dropAddress();
    dataManager.applyAddress(address);
  }
}

export const app = new App();
