import { type Option } from 'effect';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type ExchangeTx,
  type ExchangeTxsGetRequest,
  type ExchangeTxsMgetRequest,
  type ExchangeTxsSearchRequest,
} from './repo/types';

type ExchangeTxsServiceGetRequest = ServiceGetRequest<ExchangeTxsGetRequest>;
type ExchangeTxsServiceMgetRequest = ServiceMgetRequest<ExchangeTxsMgetRequest>;
type ExchangeTxsServiceSearchRequest = ExchangeTxsSearchRequest;

export type ExchangeTxsService = {
  get: Service<ExchangeTxsServiceGetRequest & WithMoneyFormat, Option.Option<ExchangeTx>>;
  mget: Service<ExchangeTxsServiceMgetRequest & WithMoneyFormat, Option.Option<ExchangeTx>[]>;
  search: Service<ExchangeTxsServiceSearchRequest & WithMoneyFormat, SearchedItems<ExchangeTx>>;
};
