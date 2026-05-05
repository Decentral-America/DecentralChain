import { type Maybe } from 'folktale/maybe';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type DataTx,
  type DataTxsGetRequest,
  type DataTxsMgetRequest,
  type DataTxsSearchRequest,
} from './repo/types';

type DataTxsServiceGetRequest = ServiceGetRequest<DataTxsGetRequest>;
export type DataTxsServiceMgetRequest = ServiceMgetRequest<DataTxsMgetRequest>;
export type DataTxsServiceSearchRequest = DataTxsSearchRequest;

export type DataTxsService = {
  get: Service<DataTxsServiceGetRequest & WithMoneyFormat, Maybe<DataTx>>;
  mget: Service<DataTxsServiceMgetRequest & WithMoneyFormat, Maybe<DataTx>[]>;
  search: Service<DataTxsServiceSearchRequest & WithMoneyFormat, SearchedItems<DataTx>>;
};
