/**
 * @module index
 */

import { binary, serializePrimitives } from '@decentralchain/marshall';
import * as dccProto from '@decentralchain/protobuf-serialization';
import { base58Encode, blake2b, concat, signBytes } from '@decentralchain/ts-lib-crypto';
import {
  type DataFiledType,
  type DataTransaction,
  type DataTransactionEntry,
  TRANSACTION_TYPE,
} from '@decentralchain/ts-types';
import { DEFAULT_VERSIONS } from '../defaultVersions';
import { addProof, convertToPairs, fee, getSenderPublicKey, networkByte } from '../generic';
import { dataEntryToProto, txToProtoBytes } from '../proto-serialize';
import { type IDataParams, type WithId, type WithProofs, type WithSender } from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

const { BASE58_STRING, BASE64_STRING, BOOL, BYTE, BYTES, COUNT, LEN, LONG, SHORT, STRING } =
  serializePrimitives;

const typeMap: Record<string, [string, number, (value: unknown) => Uint8Array]> = {
  integer: ['integer', 0, LONG],
  number: ['integer', 0, LONG],
  boolean: ['boolean', 1, BOOL],
  string: ['string', 3, LEN(SHORT)(STRING)],
  binary: ['binary', 2, (s: string) => LEN(SHORT)(BASE64_STRING)(s)],
  _: ['binary', 2, LEN(SHORT)(BYTES)],
};

const mapType = <T>(
  value: T,
  type: string | undefined | null,
): [DataFiledType, number, (value: T) => Uint8Array] => {
  return type ? typeMap[type] : typeMap[typeof value] || typeMap._;
};

const convertValue = (
  type: 'integer' | 'string' | 'binary' | 'boolean',
  value: Uint8Array | string | number | boolean,
  _opt: string,
) => {
  return type === 'binary' && (value instanceof Uint8Array || Array.isArray(value))
    ? `base64:${Buffer.from(value as unknown as ArrayLike<number>).toString('base64')}`
    : value;
};

/* @echo DOCS */
export function data(params: IDataParams, seed: TSeedTypes): DataTransaction & WithId & WithProofs;
export function data(
  paramsOrTx: (IDataParams & WithSender) | DataTransaction,
  seed?: TSeedTypes,
): DataTransaction & WithId & WithProofs;
export function data(
  paramsOrTx: IDataParams & Partial<DataTransaction & WithProofs>,
  seed?: TSeedTypes,
): DataTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.DATA;
  const version = paramsOrTx.version ?? DEFAULT_VERSIONS.DATA;
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

  if (!Array.isArray(paramsOrTx.data)) throw new Error('["data should be array"]');

  if (
    paramsOrTx.data.some((x: { value?: unknown }) => x.value === null) &&
    paramsOrTx.version === 1
  )
    throw new Error('The value of the "value" field can only be null in a version greater than 1.');

  const _timestamp = paramsOrTx.timestamp || Date.now();

  const dataEntriesWithTypes = ((paramsOrTx.data as DataTransactionEntry[]) ?? []).map(
    (x: DataTransactionEntry) => {
      if (x.value == null) return x;
      if ((x as DataTransactionEntry).type) {
        if (validate.dataFieldValidator(x)) {
          return {
            ...x,
            value: convertValue(x.type, x.value, 'defined'),
          };
        } else
          throw new Error(`type "${x.type}" does not match value "${x.value}"(${typeof x.value})`);
      } else {
        const type = mapType(x.value, x.type)[0];

        return {
          type,
          key: x.key,
          value: convertValue(type, x.value, 'not defined'),
        };
      }
    },
  );

  const schema = (x: DataTransactionEntry) => {
    return concat(
      LEN(SHORT)(STRING)(x.key),
      [mapType(x.value, x.type)[1]],
      mapType(x.value, x.type)[2](x.value),
    );
  };

  let computedFee: number;
  if (version < 2) {
    const bytes = concat(
      BYTE(TRANSACTION_TYPE.DATA),
      BYTE(1),
      BASE58_STRING(senderPublicKey),
      COUNT(SHORT)(schema)(dataEntriesWithTypes),
      LONG(_timestamp),
    );

    computedFee = Math.floor(1 + (bytes.length - 1) / 1024) * 100000;
  } else {
    const protoEntries = dataEntriesWithTypes.map(dataEntryToProto);
    const dataBytes = dccProto.waves.DataTransactionData.encode({ data: protoEntries }).finish();
    computedFee = Math.max(100000, Math.ceil(dataBytes.length / 1024) * 100000);
  }

  const tx: DataTransaction & WithId & WithProofs = {
    type,
    version,
    senderPublicKey,
    fee: fee(paramsOrTx, computedFee),
    timestamp: _timestamp,
    proofs: paramsOrTx.proofs || [],
    chainId: networkByte(paramsOrTx.chainId, 76),
    id: '',
    data: dataEntriesWithTypes,
  };

  validate.data(tx);

  const bytes1 = version > 1 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes1), i);
  });
  tx.id = base58Encode(blake2b(bytes1));

  return tx;
}
