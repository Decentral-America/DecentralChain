import createGetAliases from './methods/getAliases';
import createGetAssets from './methods/getAssets';
import createGetAssetsByTicker from './methods/getAssetsByTicker';
import createGetCandles from './methods/getCandles';
import createGetExchangeTxs from './methods/getExchangeTxs';
import createGetMassTransferTxs from './methods/getMassTransferTxs';
import createGetPairs from './methods/getPairs';
import createGetTransferTxs from './methods/getTransferTxs';
import defaultTransform from './transform';
import {
  type IGetExchangeTxs,
  type IGetMassTransferTxs,
  type IGetTransferTxs,
  type ILibOptions,
  type TAliases,
  type TGetAssets,
  type TGetAssetsByTicker,
  type TGetCandles,
  type TGetPairs,
} from './types';
import { defaultFetch, defaultParse, isValidUrl } from './utils';

export class DataServiceClient {
  public getPairs: TGetPairs;
  public getAssets: TGetAssets;
  public getAssetsByTicker: TGetAssetsByTicker;
  public getCandles: TGetCandles;
  public getExchangeTxs: IGetExchangeTxs;
  public getTransferTxs: IGetTransferTxs;
  public getMassTransferTxs: IGetMassTransferTxs;
  public aliases: TAliases;

  constructor(params: ILibOptions) {
    const options = { ...params };
    if (!options.rootUrl) {
      throw new Error('No rootUrl was presented in options object. Check constructor call.');
    }
    if (!isValidUrl(options.rootUrl)) {
      throw new Error('Invalid rootUrl: must be an absolute HTTP or HTTPS URL.');
    }
    // Strip trailing slash to prevent double-slash in constructed URLs
    options.rootUrl = options.rootUrl.replace(/\/+$/, '');
    // Add defaults
    options.transform ??= defaultTransform;
    options.fetch ??= defaultFetch;
    options.parse ??= defaultParse;

    // Create methods
    this.getAssets = createGetAssets(options);
    this.getAssetsByTicker = createGetAssetsByTicker(options);
    this.getCandles = createGetCandles(options);
    this.getPairs = createGetPairs(options);
    this.getExchangeTxs = createGetExchangeTxs(options);
    this.getTransferTxs = createGetTransferTxs(options);
    this.getMassTransferTxs = createGetMassTransferTxs(options);
    this.aliases = createGetAliases(options);
  }
}

export * from './types';
export { defaultTransform };
