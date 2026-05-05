import { type BigNumber } from '@decentralchain/data-entities';
import { type CommonTransactionInfo, type Repo } from '../../../../types';
import { type WithLimit, type WithSortOrder } from '../../../_common';
import { type RequestWithCursor } from '../../../_common/pagination';
import { type CommonFilters } from '../../_common/types';

export type TxDbResponse = {
  uid: BigNumber;
  tx_type: number;
  id: string;
  time_stamp: string;
};

export type AllTxsGetRequest = string;

export type AllTxsMgetRequest = string[];

export type AllTxsSearchRequest = RequestWithCursor<
  CommonFilters & WithSortOrder & WithLimit,
  string
>;

export type AllTxsRepo = Repo<
  AllTxsGetRequest,
  AllTxsMgetRequest,
  AllTxsSearchRequest,
  CommonTransactionInfo
>;
