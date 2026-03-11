import {
  type SignData,
  type SignOrderData,
  type SignTxData,
} from '@decentralchain/ledger';

export type LedgerSignRequest = { id: string } & (
  | { type: 'order'; data: SignOrderData }
  | { type: 'request'; data: SignData }
  | { type: 'someData'; data: SignData }
  | { type: 'transaction'; data: SignTxData }
);
