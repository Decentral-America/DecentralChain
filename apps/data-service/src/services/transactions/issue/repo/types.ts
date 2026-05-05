import { type BigNumber } from '@decentralchain/data-entities';
import { type Repo } from '../../../../types';
import { type WithLimit, type WithSortOrder } from '../../../_common';
import { type RequestWithCursor } from '../../../_common/pagination';
import { type CommonFilters, type RawTx, type Tx } from '../../_common/types';

export type IssueTxDbResponse = RawTx & {
  asset_id: string;
  asset_name: string;
  description: string;
  quantity: BigNumber;
  decimals: number;
  reissuable: boolean;
  script: string;
};

export type IssueTx = Tx & {
  assetId: string;
  name: string;
  description: string;
  quantity: BigNumber;
  decimals: number;
  reissuable: boolean;
  script: string;
};

export type IssueTxsGetRequest = string;

export type IssueTxsMgetRequest = string[];

export type IssueTxsSearchRequest = RequestWithCursor<
  CommonFilters & WithSortOrder & WithLimit,
  string
> &
  Partial<{
    assetId: string;
    script: string;
  }>;

export type IssueTxsRepo = Repo<
  IssueTxsGetRequest,
  IssueTxsMgetRequest,
  IssueTxsSearchRequest,
  IssueTx
>;
