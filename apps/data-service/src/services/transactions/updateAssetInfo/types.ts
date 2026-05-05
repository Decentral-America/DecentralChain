import { type Option } from 'effect';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type UpdateAssetInfoTx,
  type UpdateAssetInfoTxsGetRequest,
  type UpdateAssetInfoTxsMgetRequest,
  type UpdateAssetInfoTxsSearchRequest,
} from './repo/types';

type UpdateAssetInfoTxsServiceGetRequest = ServiceGetRequest<UpdateAssetInfoTxsGetRequest>;
type UpdateAssetInfoTxsServiceMgetRequest = ServiceMgetRequest<UpdateAssetInfoTxsMgetRequest>;
type UpdateAssetInfoTxsServiceSearchRequest = UpdateAssetInfoTxsSearchRequest;

export type UpdateAssetInfoTxsService = {
  get: Service<
    UpdateAssetInfoTxsServiceGetRequest & WithMoneyFormat,
    Option.Option<UpdateAssetInfoTx>
  >;
  mget: Service<
    UpdateAssetInfoTxsServiceMgetRequest & WithMoneyFormat,
    Option.Option<UpdateAssetInfoTx>[]
  >;
  search: Service<
    UpdateAssetInfoTxsServiceSearchRequest & WithMoneyFormat,
    SearchedItems<UpdateAssetInfoTx>
  >;
};
