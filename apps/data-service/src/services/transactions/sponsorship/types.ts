import { type Maybe } from 'folktale/maybe';
import {
  type SearchedItems,
  type Service,
  type ServiceGetRequest,
  type ServiceMgetRequest,
} from '../../../types';
import { type WithMoneyFormat } from '../../types';
import {
  type SponsorshipTx,
  type SponsorshipTxsGetRequest,
  type SponsorshipTxsMgetRequest,
  type SponsorshipTxsSearchRequest,
} from './repo/types';

type SponsorshipTxsServiceGetRequest = ServiceGetRequest<SponsorshipTxsGetRequest>;
type SponsorshipTxsServiceMgetRequest = ServiceMgetRequest<SponsorshipTxsMgetRequest>;
type SponsorshipTxsServiceSearchRequest = SponsorshipTxsSearchRequest;

export type SponsorshipTxsService = {
  get: Service<SponsorshipTxsServiceGetRequest & WithMoneyFormat, Maybe<SponsorshipTx>>;
  mget: Service<SponsorshipTxsServiceMgetRequest & WithMoneyFormat, Maybe<SponsorshipTx>[]>;
  search: Service<
    SponsorshipTxsServiceSearchRequest & WithMoneyFormat,
    SearchedItems<SponsorshipTx>
  >;
};
