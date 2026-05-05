import { type Maybe } from 'folktale/maybe';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type GenesisTx,
  type GenesisTxsGetRequest,
  type GenesisTxsMgetRequest,
  type GenesisTxsSearchRequest,
} from './repo/types';

type GenesisTxsServiceGetRequest = ServiceGetRequest<GenesisTxsGetRequest>;
type GenesisTxsServiceMgetRequest = ServiceMgetRequest<GenesisTxsMgetRequest>;
type GenesisTxsServiceSearchRequest = GenesisTxsSearchRequest;

export type GenesisTxsService = {
  get: Service<GenesisTxsServiceGetRequest & WithMoneyFormat, Maybe<GenesisTx>>;
  mget: Service<GenesisTxsServiceMgetRequest & WithMoneyFormat, Maybe<GenesisTx>[]>;
  search: Service<GenesisTxsServiceSearchRequest & WithMoneyFormat, SearchedItems<GenesisTx>>;
};
