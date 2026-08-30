/**
 * Turning a raw node transaction into a line someone can read.
 *
 * Lifted out of `pages/Dashboard/Dashboard.tsx` so the asset dialog can label a
 * per-asset history with the same verbs. A second copy of a seventeen-entry
 * transaction-type map would drift from this one; importing it from the
 * dashboard page instead is worse still, since that page is lazily loaded and
 * reaching into it from the wallet feature would pull all 900 of its lines into
 * the portfolio chunk.
 */
import { formatDistanceToNow } from 'date-fns';

/** The fields of a node transaction this mapper reads. The rest ride along. */
export interface ActivityTx {
  type?: number;
  recipient?: string;
  amount?: number;
  assetId?: string | null;
  timestamp?: number;
  id?: string;
  [key: string]: unknown;
}

/**
 * What each transaction type is called, in the reader's terms.
 *
 * The previous map covered four types and everything else fell through to the
 * literal word "Transaction" with a blank amount — which is what an invoke, a
 * burn, an issue, or a mass transfer all looked like in the feed. A row that
 * cannot say what happened is not worth its height.
 *
 * Numbers are the DecentralChain (Waves-protocol) transaction types.
 */
const TX_LABEL: Record<number, string> = {
  3: 'Issued',
  4: 'Transfer',
  5: 'Reissued',
  6: 'Burned',
  7: 'Traded',
  8: 'Leased',
  9: 'Lease cancelled',
  10: 'Alias created',
  11: 'Mass transfer',
  12: 'Data written',
  13: 'Script set',
  14: 'Sponsorship',
  15: 'Asset script set',
  16: 'Contract call',
  17: 'Asset updated',
};

export interface TxActivity {
  /** Raw base units, or null when this type carries no amount. */
  amountRaw: number | null;
  assetId: string | null;
  isReceived: boolean;
  status: string;
  time: string;
  txId: string;
  /** The verb: "Sent", "Received", "Burned"… */
  verb: string;
}

export function mapTxToActivity(tx: ActivityTx, userAddress: string): TxActivity {
  const isReceived = tx.recipient === userAddress;

  // A transfer is the one type whose name depends on which side you are on.
  const verb =
    tx.type === 4 ? (isReceived ? 'Received' : 'Sent') : (TX_LABEL[tx.type ?? 0] ?? 'Transaction');

  /*
   * Only the value-moving types carry an amount worth showing. A data write or
   * a script set has none, and printing 0 would imply it moved nothing rather
   * than that the question does not apply.
   */
  const carriesAmount = [4, 6, 8, 11].includes(tx.type ?? 0);

  return {
    amountRaw: carriesAmount && typeof tx.amount === 'number' ? tx.amount : null,
    // biome-ignore lint/nursery/useNullishCoalescing: assetId='' means native DCC — the falsy check is the intent
    assetId: tx.assetId || null,
    isReceived,
    status: 'completed',
    time: tx.timestamp
      ? formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })
      : 'Unknown time',
    txId: tx.id as string,
    verb,
  };
}
