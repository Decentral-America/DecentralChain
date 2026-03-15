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
  item: TClientDataTransactionEntry,
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

const remapDataEntryItem = (item: TClientDataTransactionEntry): DataTransactionEntry<string> =>
  ({
    key: prop('key', item),
    type: prop('type', item),
    value: parseValueByType(item),
  }) as DataTransactionEntry<string>;

export const data = factory<IClientData, TWithPartialFee<DataTransaction<string>>>({
  ...getDefaultTransform(),
  data: pipe(prop('data'), map(remapDataEntryItem)),
});

export interface IClientData extends IDefaultGuiTx<typeof TYPES.DATA> {
  data: TClientDataTransactionEntry[];
}

type TClientDataTransactionEntry =
  | IClientDataTransactionEntryInteger
  | IClientDataTransactionEntryBoolean
  | IClientDataTransactionEntryString
  | IClientDataTransactionEntryBinary
  | IClientDataTransactionEntryEmpty;

interface IClientDataTransactionEntryInteger {
  key: string;
  type: typeof DATA_FIELD_TYPE.INTEGER;
  value: TLong;
}

interface IClientDataTransactionEntryBoolean {
  key: string;
  type: typeof DATA_FIELD_TYPE.BOOLEAN;
  value: boolean | null;
}

interface IClientDataTransactionEntryString {
  key: string;
  type?: typeof DATA_FIELD_TYPE.STRING;
  value: string;
}

interface IClientDataTransactionEntryBinary {
  key: string;
  type?: typeof DATA_FIELD_TYPE.BINARY;
  value: string;
}

interface IClientDataTransactionEntryEmpty {
  key: string;
  type?: undefined;
  value: null | undefined;
}
