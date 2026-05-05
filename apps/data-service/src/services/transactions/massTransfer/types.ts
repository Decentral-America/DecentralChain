import { type Option } from 'effect';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type MassTransferTx,
  type MassTransferTxsGetRequest,
  type MassTransferTxsMgetRequest,
  type MassTransferTxsSearchRequest,
} from './repo/types';

type MassTransferTxsServiceGetRequest = ServiceGetRequest<MassTransferTxsGetRequest>;
type MassTransferTxsServiceMgetRequest = ServiceMgetRequest<MassTransferTxsMgetRequest>;
type MassTransferTxsServiceSearchRequest = MassTransferTxsSearchRequest;

export type MassTransferTxsService = {
  get: Service<MassTransferTxsServiceGetRequest & WithMoneyFormat, Option.Option<MassTransferTx>>;
  mget: Service<
    MassTransferTxsServiceMgetRequest & WithMoneyFormat,
    Option.Option<MassTransferTx>[]
  >;
  search: Service<
    MassTransferTxsServiceSearchRequest & WithMoneyFormat,
    SearchedItems<MassTransferTx>
  >;
};
