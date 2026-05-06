import { type RawMassTransferTx } from '../types';
import { type DbRawMassTransferTx } from './types';

/** Intermediate transfer with position for sort ordering. */
type TransferWithPosition = {
  recipient: string;
  amount: DbRawMassTransferTx['amount'];
  positionInTx: number;
};

const getTransferItem = (txRaw: DbRawMassTransferTx): TransferWithPosition => ({
  amount: txRaw.amount,
  positionInTx: txRaw.position_in_tx,
  recipient: txRaw.recipient_alias ?? txRaw.recipient_address,
});

/**
 * Groups a flat list of DB rows (one row per transfer) into transaction objects
 * with a nested `transfers` array, sorted by position_in_tx.
 *
 * The return type is cast to `RawMassTransferTx` for compatibility with the
 * downstream pipeline. The DB schema stores one row per transfer, so each
 * transaction ID appears N times — one for each transfer. `buildTxFromTxs`
 * collapses them into a single transaction with `transfers: Transfer[]`.
 * The type mismatch (RawMassTransferTx does not declare `transfers`) is a
 * pre-existing schema design; fixing it requires coordinated refactoring of
 * several type definitions across this service.
 */
const buildTxFromTxs = (txs: DbRawMassTransferTx[]): RawMassTransferTx | null => {
  if (txs.length === 0) return null;
  // Cast is safe: we've already checked txs.length > 0
  const firstRaw = txs[0] as DbRawMassTransferTx;
  // Omit transfer-specific columns; keep the base transaction columns.
  const {
    recipient_address: _ra,
    recipient_alias: _ral,
    amount: _amt,
    position_in_tx: _pos,
    ...txBase
  } = firstRaw;

  const transfers = txs
    .filter((row) => row.amount != null)
    .map(getTransferItem)
    .sort((a, b) => a.positionInTx - b.positionInTx)
    .map(({ positionInTx: _p, ...rest }) => rest);

  // Cast required: RawMassTransferTx type has individual transfer fields at top
  // level (legacy design), but at runtime the object carries `transfers: []`.
  return { ...txBase, transfers } as unknown as RawMassTransferTx;
};

/**
 * Db returns list of object
 * { ...txAttributes, ...transferAttributes }
 * Need to restore transaction nested structure, grouping by
 * txAttributes and putting transfer objects nested into the tx,
 * preserving transfers order by sorting on `position_in_tx`
 */
export const transformResult = (t: DbRawMassTransferTx[]): RawMassTransferTx[] => {
  if (t == null || t.length === 0) return [];

  const grouped = new Map<string, DbRawMassTransferTx[]>();
  for (const row of t) {
    const group = grouped.get(row.id);
    if (group !== undefined) {
      group.push(row);
    } else {
      grouped.set(row.id, [row]);
    }
  }

  const results: RawMassTransferTx[] = [];
  for (const group of grouped.values()) {
    const tx = buildTxFromTxs(group);
    if (tx !== null) results.push(tx);
  }
  return results;
};
