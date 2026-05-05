import { type Option } from 'effect';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type PaymentTx,
  type PaymentTxsGetRequest,
  type PaymentTxsMgetRequest,
  type PaymentTxsSearchRequest,
} from './repo/types';

type PaymentTxsServiceGetRequest = ServiceGetRequest<PaymentTxsGetRequest>;
type PaymentTxsServiceMgetRequest = ServiceMgetRequest<PaymentTxsMgetRequest>;
type PaymentTxsServiceSearchRequest = PaymentTxsSearchRequest;

export type PaymentTxsService = {
  get: Service<PaymentTxsServiceGetRequest & WithMoneyFormat, Option.Option<PaymentTx>>;
  mget: Service<PaymentTxsServiceMgetRequest & WithMoneyFormat, Option.Option<PaymentTx>[]>;
  search: Service<PaymentTxsServiceSearchRequest & WithMoneyFormat, SearchedItems<PaymentTx>>;
};
