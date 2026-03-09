// NOTE: 'Waves' in path is the ledger app module name inside @decentralchain/ledger package
import {
  type ISignData,
  type ISignOrderData,
  type ISignTxData,
} from '@decentralchain/ledger/lib/Waves';

export type LedgerSignRequest = { id: string } & (
  | { type: 'order'; data: ISignOrderData }
  | { type: 'request'; data: ISignData }
  | { type: 'someData'; data: ISignData }
  | { type: 'transaction'; data: ISignTxData }
);
