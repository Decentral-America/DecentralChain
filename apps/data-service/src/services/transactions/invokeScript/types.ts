import { type Option } from 'effect';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type InvokeScriptTx,
  type InvokeScriptTxsGetRequest,
  type InvokeScriptTxsMgetRequest,
  type InvokeScriptTxsSearchRequest,
} from './repo/types';

type InvokeScriptTxsServiceGetRequest = ServiceGetRequest<InvokeScriptTxsGetRequest>;
type InvokeScriptTxsServiceMgetRequest = ServiceMgetRequest<InvokeScriptTxsMgetRequest>;
type InvokeScriptTxsServiceSearchRequest = InvokeScriptTxsSearchRequest;

export type InvokeScriptTxsService = {
  get: Service<InvokeScriptTxsServiceGetRequest & WithMoneyFormat, Option.Option<InvokeScriptTx>>;
  mget: Service<
    InvokeScriptTxsServiceMgetRequest & WithMoneyFormat,
    Option.Option<InvokeScriptTx>[]
  >;
  search: Service<
    InvokeScriptTxsServiceSearchRequest & WithMoneyFormat,
    SearchedItems<InvokeScriptTx>
  >;
};
