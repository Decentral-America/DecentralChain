import { type BigNumber } from '@decentralchain/data-entities';
import { type Repo } from '../../../../types';
import { type WithLimit, type WithSortOrder } from '../../../_common';
import { type RequestWithCursor } from '../../../_common/pagination';
import { type CommonFilters, type RawTx, type Tx } from '../../_common/types';

export type ReissueTxDbResponse = RawTx & {
  asset_id: string;
  quantity: string;
  reissuable: string;
};

export type ReissueTx = Tx & {
  assetId: string;
  quantity: BigNumber;
  reissuable: string;
};

export type ReissueTxsGetRequest = string;

export type ReissueTxsMgetRequest = string[];

export type ReissueTxsSearchRequest = RequestWithCursor<
  CommonFilters & WithSortOrder & WithLimit,
  string
> &
  Partial<{
    assetId: string;
  }>;

export type ReissueTxsRepo = Repo<
  ReissueTxsGetRequest,
  ReissueTxsMgetRequest,
  ReissueTxsSearchRequest,
  ReissueTx
>;
