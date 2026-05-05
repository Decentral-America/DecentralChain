import { type Option } from 'effect';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type EthereumLikeTx,
  type EthereumLikeTxsGetRequest,
  type EthereumLikeTxsMgetRequest,
  type EthereumLikeTxsSearchRequest,
} from './repo/types';

type EthereumLikeTxsServiceGetRequest = ServiceGetRequest<EthereumLikeTxsGetRequest>;
type EthereumLikeTxsServiceMgetRequest = ServiceMgetRequest<EthereumLikeTxsMgetRequest>;
type EthereumLikeTxsServiceSearchRequest = EthereumLikeTxsSearchRequest;

export type EthereumLikeTxsService = {
  get: Service<EthereumLikeTxsServiceGetRequest & WithMoneyFormat, Option.Option<EthereumLikeTx>>;
  mget: Service<
    EthereumLikeTxsServiceMgetRequest & WithMoneyFormat,
    Option.Option<EthereumLikeTx>[]
  >;
  search: Service<
    EthereumLikeTxsServiceSearchRequest & WithMoneyFormat,
    SearchedItems<EthereumLikeTx>
  >;
};
