import { type Task, of as taskOf, waitAll } from 'folktale/concurrency/task';
import { empty as emptyOf, type Maybe } from 'folktale/maybe';
import { flatten, groupBy, indexBy, pipe, sort, toPairs } from 'ramda';

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
  get: Service<AllTxsServiceGetRequest & WithMoneyFormat, Maybe<TransactionInfo>>;
  mget: Service<AllTxsServiceMgetRequest & WithMoneyFormat, Maybe<TransactionInfo>[]>;
  search: Service<AllTxsServiceSearchRequest & WithMoneyFormat, SearchedItems<TransactionInfo>>;
};

// @todo
// request by (id, timestamp) instead of just id
// to ensure correct tx response even if
// id is duplicated (happens in payment, alias txs)
export default (repo: AllTxsRepo) =>
  (txsServices: AllTxsServiceDep): AllTxsService => ({
    get: (req) =>
      repo
        .get(req.id) //Task tx
        .chain((m) =>
          m.matchWith({
            Just: ({ value }) => {
              return txsServices[value.type as keyof AllTxsServiceDep].get({
                id: value.id,
                moneyFormat: req.moneyFormat,
              });
            },
            Nothing: () => taskOf(emptyOf()),
          }),
        ),

    mget: (req) =>
      repo
        .mget(req.ids) // Task tx[]. tx can have data: null
        .chain((txsList: Maybe<TransactionInfo>[]) =>
          waitAll(
            txsList.map((m) =>
              m.matchWith({
                Just: ({ value }) => {
                  return txsServices[value.type as keyof AllTxsServiceDep].get({
                    id: value.id,
                    moneyFormat: req.moneyFormat,
                  });
                },
                Nothing: () => taskOf(emptyOf()),
              }),
            ),
          ),
        ),

    search: (req) =>
      repo.search(req).chain((txsList: SearchedItems<CommonTransactionInfo>) =>
        waitAll<AppError, Maybe<TransactionInfo>[]>(
          pipe<
            CommonTransactionInfo[],
            Record<string, CommonTransactionInfo[]>,
            [string, CommonTransactionInfo[]][],
            Task<AppError, Maybe<TransactionInfo>[]>[]
          >(
            groupBy((t) => String(t.type)),
            toPairs,
            (tuples) =>
              tuples.map(([type, txs]) => {
                return txsServices[type as unknown as keyof AllTxsServiceDep].mget({
                  ids: txs.map((t) => t.id),
                  moneyFormat: req.moneyFormat,
                });
              }),
          )(txsList.items),
        )
          .map((mss) => flatten<Maybe<TransactionInfo>>(mss))
          .map(collect((m) => m.getOrElse(undefined)))
          .map((txs) => {
            const s = indexBy((tx) => `${tx.id}:${tx.timestamp.valueOf()}`, txsList.items);
            return sort((a, b) => {
              const aTxUid = s[`${a.id}:${a.timestamp.valueOf()}`]['txUid'];
              const bTxUid = s[`${b.id}:${b.timestamp.valueOf()}`]['txUid'];
              return req.sort === SortOrder.Ascending
                ? aTxUid.minus(bTxUid).toNumber()
                : bTxUid.minus(aTxUid).toNumber();
            }, txs);
          })
          .map((txs) => ({
            ...txsList,
            items: txs,
          })),
      ),
  });
