import { type Option } from 'effect';
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
  get: Service<LeaseCancelTxsServiceGetRequest & WithMoneyFormat, Option.Option<LeaseCancelTx>>;
  mget: Service<LeaseCancelTxsServiceMgetRequest & WithMoneyFormat, Option.Option<LeaseCancelTx>[]>;
  search: Service<
    LeaseCancelTxsServiceSearchRequest & WithMoneyFormat,
    SearchedItems<LeaseCancelTx>
  >;
};
