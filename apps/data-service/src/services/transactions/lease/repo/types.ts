import { type BigNumber } from '@decentralchain/data-entities';
import { type Repo } from '../../../../types';
import { type WithLimit, type WithSortOrder } from '../../../_common';
import { type RequestWithCursor } from '../../../_common/pagination';
import { type CommonFilters, type RawTx, type Tx } from '../../_common/types';

export type LeaseTxDbResponse = RawTx & {
  amount: BigNumber;
  recipient: string;
};

export type LeaseTx = Tx & {
  amount: BigNumber;
  recipient: string;
};

export type LeaseTxsGetRequest = string;

export type LeaseTxsMgetRequest = string[];

export type LeaseTxsSearchRequest = RequestWithCursor<
  CommonFilters & WithSortOrder & WithLimit,
  string
> &
  Partial<{
    recipient: string;
  }>;

export type LeaseTxsRepo = Repo<
  LeaseTxsGetRequest,
  LeaseTxsMgetRequest,
  LeaseTxsSearchRequest,
  LeaseTx
>;
