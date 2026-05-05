import { type Maybe } from 'folktale/maybe';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type LeaseCancelTx,
  type LeaseCancelTxsGetRequest,
  type LeaseCancelTxsMgetRequest,
  type LeaseCancelTxsSearchRequest,
} from './repo/types';

type LeaseCancelTxsServiceGetRequest = ServiceGetRequest<LeaseCancelTxsGetRequest>;
type LeaseCancelTxsServiceMgetRequest = ServiceMgetRequest<LeaseCancelTxsMgetRequest>;
type LeaseCancelTxsServiceSearchRequest = LeaseCancelTxsSearchRequest;

export type LeaseCancelTxsService = {
  get: Service<LeaseCancelTxsServiceGetRequest & WithMoneyFormat, Maybe<LeaseCancelTx>>;
  mget: Service<LeaseCancelTxsServiceMgetRequest & WithMoneyFormat, Maybe<LeaseCancelTx>[]>;
  search: Service<
    LeaseCancelTxsServiceSearchRequest & WithMoneyFormat,
    SearchedItems<LeaseCancelTx>
  >;
};
