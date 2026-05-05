import { type Option } from 'effect';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type AliasTx,
  type AliasTxsGetRequest,
  type AliasTxsMgetRequest,
  type AliasTxsSearchRequest,
} from './repo/types';

type AliasTxsServiceGetRequest = ServiceGetRequest<AliasTxsGetRequest>;
type AliasTxsServiceMgetRequest = ServiceMgetRequest<AliasTxsMgetRequest>;
type AliasTxsServiceSearchRequest = AliasTxsSearchRequest;

export type AliasTxsService = {
  get: Service<AliasTxsServiceGetRequest & WithMoneyFormat, Option.Option<AliasTx>>;
  mget: Service<AliasTxsServiceMgetRequest & WithMoneyFormat, Option.Option<AliasTx>[]>;
  search: Service<AliasTxsServiceSearchRequest & WithMoneyFormat, SearchedItems<AliasTx>>;
};
