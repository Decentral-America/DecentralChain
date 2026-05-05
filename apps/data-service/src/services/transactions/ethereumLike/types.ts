import { type Maybe } from 'folktale/maybe';
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
  get: Service<EthereumLikeTxsServiceGetRequest & WithMoneyFormat, Maybe<EthereumLikeTx>>;
  mget: Service<EthereumLikeTxsServiceMgetRequest & WithMoneyFormat, Maybe<EthereumLikeTx>[]>;
  search: Service<
    EthereumLikeTxsServiceSearchRequest & WithMoneyFormat,
    SearchedItems<EthereumLikeTx>
  >;
};
