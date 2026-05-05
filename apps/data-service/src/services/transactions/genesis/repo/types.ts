import { type BigNumber } from '@decentralchain/data-entities';
import { type Repo } from '../../../../types';
import { type WithLimit, type WithSortOrder } from '../../../_common';
import { type RequestWithCursor } from '../../../_common/pagination';
import { type CommonFilters, type RawTx, type Tx } from '../../_common/types';

export type GenesisTxDbResponse = Omit<RawTx, 'sender'> & {
  amount: BigNumber;
  recipient: string;
};

export type GenesisTx = Omit<Tx, 'sender'> & {
  amount: BigNumber;
  recipient: string;
};

export type GenesisTxsGetRequest = string;

export type GenesisTxsMgetRequest = string[];

export type GenesisTxsSearchRequest = RequestWithCursor<
  Omit<CommonFilters, 'sender'> & WithSortOrder & WithLimit,
  string
> &
  Partial<{
    recipient: string;
  }>;

export type GenesisTxsRepo = Repo<
  GenesisTxsGetRequest,
  GenesisTxsMgetRequest,
  GenesisTxsSearchRequest,
  GenesisTx
>;
