import { type Maybe } from 'folktale/maybe';
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
  get: Service<InvokeScriptTxsServiceGetRequest & WithMoneyFormat, Maybe<InvokeScriptTx>>;
  mget: Service<InvokeScriptTxsServiceMgetRequest & WithMoneyFormat, Maybe<InvokeScriptTx>[]>;
  search: Service<
    InvokeScriptTxsServiceSearchRequest & WithMoneyFormat,
    SearchedItems<InvokeScriptTx>
  >;
};
