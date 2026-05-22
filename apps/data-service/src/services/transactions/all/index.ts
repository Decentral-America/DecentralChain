import { type BigNumber } from '@decentralchain/data-entities';
import { Effect, Option, pipe } from 'effect';
import { groupBy, indexBy, sort, toPairs } from 'ramda';

import { type AppError } from '../../../errorHandling';
import {
  type CommonTransactionInfo,
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
  type TransactionInfo,
} from '../../../types';
import { collect } from '../../../utils/collection';
import { SortOrder } from '../../_common';
import { type WithMoneyFormat } from '../../types';
import { type AliasTxsService } from '../alias/types';
import { type BurnTxsService } from '../burn/types';
import { type DataTxsService } from '../data/types';
import { type EthereumLikeTxsService } from '../ethereumLike/types';
import { type ExchangeTxsService } from '../exchange/types';
import { type GenesisTxsService } from '../genesis/types';
import { type InvokeScriptTxsService } from '../invokeScript/types';
import { type IssueTxsService } from '../issue/types';
import { type LeaseTxsService } from '../lease/types';
import { type LeaseCancelTxsService } from '../leaseCancel/types';
import { type MassTransferTxsService } from '../massTransfer/types';
import { type PaymentTxsService } from '../payment/types';
import { type ReissueTxsService } from '../reissue/types';
import { type SetAssetScriptTxsService } from '../setAssetScript/types';
import { type SetScriptTxsService } from '../setScript/types';
import { type SponsorshipTxsService } from '../sponsorship/types';
import { type TransferTxsService } from '../transfer/types';
import { type UpdateAssetInfoTxsService } from '../updateAssetInfo/types';
import {
  type AllTxsGetRequest,
  type AllTxsMgetRequest,
  type AllTxsRepo,
  type AllTxsSearchRequest,
} from './repo/types';

type AllTxsServiceDep = {
  1: GenesisTxsService;
  2: PaymentTxsService;
  3: IssueTxsService;
  4: TransferTxsService;
  5: ReissueTxsService;
  6: BurnTxsService;
  7: ExchangeTxsService;
  8: LeaseTxsService;
  9: LeaseCancelTxsService;
  10: AliasTxsService;
  11: MassTransferTxsService;
  12: DataTxsService;
  13: SetScriptTxsService;
  14: SponsorshipTxsService;
  15: SetAssetScriptTxsService;
  16: InvokeScriptTxsService;
  17: UpdateAssetInfoTxsService;
  18: EthereumLikeTxsService;
};

export type AllTxsServiceGetRequest = ServiceGetRequest<AllTxsGetRequest>;
export type AllTxsServiceMgetRequest = ServiceMgetRequest<AllTxsMgetRequest>;
export type AllTxsServiceSearchRequest = AllTxsSearchRequest;

export type AllTxsService = {
  get: Service<AllTxsServiceGetRequest & WithMoneyFormat, Option.Option<TransactionInfo>>;
  mget: Service<AllTxsServiceMgetRequest & WithMoneyFormat, Option.Option<TransactionInfo>[]>;
  search: Service<AllTxsServiceSearchRequest & WithMoneyFormat, SearchedItems<TransactionInfo>>;
};

export default (repo: AllTxsRepo) =>
  (txsServices: AllTxsServiceDep): AllTxsService => ({
    get: (req) =>
      pipe(
        repo.get(req.id),
        Effect.flatMap((m) =>
          Option.isSome(m)
            ? txsServices[m.value.type as keyof AllTxsServiceDep].get({
                id: m.value.id,
                moneyFormat: req.moneyFormat,
              })
            : Effect.succeed(Option.none()),
        ),
      ),

    mget: (req) =>
      pipe(
        repo.mget(req.ids),
        Effect.flatMap((txsList: Option.Option<TransactionInfo>[]) =>
          Effect.all(
            txsList.map((m) =>
              Option.isSome(m)
                ? txsServices[m.value.type as keyof AllTxsServiceDep].get({
                    id: m.value.id,
                    moneyFormat: req.moneyFormat,
                  })
                : Effect.succeed(Option.none<TransactionInfo>()),
            ),
          ),
        ),
      ),

    search: (req) =>
      pipe(
        repo.search(req),
        Effect.flatMap((txsList: SearchedItems<CommonTransactionInfo>) => {
          const grouped = groupBy((t: CommonTransactionInfo) => String(t.type), txsList.items);
          const tuples = toPairs(grouped);
          const tasks = tuples.map(([type, txs]) =>
            txsServices[type as unknown as keyof AllTxsServiceDep].mget({
              ids: (txs as CommonTransactionInfo[]).map((t) => t.id),
              moneyFormat: req.moneyFormat,
            }),
          );
          return pipe(
            Effect.all(tasks),
            Effect.map((mss: Option.Option<TransactionInfo>[][]) => {
              const allOptions = mss.flat();
              const txs = collect((m: Option.Option<TransactionInfo>) =>
                Option.isSome(m) ? m.value : undefined,
              )(allOptions);

              const s = indexBy((tx) => `${tx.id}:${tx.timestamp.valueOf()}`, txsList.items);
              return sort((a, b) => {
                const aTxUid = s[`${a.id}:${a.timestamp.valueOf()}`]?.txUid;
                const bTxUid = s[`${b.id}:${b.timestamp.valueOf()}`]?.txUid;
                return req.sort === SortOrder.Ascending
                  ? (aTxUid as BigNumber).minus(bTxUid as BigNumber).toNumber()
                  : (bTxUid as BigNumber).minus(aTxUid as BigNumber).toNumber();
              }, txs);
            }),
            Effect.map((txs) => ({ ...txsList, items: txs }) as SearchedItems<TransactionInfo>),
          );
        }),
      ) as Effect.Effect<SearchedItems<TransactionInfo>, AppError, never>,
  });
