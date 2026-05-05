import { type BigNumber } from '@decentralchain/data-entities';
import { type DataEntryType, type Repo } from '../../../../types';
import { type WithLimit, type WithSortOrder } from '../../../_common';
import { type RequestWithCursor } from '../../../_common/pagination';
import { type CommonFilters, type RawTx, type Tx } from '../../_common/types';

type DataEntry = {
  key: string;
  type: DataEntryType;
  value: DataEntryValue;
};

export type DataEntryValue = boolean | BigNumber | string;

export type DataTxDbResponse = RawTx & {
  data: DataEntry[];
};

export type DataTx = Tx & {
  data: DataEntry[];
};

export type DataTxsGetRequest = string;

export type DataTxsMgetRequest = string[];

export type DataTxsSearchRequest<CursorType = string> = RequestWithCursor<
  CommonFilters &
    WithSortOrder &
    WithLimit &
    Partial<{
      key: string;
      type: DataEntryType;
      value: DataEntryValue;
    }>,
  CursorType
>;

export type DataTxsRepo = Repo<DataTxsGetRequest, DataTxsMgetRequest, DataTxsSearchRequest, DataTx>;
