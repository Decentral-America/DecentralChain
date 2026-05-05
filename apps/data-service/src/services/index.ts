import { Effect, pipe } from 'effect';
import { type PgDriver } from '../db/driver';
import { type AppError } from '../errorHandling';
import { type DataServiceConfig } from '../loadConfig';
import { type AssetIdsPair } from '../types';
import { type EmitEvent } from './_common/createResolver/types';
import { validatePairs } from './_common/validation/pairs';
import createAliasesService, { type AliasesService } from './aliases';
import createAliasesRepo from './aliases/repo';
import createAssetsService, { type AssetsService } from './assets';
import createAssetsRepo, { createCache as createAssetsCache } from './assets/repo';
import createCandlesService, { type CandlesService } from './candles';
import createCandlesRepo from './candles/repo';
import { PairOrderingServiceImpl } from './PairOrderingService';
import createPairsService, { type PairsService } from './pairs';
import createPairsRepo, { createCache as createPairsCache } from './pairs/repo';
import createRateService, { RateCacheImpl, type RatesMgetService } from './rates';
import { type RateCache } from './rates/repo';
import RemoteRateRepo from './rates/repo/impl/RemoteRateRepo';
import {
  type IThresholdAssetRateService,
  ThresholdAssetRateService,
} from './rates/ThresholdAssetRateService';
// alias txs
import createAliasTxsService from './transactions/alias';
import createAliasTxsRepo from './transactions/alias/repo';
import { type AliasTxsService } from './transactions/alias/types';
import createAllTxsService, { type AllTxsService } from './transactions/all';
import createAllTxsRepo from './transactions/all/repo';
// burn txs
import createBurnTxsService from './transactions/burn';
import createBurnTxsRepo from './transactions/burn/repo';
import { type BurnTxsService } from './transactions/burn/types';
// data txs
import createDataTxsService from './transactions/data';
import createDataTxsRepo from './transactions/data/repo';
import { type DataTxsService } from './transactions/data/types';
// ethereum-like txs
import createEthereumLikeTxsService from './transactions/ethereumLike';
import createEthereumLikeTxsRepo from './transactions/ethereumLike/repo';
import { type EthereumLikeTxsService } from './transactions/ethereumLike/types';
// exchange txs
import createExchangeTxsService from './transactions/exchange';
import createExchangeTxsRepo from './transactions/exchange/repo';
import { type ExchangeTxsService } from './transactions/exchange/types';
// genesis txs
import createGenesisTxsService from './transactions/genesis';
import createGenesisTxsRepo from './transactions/genesis/repo';
import { type GenesisTxsService } from './transactions/genesis/types';
// invoke script txs
import createInvokeScriptTxsService from './transactions/invokeScript';
import createInvokeScriptTxsRepo from './transactions/invokeScript/repo';
import { type InvokeScriptTxsService } from './transactions/invokeScript/types';
// issue txs
import createIssueTxsService from './transactions/issue';
import createIssueTxsRepo from './transactions/issue/repo';
import { type IssueTxsService } from './transactions/issue/types';
// lease txs
import createLeaseTxsService from './transactions/lease';
import createLeaseTxsRepo from './transactions/lease/repo';
import { type LeaseTxsService } from './transactions/lease/types';
// lease cancel txs
import createLeaseCancelTxsService from './transactions/leaseCancel';
import createLeaseCancelTxsRepo from './transactions/leaseCancel/repo';
import { type LeaseCancelTxsService } from './transactions/leaseCancel/types';
// mass-transfer txs
import createMassTransferTxsService from './transactions/massTransfer';
import createMassTransferTxsRepo from './transactions/massTransfer/repo';
import { type MassTransferTxsService } from './transactions/massTransfer/types';
// payment txs
import createPaymentTxsService from './transactions/payment';
import createPaymentTxsRepo from './transactions/payment/repo';
import { type PaymentTxsService } from './transactions/payment/types';
// reissue txs
import createReissueTxsService from './transactions/reissue';
import createReissueTxsRepo from './transactions/reissue/repo';
import { type ReissueTxsService } from './transactions/reissue/types';
// set asset script txs
import createSetAssetScriptTxsService from './transactions/setAssetScript';
import createSetAssetScriptTxsRepo from './transactions/setAssetScript/repo';
import { type SetAssetScriptTxsService } from './transactions/setAssetScript/types';
// set script txs
import createSetScriptTxsService from './transactions/setScript';
import createSetScriptTxsRepo from './transactions/setScript/repo';
import { type SetScriptTxsService } from './transactions/setScript/types';
// sponsorship txs
import createSponsorshipTxsService from './transactions/sponsorship';
import createSponsorshipTxsRepo from './transactions/sponsorship/repo';
import { type SponsorshipTxsService } from './transactions/sponsorship/types';
// transfer txs
import createTransferTxsService from './transactions/transfer';
import createTransferTxsRepo from './transactions/transfer/repo';
import { type TransferTxsService } from './transactions/transfer/types';
// update asset info txs
import createUpdateAssetInfoTxsService from './transactions/updateAssetInfo';
import createUpdateAssetInfoTxsRepo from './transactions/updateAssetInfo/repo';
import { type UpdateAssetInfoTxsService } from './transactions/updateAssetInfo/types';

type WithEventBus = {
  emitEvent: EmitEvent;
};
export type CommonRepoDependencies = {
  drivers: {
    pg: PgDriver;
  };
} & WithEventBus;

export type RateSerivceCreatorDependencies = WithEventBus & {
  repo: RemoteRateRepo;
  cache: RateCache;
  assets: AssetsService;
  pairs: PairsService;
  pairAcceptanceVolumeThreshold: number;
  thresholdAssetRateService: IThresholdAssetRateService;
  baseAssetId: string;
};

export type ServiceMesh = {
  aliases: AliasesService;
  assets: AssetsService;
  candles: CandlesService;
  matchers: {
    pairs: PairsService;
    candles: CandlesService;
    rates: RatesMgetService;
  };
  pairs: PairsService;
  transactions: {
    all: AllTxsService;
    alias: AliasTxsService;
    burn: BurnTxsService;
    data: DataTxsService;
    exchange: ExchangeTxsService;
    genesis: GenesisTxsService;
    invokeScript: InvokeScriptTxsService;
    issue: IssueTxsService;
    lease: LeaseTxsService;
    leaseCancel: LeaseCancelTxsService;
    massTransfer: MassTransferTxsService;
    payment: PaymentTxsService;
    reissue: ReissueTxsService;
    setAssetScript: SetAssetScriptTxsService;
    setScript: SetScriptTxsService;
    sponsorship: SponsorshipTxsService;
    transfer: TransferTxsService;
    updateAssetInfo: UpdateAssetInfoTxsService;
    ethereumLike: EthereumLikeTxsService;
  };
};

export default ({
  options,
  pgDriver,
  emitEvent,
}: {
  options: DataServiceConfig;
  pgDriver: PgDriver;
  emitEvent: EmitEvent;
}): Effect.Effect<ServiceMesh, AppError> => {
  const matcherConfig: Record<string, string> = {};

  if (options.matcher.settingsURL) {
    matcherConfig[options.matcher.defaultMatcherAddress] = options.matcher.settingsURL;
  }

  // @todo async init whatever is necessary
  return pipe(
    PairOrderingServiceImpl.create(matcherConfig),
    Effect.map((pairOrderingService) => {
      // caches
      const ratesCache = new RateCacheImpl(200000, 60000); // 1 minute
      const pairsCache = createPairsCache(1000, 5000);
      const assetsCache = createAssetsCache(10000, 60000); // 1 minute

      const commonDeps = {
        drivers: {
          pg: pgDriver,
        },
        emitEvent,
      };

      // common init services
      const aliasesRepo = createAliasesRepo(commonDeps);
      const aliases = createAliasesService(aliasesRepo);

      const assetsRepo = createAssetsRepo({
        ...commonDeps,
        cache: assetsCache,
      });
      const assets = createAssetsService(assetsRepo);

      const pairsRepo = createPairsRepo({ ...commonDeps, cache: pairsCache });
      const pairsNoAsyncValidation = createPairsService(
        pairsRepo,
        () => Effect.succeed(undefined),
        assets,
      );
      const pairsWithAsyncValidation = createPairsService(
        pairsRepo,
        (matcher: string, pairs: AssetIdsPair[]) =>
          validatePairs(assets.mget, pairOrderingService)(matcher, pairs),
        assets,
      );

      const thresholdAssetRateService = new ThresholdAssetRateService(
        options.thresholdAssetId,
        options.matcher.defaultMatcherAddress,
        pairsNoAsyncValidation,
        emitEvent('log'),
      );

      const aliasTxsRepo = createAliasTxsRepo(commonDeps);
      const aliasTxs = createAliasTxsService(aliasTxsRepo, assets);
      const burnTxsRepo = createBurnTxsRepo(commonDeps);
      const burnTxs = createBurnTxsService(burnTxsRepo, assets);
      const dataTxsRepo = createDataTxsRepo(commonDeps);
      const dataTxs = createDataTxsService(dataTxsRepo, assets);
      const exchangeTxsRepo = createExchangeTxsRepo(commonDeps);
      const exchangeTxs = createExchangeTxsService(exchangeTxsRepo, assets);
      const genesisTxsRepo = createGenesisTxsRepo(commonDeps);
      const genesisTxs = createGenesisTxsService(genesisTxsRepo, assets);
      const invokeScriptTxsRepo = createInvokeScriptTxsRepo(commonDeps);
      const invokeScriptTxs = createInvokeScriptTxsService(invokeScriptTxsRepo, assets);
      const issueTxsRepo = createIssueTxsRepo(commonDeps);
      const issueTxs = createIssueTxsService(issueTxsRepo, assets);
      const leaseTxsRepo = createLeaseTxsRepo(commonDeps);
      const leaseTxs = createLeaseTxsService(leaseTxsRepo, assets);
      const leaseCancelTxsRepo = createLeaseCancelTxsRepo(commonDeps);
      const leaseCancelTxs = createLeaseCancelTxsService(leaseCancelTxsRepo, assets);
      const massTransferTxsRepo = createMassTransferTxsRepo(commonDeps);
      const massTransferTxs = createMassTransferTxsService(massTransferTxsRepo, assets);
      const paymentTxsRepo = createPaymentTxsRepo(commonDeps);
      const paymentTxs = createPaymentTxsService(paymentTxsRepo, assets);
      const reissueTxsRepo = createReissueTxsRepo(commonDeps);
      const reissueTxs = createReissueTxsService(reissueTxsRepo, assets);
      const setAssetScriptTxsRepo = createSetAssetScriptTxsRepo(commonDeps);
      const setAssetScriptTxs = createSetAssetScriptTxsService(setAssetScriptTxsRepo, assets);
      const setScriptTxsRepo = createSetScriptTxsRepo(commonDeps);
      const setScriptTxs = createSetScriptTxsService(setScriptTxsRepo, assets);
      const sponsorshipTxsRepo = createSponsorshipTxsRepo(commonDeps);
      const sponsorshipTxs = createSponsorshipTxsService(sponsorshipTxsRepo, assets);
      const transferTxsRepo = createTransferTxsRepo(commonDeps);
      const transferTxs = createTransferTxsService(transferTxsRepo, assets);
      const updateAssetInfoRepo = createUpdateAssetInfoTxsRepo(commonDeps);
      const updateAssetInfoTxs = createUpdateAssetInfoTxsService(updateAssetInfoRepo, assets);
      const ethereumLikeRepo = createEthereumLikeTxsRepo(commonDeps);
      const ethereumLikeTxs = createEthereumLikeTxsService(ethereumLikeRepo, assets);

      const rateRepo = new RemoteRateRepo(commonDeps.drivers.pg);

      const rates = createRateService({
        ...commonDeps,
        assets,
        baseAssetId: options.rateBaseAssetId,
        cache: ratesCache,
        pairAcceptanceVolumeThreshold: options.pairAcceptanceVolumeThreshold,
        pairs: pairsNoAsyncValidation,
        repo: rateRepo,
        thresholdAssetRateService: thresholdAssetRateService,
      });

      const candlesRepo = createCandlesRepo(commonDeps);
      const candlesNoAsyncValidation = createCandlesService(
        candlesRepo,
        () => Effect.succeed(undefined),
        assets,
      );
      const candlesWithAsyncValidation = createCandlesService(
        candlesRepo,
        (matcher: string, pairs: AssetIdsPair[]) =>
          validatePairs(assets.mget, pairOrderingService)(matcher, pairs),
        assets,
      );

      // specific init services
      // all txs service
      const allTxsRepo = createAllTxsRepo(commonDeps);
      const allTxs = createAllTxsService(allTxsRepo)({
        1: genesisTxs,
        2: paymentTxs,
        3: issueTxs,
        4: transferTxs,
        5: reissueTxs,
        6: burnTxs,
        7: exchangeTxs,
        8: leaseTxs,
        9: leaseCancelTxs,
        10: aliasTxs,
        11: massTransferTxs,
        12: dataTxs,
        13: setScriptTxs,
        14: sponsorshipTxs,
        15: setAssetScriptTxs,
        16: invokeScriptTxs,
        17: updateAssetInfoTxs,
        18: ethereumLikeTxs,
      });

      return {
        aliases,
        assets,
        candles: candlesNoAsyncValidation,
        matchers: {
          candles: candlesWithAsyncValidation,
          pairs: pairsWithAsyncValidation,
          rates,
        },
        pairs: pairsNoAsyncValidation,
        transactions: {
          alias: aliasTxs,
          all: allTxs,
          burn: burnTxs,
          data: dataTxs,
          ethereumLike: ethereumLikeTxs,
          exchange: exchangeTxs,
          genesis: genesisTxs,
          invokeScript: invokeScriptTxs,
          issue: issueTxs,
          lease: leaseTxs,
          leaseCancel: leaseCancelTxs,
          massTransfer: massTransferTxs,
          payment: paymentTxs,
          reissue: reissueTxs,
          setAssetScript: setAssetScriptTxs,
          setScript: setScriptTxs,
          sponsorship: sponsorshipTxs,
          transfer: transferTxs,
          updateAssetInfo: updateAssetInfoTxs,
        },
      };
    }),
  );
};
