import {
  append,
  assoc,
  either,
  groupBy,
  isEmpty,
  isNil,
  map,
  omit,
  prop,
  reduce,
  sortBy,
  values,
} from 'ramda';

type TxRow = Record<string, unknown>;

const getDataObject = (txRow: TxRow) => ({
  key: txRow['data_key'],
  positionInTx: txRow['position_in_tx'], // for sorting later
  type: txRow['data_type'],
  value: txRow[`data_value_${txRow['data_type'] as string}`],
});

const removeDataEntryFromRow = omit([
  'data_key',
  'data_type',
  'data_value_integer',
  'data_value_boolean',
  'data_value_string',
  'data_value_binary',
  'position_in_tx',
]);

const appendRowToTx = (tx: TxRow, row: TxRow): TxRow => {
  const b: TxRow = { ...(removeDataEntryFromRow(row) as TxRow), ...tx };
  if (isNil(prop('data_key', row))) return b;
  return assoc('data', append(getDataObject(row), tx['data'] as unknown[]), b);
};

/**
 * Db returns list of object
 * { ...txAttributes, ...dataAttributes }
 * Need to restore transaction nested structure, grouping by
 * txAttributes and putting data objects nested into the tx,
 * preserving data entries order by sorting on `position_in_tx`
 */
const dataEntriesToTxs: (rows: unknown) => unknown[] = (rows: unknown): unknown[] => {
  if (either(isNil, isEmpty)(rows)) return [];
  const grouped = groupBy(prop('id') as unknown as (obj: TxRow) => string, rows as TxRow[]);
  const reduced = map(reduce(appendRowToTx, { data: [] }), grouped as Record<string, TxRow[]>);
  const txList = values(reduced) as TxRow[];
  return map((tx: TxRow): TxRow => {
    const data = sortBy(
      (entry) => (entry as TxRow)['positionInTx'] as number,
      tx['data'] as TxRow[],
    );
    return { ...tx, data: data.map((entry) => omit(['positionInTx'], entry)) };
  }, txList);
};

export default dataEntriesToTxs;
