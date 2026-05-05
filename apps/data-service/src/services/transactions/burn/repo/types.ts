import { type BigNumber } from '@decentralchain/data-entities';
import { type Repo } from '../../../../types';
import { type WithLimit, type WithSortOrder } from '../../../_common';
import { type RequestWithCursor } from '../../../_common/pagination';
import { type CommonFilters, type RawTx, type Tx } from '../../_common/types';

export type BurnTxDbResponse = RawTx & {
  asset_id: string;
  amount: BigNumber;
};

export type BurnTx = Tx & {
  assetId: string;
  amount: BigNumber;
};

export type BurnTxsGetRequest = string;

export type BurnTxsMgetRequest = string[];

export type BurnTxsSearchRequest = RequestWithCursor<
  CommonFilters &
    WithSortOrder &
    WithLimit &
    Partial<{
      assetId: string;
    }>,
  string
>;

export type BurnTxsRepo = Repo<BurnTxsGetRequest, BurnTxsMgetRequest, BurnTxsSearchRequest, BurnTx>;
