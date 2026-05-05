import { type Repo } from '../../../../types';
import { type WithLimit, type WithSortOrder } from '../../../_common';
import { type RequestWithCursor } from '../../../_common/pagination';
import { type CommonFilters, type RawTx, type Tx } from '../../_common/types';

export type LeaseCancelTxDbResponse = RawTx & {
  lease_id: string;
};

export type LeaseCancelTx = Tx & {
  leaseId: string;
};

export type LeaseCancelTxsGetRequest = string;

export type LeaseCancelTxsMgetRequest = string[];

export type LeaseCancelTxsSearchRequest = RequestWithCursor<
  CommonFilters & WithSortOrder & WithLimit,
  string
> &
  Partial<{
    recipient: string;
  }>;

export type LeaseCancelTxsRepo = Repo<
  LeaseCancelTxsGetRequest,
  LeaseCancelTxsMgetRequest,
  LeaseCancelTxsSearchRequest,
  LeaseCancelTx
>;
