import { type Repo } from '../../../../types';
import { type WithLimit, type WithSortOrder } from '../../../_common';
import { type RequestWithCursor } from '../../../_common/pagination';
import { type CommonFilters, type RawTx, type Tx } from '../../_common/types';

export type SetScriptTxDbResponse = RawTx & {
  script: string;
};

export type SetScriptTx = Tx & {
  script: string;
};

export type SetScriptTxsGetRequest = string;

export type SetScriptTxsMgetRequest = string[];

export type SetScriptTxsSearchRequest = RequestWithCursor<
  CommonFilters & WithSortOrder & WithLimit,
  string
> &
  Partial<{
    sender: string;
    script: string;
  }>;

export type SetScriptTxsRepo = Repo<
  SetScriptTxsGetRequest,
  SetScriptTxsMgetRequest,
  SetScriptTxsSearchRequest,
  SetScriptTx
>;
