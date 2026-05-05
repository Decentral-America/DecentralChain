import { type BigNumber } from '@decentralchain/data-entities';
import { type Repo } from '../../../../types';
import { type WithLimit, type WithSortOrder } from '../../../_common';
import { type RequestWithCursor } from '../../../_common/pagination';
import { type CommonFilters, type RawTx, type Tx } from '../../_common/types';

export type PaymentTxDbResponse = RawTx & {
  amount: string;
  recipient: string;
};

export type PaymentTx = Tx & {
  amount: BigNumber;
  recipient: string;
};

export type PaymentTxsGetRequest = string;

export type PaymentTxsMgetRequest = string[];

export type PaymentTxsSearchRequest = RequestWithCursor<
  CommonFilters & WithSortOrder & WithLimit,
  string
> &
  Partial<{
    recipient: string;
  }>;

export type PaymentTxsRepo = Repo<
  PaymentTxsGetRequest,
  PaymentTxsMgetRequest,
  PaymentTxsSearchRequest,
  PaymentTx
>;
