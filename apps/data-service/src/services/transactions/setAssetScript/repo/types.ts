import { type Repo } from '../../../../types';
import { type WithLimit, type WithSortOrder } from '../../../_common';
import { type RequestWithCursor } from '../../../_common/pagination';
import { type CommonFilters, type RawTx, type Tx } from '../../_common/types';

export type SetAssetScriptTxDbResponse = RawTx & {
  asset_id: string;
  script: string;
};

export type SetAssetScriptTx = Tx & {
  assetId: string;
  script: string;
};

export type SetAssetScriptTxsGetRequest = string;

export type SetAssetScriptTxsMgetRequest = string[];

export type SetAssetScriptTxsSearchRequest = RequestWithCursor<
  CommonFilters & WithSortOrder & WithLimit,
  string
> &
  Partial<{
    assetId: string;
    script: string;
  }>;

export type SetAssetScriptTxsRepo = Repo<
  SetAssetScriptTxsGetRequest,
  SetAssetScriptTxsMgetRequest,
  SetAssetScriptTxsSearchRequest,
  SetAssetScriptTx
>;
