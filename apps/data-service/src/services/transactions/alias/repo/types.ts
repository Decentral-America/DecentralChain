import { type Repo } from '../../../../types';
import { type WithLimit, type WithSortOrder } from '../../../_common';
import { type RequestWithCursor } from '../../../_common/pagination';
import { type CommonFilters, type RawTx, type Tx } from '../../_common/types';

export type AliasTxDbResponse = RawTx & {
  alias: string;
};

export type AliasTx = Tx & {
  alias: string;
};

export type AliasTxsGetRequest = string;

export type AliasTxsMgetRequest = string[];

export type AliasTxsSearchRequest = RequestWithCursor<
  CommonFilters & WithSortOrder & WithLimit,
  string
>;

export type AliasTxsRepo = Repo<
  AliasTxsGetRequest,
  AliasTxsMgetRequest,
  AliasTxsSearchRequest,
  AliasTx
>;
