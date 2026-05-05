import {
  type RawInvokeScriptTx as DbRawInvokeScriptTx,
  type InvokeScriptTxArg,
  type InvokeScriptTxArgType,
  type InvokeScriptTxPayment,
  type RawInvokeScriptTx,
  type RawInvokeScriptTxArgValue,
} from '../types';

const getArgFieldByType = (type: InvokeScriptTxArgType): keyof RawInvokeScriptTxArgValue => {
  switch (type) {
    case 'integer':
      return 'arg_value_integer';
    case 'boolean':
      return 'arg_value_boolean';
    case 'binary':
      return 'arg_value_binary';
    case 'string':
      return 'arg_value_string';
    case 'list':
      return 'arg_value_list';
  }
};

const getArg = (txRaw: DbRawInvokeScriptTx): InvokeScriptTxArg => ({
  positionInArgs: txRaw.position_in_args,
  type: txRaw.arg_type,
  value: txRaw.arg_type != null ? txRaw[getArgFieldByType(txRaw.arg_type)] : null,
});

const getPaymentItem = (txRaw: DbRawInvokeScriptTx): InvokeScriptTxPayment => ({
  amount: txRaw.amount,
  assetId: txRaw.asset_id,
  positionInPayment: txRaw.position_in_payment,
});

/**
 * Groups flat DB rows (one per arg+payment combination) into a single
 * RawInvokeScriptTx with nested `payment` and `call` arrays.
 *
 * The cast to `RawInvokeScriptTx` is required because the DB schema stores
 * one row per arg/payment combination, so the transformed object has array
 * fields (`payment`, `call`) that aren't reflected in the raw type definition.
 * Fixing the type mismatch requires coordinated refactoring of type definitions.
 */
const buildTxFromTxs = (txs: DbRawInvokeScriptTx[]): RawInvokeScriptTx | null => {
  if (txs.length === 0) return null;
  // Cast is safe: we've already checked txs.length > 0
  const firstRaw = txs[0] as DbRawInvokeScriptTx;

  // Omit arg/payment-specific columns; keep base transaction columns.
  const {
    function_name: _fn,
    arg_type: _at,
    arg_value_integer: _avi,
    arg_value_boolean: _avb,
    arg_value_string: _avs,
    arg_value_binary: _avbin,
    arg_value_list: _avl,
    position_in_args: _pia,
    amount: _amt,
    asset_id: _aid,
    position_in_payment: _pip,
    ...txBase
  } = firstRaw;

  // Build deduplicated, sorted payments.
  const seenPaymentPositions = new Set<number>();
  const payment = txs
    .filter((row) => row.amount != null)
    .map(getPaymentItem)
    .filter((item) => {
      if (seenPaymentPositions.has(item.positionInPayment)) return false;
      seenPaymentPositions.add(item.positionInPayment);
      return true;
    })
    .sort((a, b) => a.positionInPayment - b.positionInPayment)
    .map(({ positionInPayment: _p, ...rest }) => rest);

  // Build call object only when a function is present.
  type TxWithOptionalCall = typeof txBase & {
    payment: typeof payment;
    call?: { function: string; args: Array<Omit<InvokeScriptTxArg, 'positionInArgs'>> };
  };
  const result: TxWithOptionalCall = { ...txBase, payment };

  if (firstRaw.function_name != null) {
    const seenArgPositions = new Set<number>();
    const args = txs
      .filter((row) => row.arg_type != null)
      .map(getArg)
      .filter((item) => {
        if (seenArgPositions.has(item.positionInArgs)) return false;
        seenArgPositions.add(item.positionInArgs);
        return true;
      })
      .sort((a, b) => a.positionInArgs - b.positionInArgs)
      .map(({ positionInArgs: _p, ...rest }) => rest);

    result.call = { args, function: firstRaw.function_name };
  }

  // Cast required: RawInvokeScriptTx has individual arg/payment fields at
  // top level (DB row design), but at runtime the object carries nested arrays.
  return result as unknown as RawInvokeScriptTx;
};

/**
 * Db returns list of object
 * { ...txAttributes, ...argsAttributes, ...paymentAttributes }
 * Need to restore transaction nested structure, grouping by
 * txAttributes and putting args and payment objects nested into the tx,
 * preserving args and payment order by sorting on `position_in_args` and on `position_in_payment`
 */
export const transformResult = (t: DbRawInvokeScriptTx[]): RawInvokeScriptTx[] => {
  if (t == null || t.length === 0) return [];

  const grouped = new Map<string, DbRawInvokeScriptTx[]>();
  for (const row of t) {
    const group = grouped.get(row.id);
    if (group !== undefined) {
      group.push(row);
    } else {
      grouped.set(row.id, [row]);
    }
  }

  const results: RawInvokeScriptTx[] = [];
  for (const group of grouped.values()) {
    const tx = buildTxFromTxs(group);
    if (tx !== null) results.push(tx);
  }
  return results;
};
