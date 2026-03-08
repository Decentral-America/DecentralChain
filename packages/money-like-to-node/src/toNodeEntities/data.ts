import {
  DATA_FIELD_TYPE,
  type DataTransaction,
  type DataTransactionEntry,
} from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TLong, type TWithPartialFee } from '../types/index.js';
import { getCoins, map, pipe, prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

const parseValueByType = (
  item: TDCCGuiDataTransactionEntry,
): DataTransactionEntry<string>['value'] | null => {
  switch (item.type) {
    case DATA_FIELD_TYPE.BINARY:
    case DATA_FIELD_TYPE.STRING:
    case DATA_FIELD_TYPE.BOOLEAN:
      return item.value;
    case DATA_FIELD_TYPE.INTEGER:
      return getCoins(item.value);
    default:
      throw new Error(
        `Unknown data entry type "${String((item as { type?: unknown }).type)}" for key "${item.key}". ` +
          `Expected: integer, boolean, string, or binary.`,
      );
  }
};

const remapDataEntryItem = (item: TDCCGuiDataTransactionEntry): DataTransactionEntry<string> =>
  ({
    key: prop('key', item),
    type: prop('type', item),
    value: parseValueByType(item),
  }) as DataTransactionEntry<string>;

export const data = factory<IDCCGuiData, TWithPartialFee<DataTransaction<string>>>({
  ...getDefaultTransform(),
  data: pipe(prop('data'), map(remapDataEntryItem)),
});

export interface IDCCGuiData extends IDefaultGuiTx<typeof TYPES.DATA> {
  data: TDCCGuiDataTransactionEntry[];
}

type TDCCGuiDataTransactionEntry =
  | IDCCGuiDataTransactionEntryInteger
  | IDCCGuiDataTransactionEntryBoolean
  | IDCCGuiDataTransactionEntryString
  | IDCCGuiDataTransactionEntryBinary
  | IDCCGuiDataTransactionEntryEmpty;

interface IDCCGuiDataTransactionEntryInteger {
  key: string;
  type: typeof DATA_FIELD_TYPE.INTEGER;
  value: TLong;
}

interface IDCCGuiDataTransactionEntryBoolean {
  key: string;
  type: typeof DATA_FIELD_TYPE.BOOLEAN;
  value: boolean | null;
}

interface IDCCGuiDataTransactionEntryString {
  key: string;
  type?: typeof DATA_FIELD_TYPE.STRING;
  value: string;
}

interface IDCCGuiDataTransactionEntryBinary {
  key: string;
  type?: typeof DATA_FIELD_TYPE.BINARY;
  value: string;
}

interface IDCCGuiDataTransactionEntryEmpty {
  key: string;
  type?: undefined;
  value: null | undefined;
}
