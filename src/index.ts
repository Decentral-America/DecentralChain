/**
 * @decentralchain/ledger — DecentralChain Ledger hardware wallet integration.
 *
 * @packageDocumentation
 */

export { DCC } from './DCC.js';
export { DCCLedger, Ledger } from './dcc-ledger.js';
export { base58Encode } from './utils.js';

export type {
  DCCLedgerOptions,
  LedgerError,
  LedgerTransport,
  LedgerTransportFactory,
  SignData,
  SignOrderData,
  SignTxData,
  User,
  UserData,
} from './types.js';
