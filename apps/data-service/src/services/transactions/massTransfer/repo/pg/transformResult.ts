// @ts-nocheck
import {
  always,
  complement,
  compose,
  cond,
  either,
  filter,
  groupBy,
  isEmpty,
  isNil,
  map,
  omit,
  prop,
  sortBy,
  T,
  values,
} from 'ramda';

import { type RawMassTransferTx, type RawMassTransferTxTransfer } from '../types';
import { type DbRawMassTransferTx } from './types';

const isNotNil = complement(isNil);

const getTransferItem = (txRaw: DbRawMassTransferTx): RawMassTransferTxTransfer => ({
  amount: txRaw.amount,
  positionInTx: txRaw.position_in_tx, // for sorting later
  recipient: txRaw.recipient_alias || txRaw.recipient_address,
});

const removeUnnecessaryFromRaw = omit([
  'recipient_address',
  'recipient_alias',
  'amount',
  'position_in_tx',
]);

const buildTxFromTxs = (txs: DbRawMassTransferTx[]): RawMassTransferTx | null => {
  if (!Array.isArray(txs) || !txs.length) {
    return null;
  }

  const firstRaw = txs[0];
  const tx = removeUnnecessaryFromRaw(firstRaw);

  // fill tx.transfers
  tx.transfers = compose(
    map(omit(['positionInTx'])),
    sortBy(prop('positionInTx')),
    map(getTransferItem),
    filter((tx: DbRawMassTransferTx) => isNotNil(prop('amount', tx))),
  )(txs);

  return tx;
};

/**
 * Db returns list of object
 * { ...txAttributes, ...transferAttributes }
 * Need to restore transaction nested structure, grouping by
 * txAttributes and putting transfer objects nested into the tx,
 * preserving transfers order by sorting on `position_in_tx`
 */
export const transformResult = (t: DbRawMassTransferTx[]): RawMassTransferTx[] =>
  cond([
    [either(isNil, isEmpty), always([])],
    [T, compose(map(buildTxFromTxs), values, groupBy(prop('id')))],
  ])(t);
