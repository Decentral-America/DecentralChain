import { type Option } from 'effect';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type TransferTx,
  type TransferTxsGetRequest,
  type TransferTxsMgetRequest,
  type TransferTxsSearchRequest,
} from './repo/types';

type TransferTxsServiceGetRequest = ServiceGetRequest<TransferTxsGetRequest>;
type TransferTxsServiceMgetRequest = ServiceMgetRequest<TransferTxsMgetRequest>;
type TransferTxsServiceSearchRequest = TransferTxsSearchRequest;

export type TransferTxsService = {
  get: Service<TransferTxsServiceGetRequest & WithMoneyFormat, Option.Option<TransferTx>>;
  mget: Service<TransferTxsServiceMgetRequest & WithMoneyFormat, Option.Option<TransferTx>[]>;
  search: Service<TransferTxsServiceSearchRequest & WithMoneyFormat, SearchedItems<TransferTx>>;
};
