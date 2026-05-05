import { type BigNumber } from '@decentralchain/data-entities';
import { type Repo } from '../../../../types';
import { type WithLimit, type WithSortOrder } from '../../../_common';
import { type RequestWithCursor } from '../../../_common/pagination';
import { type CommonFilters, type RawTx, type Tx } from '../../_common/types';

export type TransferTxDbResponse = RawTx & {
  amount: BigNumber;
  asset_id: string;
  fee_asset: string;
  attachment: string;
  recipient: string;
};

export type TransferTx = Tx & {
  amount: BigNumber;
  assetId: string;
  recipient: string;
  attachment: string;
};

export type TransferTxsGetRequest = string;

export type TransferTxsMgetRequest = string[];

export type TransferTxsSearchRequest = RequestWithCursor<
  CommonFilters & WithSortOrder & WithLimit,
  string
> &
  Partial<{
    sender: string;
    assetId: string;
    recipient: string;
  }>;

export type TransferTxsRepo = Repo<
  TransferTxsGetRequest,
  TransferTxsMgetRequest,
  TransferTxsSearchRequest,
  TransferTx
>;
