import { type Maybe } from 'folktale/maybe';
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
  get: Service<SetScriptTxsServiceGetRequest & WithMoneyFormat, Maybe<SetScriptTx>>;
  mget: Service<SetScriptTxsServiceMgetRequest & WithMoneyFormat, Maybe<SetScriptTx>[]>;
  search: Service<SetScriptTxsServiceSearchRequest & WithMoneyFormat, SearchedItems<SetScriptTx>>;
};
