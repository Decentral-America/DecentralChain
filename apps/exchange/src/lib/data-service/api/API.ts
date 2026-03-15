import { assetStorage } from '../utils/AssetStorage';
import { request } from '../utils/request';
import * as utilsFunctions from '../utils/utils';
import * as addressModule from './address';
import { getAddressByAlias, getAliasesByAddress, getAliasesByIdList } from './aliases/aliases';
import * as assetsApi from './assets/assets';
import * as dataModule from './data';
import { getLastPrice } from './matcher/getLastPrice';
import {
  addSignature,
  clearSignature,
  factory,
  getOrders,
  getOrdersByPair,
  signatureTimeout,
} from './matcher/getOrders';
import { getFeeRates, getSettings } from './matcher/getSettings';
import { get as getOrderBook } from './matcher/orderBook';
import * as matchersApi from './matchers/matchers';
import { height } from './node/node';
import * as pairsModule from './pairs/pairs';
import * as ratingModule from './rating/rating';
import { getAssetsHashFromTx, parseExchangeOrder, parseTx } from './transactions/parse';
import * as transactionsApi from './transactions/transactions';

export const aliases = { getAddressByAlias, getAliasesByAddress, getAliasesByIdList };

export const node = { height };

export const matcher = {
  addSignature,
  clearSignature,
  factory,
  getFeeRates,
  getLastPrice,
  getOrderBook,
  getOrders,
  getOrdersByPair,
  getSettings,
  signatureTimeout,
};

export const matchers = matchersApi;

export const assets = { ...assetsApi };

export const transactions = {
  ...transactionsApi,
  getAssetsHashFromTx,
  parseExchangeOrder,
  parseTx,
};

export const utils = { ...utilsFunctions, assetStorage, request };

export const pairs = {
  ...pairsModule,
};

export const rating = {
  ...ratingModule,
};

export const data = {
  ...dataModule,
};

export const address = addressModule;
