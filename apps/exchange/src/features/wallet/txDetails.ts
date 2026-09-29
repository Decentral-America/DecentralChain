/**
 * What a transaction actually did, read from the signer's side.
 *
 * The history table can only say "Invoke Script · +0 DCC", and that is not the
 * table's fault: for a contract call the movement is not in the transaction's
 * `amount` field at all. It is in the payments attached to the call and in the
 * transfers the contract made back, which live under `stateChanges` — and for
 * a swap the payout comes from a *nested* invoke, one level deeper again. This
 * module walks that structure and answers the question the row cannot: what
 * left this account, what arrived, and what the call was for.
 *
 * Everything here is pure and works in base units. Formatting one needs the
 * asset's decimals, which only the caller has resolved, so callers pass a
 * formatter in rather than this module assuming 8.
 */

import { base58Decode } from '@decentralchain/ts-lib-crypto';

/** One typed argument of a contract call, as the node prints it. */
export interface TxArg {
  type: string;
  value: unknown;
}

interface StateChanges {
  data?: Array<{ key: string; type?: string; value?: unknown }>;
  invokes?: Array<{
    call?: { args?: TxArg[]; function: string };
    dApp: string;
    payment?: Array<{ amount: number; assetId: string | null }>;
    stateChanges?: StateChanges;
  }>;
  transfers?: Array<{ address: string; amount: number; asset: string | null }>;
}

/** An order as it appears inside an exchange transaction. */
export interface TxOrder {
  amount?: number;
  assetPair?: { amountAsset: string | null; priceAsset: string | null };
  orderType?: 'buy' | 'sell';
  price?: number;
  sender?: string;
}

/**
 * The fields of `/transactions/info/:id` this module reads.
 *
 * Deliberately partial and deliberately optional: one endpoint answers for
 * eighteen transaction types, and no single type carries all of these. The
 * index signature keeps the rest of the record reachable for the raw view.
 */
export interface NodeTx {
  alias?: string;
  amount?: number;
  applicationStatus?: string;
  assetId?: string | null;
  attachment?: string;
  call?: { args?: TxArg[]; function: string };
  chainId?: number;
  dApp?: string;
  data?: Array<{ key: string; type?: string; value?: unknown }>;
  decimals?: number;
  description?: string;
  fee: number;
  feeAssetId?: string | null;
  height?: number;
  id: string;
  leaseId?: string;
  name?: string;
  order1?: TxOrder;
  order2?: TxOrder;
  payment?: Array<{ amount: number; assetId: string | null }>;
  price?: number;
  quantity?: number;
  recipient?: string;
  reissuable?: boolean;
  script?: string | null;
  sender: string;
  senderPublicKey?: string;
  stateChanges?: StateChanges;
  timestamp: number;
  totalAmount?: number;
  transfers?: Array<{ amount: number; recipient: string }>;
  type: number;
  version?: number;
  [key: string]: unknown;
}

/** A balance change this account saw, in base units. A null asset is DCC. */
export interface Movement {
  assetId: string | null;
  direction: 'in' | 'out';
  /** Why it moved — "Sent with the call", "Paid out by the contract". */
  note?: string;
  raw: number;
}

/** Formats a base-unit amount for a given asset. Supplied by the caller. */
export type AmountFormatter = (raw: number, assetId: string | null) => string;

/** Resolves an issued asset's display name. Supplied by the caller. */
export type AssetNamer = (assetId: string | null) => string;

/** What each transaction type is called, in the reader's terms. */
export const TX_TYPE_NAME: Record<number, string> = {
  1: 'Genesis',
  2: 'Payment',
  3: 'Asset issue',
  4: 'Transfer',
  5: 'Reissue',
  6: 'Burn',
  7: 'Exchange',
  8: 'Lease',
  9: 'Lease cancel',
  10: 'Alias',
  11: 'Mass transfer',
  12: 'Data',
  13: 'Account script',
  14: 'Sponsorship',
  15: 'Asset script',
  16: 'Contract call',
  17: 'Asset update',
  18: 'Ethereum',
};

export const txTypeName = (type: number): string => TX_TYPE_NAME[type] ?? `Type ${type}`;

/** Trim an address or id to something that fits on one line. */
export const shortId = (value: string, lead = 6, tail = 4): string =>
  value.length <= lead + tail + 1 ? value : `${value.slice(0, lead)}…${value.slice(-tail)}`;

/*
 * A contract can invoke a contract that invokes a contract. The chain bounds
 * that, but this walks a response from the network, so the recursion is bounded
 * here too rather than on trust.
 */
const MAX_INVOKE_DEPTH = 12;

const walkPayouts = (
  changes: StateChanges | undefined,
  address: string,
  found: Movement[],
  depth = 0,
): void => {
  if (!changes || depth > MAX_INVOKE_DEPTH) return;

  for (const transfer of changes.transfers ?? []) {
    if (transfer.address === address) {
      found.push({
        assetId: transfer.asset,
        direction: 'in',
        note: 'Paid out by the contract',
        raw: transfer.amount,
      });
    }
  }

  /*
   * A swap's payout is made by the pool, which the router calls — so it sits
   * one level below the transaction's own stateChanges. Stopping at the top
   * level would report a swap as money spent and nothing received.
   */
  for (const invoke of changes.invokes ?? []) {
    walkPayouts(invoke.stateChanges, address, found, depth + 1);
  }
};

/** Same asset, same direction, one row. */
const merge = (movements: Movement[]): Movement[] => {
  const byKey = new Map<string, Movement>();
  for (const movement of movements) {
    const key = `${movement.direction}:${movement.assetId ?? 'DCC'}`;
    const existing = byKey.get(key);
    if (existing) existing.raw += movement.raw;
    else byKey.set(key, { ...movement });
  }
  return [...byKey.values()].filter((movement) => movement.raw > 0);
};

const transferMovements = (tx: NodeTx, address: string): Movement[] => {
  const assetId = tx.assetId ?? null;
  const raw = tx.amount ?? 0;
  if (tx.sender === address) {
    return [
      {
        assetId,
        direction: 'out',
        ...(tx.recipient === address && { note: 'Sent to yourself' }),
        raw,
      },
    ];
  }
  if (tx.recipient === address) return [{ assetId, direction: 'in', raw }];
  return [];
};

const massTransferMovements = (tx: NodeTx, address: string): Movement[] => {
  const assetId = tx.assetId ?? null;
  if (tx.sender === address) {
    return [{ assetId, direction: 'out', raw: tx.totalAmount ?? 0 }];
  }
  const mine = (tx.transfers ?? []).filter((entry) => entry.recipient === address);
  if (mine.length === 0) return [];
  return [
    {
      assetId,
      direction: 'in',
      raw: mine.reduce((sum, entry) => sum + entry.amount, 0),
    },
  ];
};

const invokeMovements = (tx: NodeTx, address: string): Movement[] => {
  const found: Movement[] = [];

  if (tx.sender === address) {
    for (const payment of tx.payment ?? []) {
      found.push({
        assetId: payment.assetId,
        direction: 'out',
        note: 'Sent with the call',
        raw: payment.amount,
      });
    }
  }

  walkPayouts(tx.stateChanges, address, found);
  return found;
};

/** Only the account that signed a burn, issue or reissue sees its quantity. */
const ownQuantity = (
  tx: NodeTx,
  address: string,
  direction: 'in' | 'out',
  assetId: string | null,
  note?: string,
): Movement[] =>
  tx.sender === address
    ? merge([{ assetId, direction, ...(note && { note }), raw: tx.quantity ?? 0 }])
    : [];

const MOVEMENTS: Record<number, (tx: NodeTx, address: string) => Movement[]> = {
  2: (tx, address) => merge(transferMovements(tx, address)),
  3: (tx, address) => ownQuantity(tx, address, 'in', tx.id, 'Newly issued'),
  4: (tx, address) => merge(transferMovements(tx, address)),
  5: (tx, address) => ownQuantity(tx, address, 'in', tx.assetId ?? null),
  6: (tx, address) => ownQuantity(tx, address, 'out', tx.assetId ?? null),
  11: (tx, address) => merge(massTransferMovements(tx, address)),
  16: (tx, address) => merge(invokeMovements(tx, address)),
};

/**
 * Every balance change this account saw, in base units.
 *
 * The fee is not here. It is charged on every transaction this account signs
 * and gets its own row, so folding it in would make a 0.009 DCC fee read as
 * part of what was traded.
 *
 * Exchange transactions are absent by choice: the transaction is signed by the
 * matcher, and which side of it this account was on is a property of the
 * orders. Those are reported as order facts rather than guessed at as amounts.
 */
export const movementsFor = (tx: NodeTx, address: string): Movement[] =>
  MOVEMENTS[tx.type]?.(tx, address) ?? [];

/** The order this account signed, when it signed one of them. */
export const ownOrder = (tx: NodeTx, address: string): TxOrder | undefined =>
  [tx.order1, tx.order2].find((order) => order?.sender === address);

/** What every headline handler is given. */
interface HeadlineContext {
  address: string;
  fmt: AmountFormatter;
  movements: Movement[];
  tx: NodeTx;
}

const invokeHeadline = ({ fmt, movements, tx }: HeadlineContext): string => {
  const fn = tx.call?.function;
  const paid = movements.filter((movement) => movement.direction === 'out');
  const got = movements.filter((movement) => movement.direction === 'in');
  const spent = paid[0];
  const received = got[0];

  if (spent && received && paid.length === 1 && got.length === 1) {
    return `Swapped ${fmt(spent.raw, spent.assetId)} for ${fmt(received.raw, received.assetId)}`;
  }
  if (spent && got.length === 0) {
    const amount = fmt(spent.raw, spent.assetId);
    return fn ? `Paid ${amount} to ${fn}` : `Paid ${amount}`;
  }
  if (received && paid.length === 0) {
    const amount = fmt(received.raw, received.assetId);
    return fn ? `Received ${amount} from ${fn}` : `Received ${amount}`;
  }
  return fn ? `Called ${fn}` : 'Called a contract';
};

const transferHeadline = ({ fmt, movements, tx }: HeadlineContext): string => {
  const [first] = movements;
  if (!first) return 'Transfer';
  const incoming = first.direction === 'in';
  const counterparty = incoming ? tx.sender : (tx.recipient ?? '');
  const amount = fmt(first.raw, first.assetId);
  const verb = incoming ? 'Received' : 'Sent';
  if (!counterparty) return `${verb} ${amount}`;
  return `${verb} ${amount} ${incoming ? 'from' : 'to'} ${shortId(counterparty)}`;
};

const massTransferHeadline = ({ fmt, movements, tx }: HeadlineContext): string => {
  const [first] = movements;
  if (first?.direction === 'in') return `Received ${fmt(first.raw, first.assetId)}`;
  const count = tx.transfers?.length ?? 0;
  return `Sent to ${count} ${count === 1 ? 'recipient' : 'recipients'}`;
};

const exchangeHeadline = ({ address, tx }: HeadlineContext): string => {
  const side = ownOrder(tx, address)?.orderType;
  if (!side) return 'Order matched';
  return side === 'buy' ? 'Bought on the order book' : 'Sold on the order book';
};

const quantityHeadline =
  (verb: string, fallback: string) =>
  ({ fmt, movements }: HeadlineContext): string => {
    const [first] = movements;
    return first ? `${verb} ${fmt(first.raw, first.assetId)}` : fallback;
  };

const HEADLINE: Record<number, (context: HeadlineContext) => string> = {
  2: transferHeadline,
  3: ({ tx }) => (tx.name ? `Issued ${tx.name}` : 'Issued an asset'),
  4: transferHeadline,
  5: quantityHeadline('Reissued', 'Reissued an asset'),
  6: quantityHeadline('Burned', 'Burned an asset'),
  7: exchangeHeadline,
  8: ({ fmt, tx }) =>
    `Leased ${fmt(tx.amount ?? 0, null)}${tx.recipient ? ` to ${shortId(tx.recipient)}` : ''}`,
  9: () => 'Cancelled a lease',
  10: ({ tx }) => (tx.alias ? `Created the alias "${tx.alias}"` : 'Created an alias'),
  11: massTransferHeadline,
  12: ({ tx }) => {
    const count = tx.data?.length ?? 0;
    return `Wrote ${count} data ${count === 1 ? 'entry' : 'entries'}`;
  },
  13: ({ tx }) => (tx.script ? 'Set an account script' : 'Removed the account script'),
  14: () => 'Changed sponsorship',
  15: () => 'Set an asset script',
  16: invokeHeadline,
  17: ({ tx }) => (tx.name ? `Updated ${tx.name}` : 'Updated an asset'),
};

/**
 * One line saying what happened, in the voice the activity feed already uses.
 *
 * "Sent 100 DCC" rather than "Transaction" — and for a contract call, the swap
 * it performed rather than the fact that a script ran.
 */
export const headlineFor = (tx: NodeTx, address: string, fmt: AmountFormatter): string => {
  const context: HeadlineContext = { address, fmt, movements: movementsFor(tx, address), tx };
  return HEADLINE[tx.type]?.(context) ?? txTypeName(tx.type);
};

/**
 * Every issued asset this transaction touches, so names and decimals can be
 * resolved in one pass rather than one request per row.
 */
export const collectAssetIds = (tx: NodeTx): string[] => {
  const ids = new Set<string>();
  const add = (id: string | null | undefined): void => {
    if (id) ids.add(id);
  };

  add(tx.assetId);
  add(tx.feeAssetId);
  for (const payment of tx.payment ?? []) add(payment.assetId);
  add(tx.order1?.assetPair?.amountAsset);
  add(tx.order1?.assetPair?.priceAsset);

  const walk = (changes: StateChanges | undefined, depth = 0): void => {
    if (!changes || depth > MAX_INVOKE_DEPTH) return;
    for (const transfer of changes.transfers ?? []) add(transfer.asset);
    for (const invoke of changes.invokes ?? []) {
      for (const payment of invoke.payment ?? []) add(payment.assetId);
      walk(invoke.stateChanges, depth + 1);
    }
  };
  walk(tx.stateChanges);

  return [...ids];
};

/*
 * Control bytes are what separates a note somebody typed from binary another
 * tool wrote. Built from char codes rather than written as a literal so this
 * source file itself stays plain text.
 */
const CONTROL_BYTES = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(8)}${String.fromCharCode(11)}${String.fromCharCode(12)}${String.fromCharCode(14)}-${String.fromCharCode(31)}]`,
);

/**
 * A transfer's attachment, as text.
 *
 * The node returns it base58-encoded, and most attachments are empty. One that
 * is not valid UTF-8 text is binary someone's own tooling put there; printing
 * replacement characters for it would say less than saying nothing, so this
 * returns null and the row is dropped.
 */
export const decodeAttachment = (attachment: string | undefined): string | null => {
  if (!attachment) return null;
  try {
    const bytes = base58Decode(attachment);
    if (bytes.length === 0) return null;
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return CONTROL_BYTES.test(text) ? null : text;
  } catch {
    return null;
  }
};

/** One labelled fact about a transaction. */
export interface DetailRow {
  /** Long identifiers get a copy button and a monospace face. */
  copyable?: boolean;
  label: string;
  value: string;
}

/** What every detail-row handler is given. */
interface DetailContext {
  address: string;
  fmt: AmountFormatter;
  nameOf: AssetNamer;
  tx: NodeTx;
}

/** Drops a row whose value the node did not supply, rather than printing a gap. */
const row = (label: string, value: string | undefined, copyable = false): DetailRow[] =>
  value === undefined || value === ''
    ? []
    : [{ label, value, ...(copyable && { copyable: true }) }];

const yesNo = (value: boolean | undefined): string | undefined =>
  value === undefined ? undefined : value ? 'Yes' : 'No';

const num = (value: number | undefined): string | undefined =>
  value === undefined ? undefined : String(value);

const exchangeRows = ({ address, fmt, nameOf, tx }: DetailContext): DetailRow[] => {
  const side = ownOrder(tx, address)?.orderType;
  const pair = tx.order1?.assetPair;
  return [
    ...row('Side', side === 'buy' ? 'Buy' : side === 'sell' ? 'Sell' : undefined),
    ...row('Pair', pair ? `${nameOf(pair.amountAsset)} / ${nameOf(pair.priceAsset)}` : undefined),
    ...row('Amount', pair ? fmt(tx.amount ?? 0, pair.amountAsset) : undefined),
    ...row('Price', num(tx.price)),
  ];
};

const DETAILS: Record<number, (context: DetailContext) => DetailRow[]> = {
  2: ({ tx }) => [...row('From', tx.sender, true), ...row('To', tx.recipient, true)],
  3: ({ fmt, tx }) => [
    ...row('Name', tx.name),
    ...row('Description', tx.description),
    ...row('Quantity', fmt(tx.quantity ?? 0, tx.id)),
    ...row('Decimals', num(tx.decimals)),
    ...row('Reissuable', yesNo(tx.reissuable)),
  ],
  4: ({ tx }) => [
    ...row('From', tx.sender, true),
    ...row('To', tx.recipient, true),
    ...row('Message', decodeAttachment(tx.attachment) ?? undefined),
  ],
  5: ({ fmt, nameOf, tx }) => [
    ...row('Asset', nameOf(tx.assetId ?? null)),
    ...row('Quantity', fmt(tx.quantity ?? 0, tx.assetId ?? null)),
    ...row('Still reissuable', yesNo(tx.reissuable)),
  ],
  6: ({ fmt, nameOf, tx }) => [
    ...row('Asset', nameOf(tx.assetId ?? null)),
    ...row('Quantity', fmt(tx.quantity ?? 0, tx.assetId ?? null)),
  ],
  7: exchangeRows,
  8: ({ fmt, tx }) => [
    ...row('Leased to', tx.recipient, true),
    ...row('Amount', fmt(tx.amount ?? 0, null)),
  ],
  9: ({ tx }) => row('Lease', tx.leaseId, true),
  10: ({ tx }) => row('Alias', tx.alias),
  11: ({ fmt, tx }) => [
    ...row('Recipients', String(tx.transfers?.length ?? 0)),
    ...row('Total', fmt(tx.totalAmount ?? 0, tx.assetId ?? null)),
  ],
  16: ({ tx }) => [...row('Contract', tx.dApp, true), ...row('Function', tx.call?.function)],
  17: ({ tx }) => [...row('Name', tx.name), ...row('Description', tx.description)],
};

/**
 * The facts that belong to this transaction's type and no other.
 *
 * A transfer's attachment and an invoke's dApp answer different questions, and
 * a dialog showing the union of every type's fields would answer neither. The
 * shared facts — id, height, fee, sender — are the component's own section.
 */
export const detailRowsFor = (
  tx: NodeTx,
  address: string,
  fmt: AmountFormatter,
  nameOf: AssetNamer,
): DetailRow[] => DETAILS[tx.type]?.({ address, fmt, nameOf, tx }) ?? [];

/** Renders a contract-call argument for display. */
export const formatArg = (arg: TxArg): string => {
  if (arg.value === null || arg.value === undefined) return 'unit';
  if (Array.isArray(arg.value)) return `[${arg.value.length} items]`;
  if (typeof arg.value === 'object') return JSON.stringify(arg.value);
  return String(arg.value);
};
