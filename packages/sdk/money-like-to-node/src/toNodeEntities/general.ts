import { type TransactionType } from '@decentralchain/ts-types';
import { type TLong, type TMoney } from '../types/index.js';
import { getCoins, pipe, prop } from '../utils/index.js';
import { requiredValidator, validate } from '../validators/index.js';

const processTimestamp = (timestamp: number | undefined): number => timestamp ?? Date.now();

// GUI output shape — the common fields every getDefaultTransform() returns.
// Inlined because BaseTransaction has required chainId and no version field.
interface TTx<A, B extends TransactionType> {
  type: B;
  version: number;
  senderPublicKey: string;
  timestamp: number;
  fee: A;
  chainId?: number | undefined;
}

export const getDefaultTransform = <
  TYPE extends TransactionType,
  T extends IDefaultGuiTx<TYPE>,
>(): {
  [Key in keyof TTx<string, TYPE>]: (data: T) => TTx<string, TYPE>[Key];
} => ({
  chainId: prop('chainId'),
  fee: pipe(prop('fee'), getCoins, validate(requiredValidator('fee'))),
  senderPublicKey: pipe(prop('senderPublicKey'), validate(requiredValidator('senderPublicKey'))),
  timestamp: pipe(prop('timestamp'), processTimestamp),
  type: pipe(prop('type'), validate(requiredValidator('type'))),
  version: pipe(prop('version'), validate(requiredValidator('version'))),
});

export interface IDefaultGuiTx<TYPE> {
  type: TYPE;
  version: number;
  senderPublicKey: string;
  timestamp?: number | undefined;
  fee: TLong | TMoney;
  chainId?: number | undefined;
}
