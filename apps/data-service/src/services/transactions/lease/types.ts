import { type Maybe } from 'folktale/maybe';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type LeaseTx,
  type LeaseTxsGetRequest,
  type LeaseTxsMgetRequest,
  type LeaseTxsSearchRequest,
} from './repo/types';

type LeaseTxsServiceGetRequest = ServiceGetRequest<LeaseTxsGetRequest>;
type LeaseTxsServiceMgetRequest = ServiceMgetRequest<LeaseTxsMgetRequest>;
type LeaseTxsServiceSearchRequest = LeaseTxsSearchRequest & WithMoneyFormat;

export type LeaseTxsService = {
  get: Service<LeaseTxsServiceGetRequest & WithMoneyFormat & WithMoneyFormat, Maybe<LeaseTx>>;
  mget: Service<LeaseTxsServiceMgetRequest & WithMoneyFormat & WithMoneyFormat, Maybe<LeaseTx>[]>;
  search: Service<
    LeaseTxsServiceSearchRequest & WithMoneyFormat & WithMoneyFormat,
    SearchedItems<LeaseTx>
  >;
};
