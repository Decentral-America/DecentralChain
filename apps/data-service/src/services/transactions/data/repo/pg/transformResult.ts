import {
  always,
  append,
  assoc,
  compose,
  cond,
  either,
  evolve,
  groupBy,
  identity,
  ifElse,
  isEmpty,
  isNil,
  map,
  omit,
  prop,
  reduce,
  sortBy,
  T,
  values,
} from 'ramda';

const getDataObject = (txRow: any) => ({
  key: txRow.data_key,
  positionInTx: txRow.position_in_tx, // for sorting later
  type: txRow.data_type,
  value: txRow[`data_value_${txRow.data_type}`],
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

const appendRowToTx = (tx: any, row: any) =>
  (compose as any)(
    (ifElse as any)(
      () => isNil(prop('data_key', row)),
      identity,
      assoc('data', append(getDataObject(row), tx.data)),
    ),
    (b: any) => ({ ...removeDataEntryFromRow(row), ...b }),
  )(tx);

/**
 * Db returns list of object
 * { ...txAttributes, ...dataAttributes }
 * Need to restore transaction nested structure, grouping by
 * txAttributes and putting data objects nested into the tx,
 * preserving data entries order by sorting on `position_in_tx`
 */
const dataEntriesToTxs: (rows: unknown) => unknown[] = cond([
  [either(isNil, isEmpty), always([])],
  [
    T,
    (compose as any)(
      // sort by position in tx, then remove it
      map(
        evolve({
          data: (compose as any)(
            map(omit(['positionInTx']) as any),
            sortBy(prop('positionInTx') as any),
          ),
        }) as any,
      ),
      map(reduce(appendRowToTx, { data: [] })) as any,
      values,
      groupBy(prop('id') as any),
    ),
  ],
]) as any;

export default dataEntriesToTxs;
