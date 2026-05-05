import { type Maybe } from 'folktale/maybe';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type ReissueTx,
  type ReissueTxsGetRequest,
  type ReissueTxsMgetRequest,
  type ReissueTxsSearchRequest,
} from './repo/types';

type ReissueTxsServiceGetRequest = ServiceGetRequest<ReissueTxsGetRequest>;
type ReissueTxsServiceMgetRequest = ServiceMgetRequest<ReissueTxsMgetRequest>;
type ReissueTxsServiceSearchRequest = ReissueTxsSearchRequest;

export type ReissueTxsService = {
  get: Service<ReissueTxsServiceGetRequest & WithMoneyFormat, Maybe<ReissueTx>>;
  mget: Service<ReissueTxsServiceMgetRequest & WithMoneyFormat, Maybe<ReissueTx>[]>;
  search: Service<ReissueTxsServiceSearchRequest & WithMoneyFormat, SearchedItems<ReissueTx>>;
};
