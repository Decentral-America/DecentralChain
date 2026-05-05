import { type Maybe } from 'folktale/maybe';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type BurnTx,
  type BurnTxsGetRequest,
  type BurnTxsMgetRequest,
  type BurnTxsSearchRequest,
} from './repo/types';

type BurnTxsServiceGetRequest = ServiceGetRequest<BurnTxsGetRequest>;
type BurnTxsServiceMgetRequest = ServiceMgetRequest<BurnTxsMgetRequest>;
type BurnTxsServiceSearchRequest = BurnTxsSearchRequest;

export type BurnTxsService = {
  get: Service<BurnTxsServiceGetRequest & WithMoneyFormat, Maybe<BurnTx>>;
  mget: Service<BurnTxsServiceMgetRequest & WithMoneyFormat, Maybe<BurnTx>[]>;
  search: Service<BurnTxsServiceSearchRequest & WithMoneyFormat, SearchedItems<BurnTx>>;
};
