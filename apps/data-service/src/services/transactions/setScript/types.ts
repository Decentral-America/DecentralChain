import { type Option } from 'effect';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type SetScriptTx,
  type SetScriptTxsGetRequest,
  type SetScriptTxsMgetRequest,
  type SetScriptTxsSearchRequest,
} from './repo/types';

type SetScriptTxsServiceGetRequest = ServiceGetRequest<SetScriptTxsGetRequest>;
type SetScriptTxsServiceMgetRequest = ServiceMgetRequest<SetScriptTxsMgetRequest>;
type SetScriptTxsServiceSearchRequest = SetScriptTxsSearchRequest;

export type SetScriptTxsService = {
  get: Service<SetScriptTxsServiceGetRequest & WithMoneyFormat, Option.Option<SetScriptTx>>;
  mget: Service<SetScriptTxsServiceMgetRequest & WithMoneyFormat, Option.Option<SetScriptTx>[]>;
  search: Service<SetScriptTxsServiceSearchRequest & WithMoneyFormat, SearchedItems<SetScriptTx>>;
};
