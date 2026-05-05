import { type Maybe } from 'folktale/maybe';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type IssueTx,
  type IssueTxsGetRequest,
  type IssueTxsMgetRequest,
  type IssueTxsSearchRequest,
} from './repo/types';

type IssueTxsServiceGetRequest = ServiceGetRequest<IssueTxsGetRequest>;
type IssueTxsServiceMgetRequest = ServiceMgetRequest<IssueTxsMgetRequest>;
type IssueTxsServiceSearchRequest = IssueTxsSearchRequest;

export type IssueTxsService = {
  get: Service<IssueTxsServiceGetRequest & WithMoneyFormat, Maybe<IssueTx>>;
  mget: Service<IssueTxsServiceMgetRequest & WithMoneyFormat, Maybe<IssueTx>[]>;
  search: Service<IssueTxsServiceSearchRequest & WithMoneyFormat, SearchedItems<IssueTx>>;
};
