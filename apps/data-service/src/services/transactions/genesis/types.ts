import { type Option } from 'effect';
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
  get: Service<GenesisTxsServiceGetRequest & WithMoneyFormat, Option.Option<GenesisTx>>;
  mget: Service<GenesisTxsServiceMgetRequest & WithMoneyFormat, Option.Option<GenesisTx>[]>;
  search: Service<GenesisTxsServiceSearchRequest & WithMoneyFormat, SearchedItems<GenesisTx>>;
};
