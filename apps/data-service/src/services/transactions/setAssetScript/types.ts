import { type Option } from 'effect';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type SetAssetScriptTx,
  type SetAssetScriptTxsGetRequest,
  type SetAssetScriptTxsMgetRequest,
  type SetAssetScriptTxsSearchRequest,
} from './repo/types';

type SetAssetScriptTxsServiceGetRequest = ServiceGetRequest<SetAssetScriptTxsGetRequest>;
type SetAssetScriptTxsServiceMgetRequest = ServiceMgetRequest<SetAssetScriptTxsMgetRequest>;
type SetAssetScriptTxsServiceSearchRequest = SetAssetScriptTxsSearchRequest;

export type SetAssetScriptTxsService = {
  get: Service<
    SetAssetScriptTxsServiceGetRequest & WithMoneyFormat,
    Option.Option<SetAssetScriptTx>
  >;
  mget: Service<
    SetAssetScriptTxsServiceMgetRequest & WithMoneyFormat,
    Option.Option<SetAssetScriptTx>[]
  >;
  search: Service<
    SetAssetScriptTxsServiceSearchRequest & WithMoneyFormat,
    SearchedItems<SetAssetScriptTx>
  >;
};
