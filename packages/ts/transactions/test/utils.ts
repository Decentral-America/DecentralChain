import { binary } from '@decentralchain/marshall';
import { base16Encode, base64Decode, verifySignature } from '@decentralchain/ts-lib-crypto';

import { makeTx, type TTx } from '../src';

import { protoBytesToTx, txToProtoBytes } from '../src/proto-serialize';

function validateTxSignature(
  tx: TTx,
  protoBytesMinVersion: number,
  proofNumber = 0,
  publicKey?: string,
): boolean {
  const bytes = tx.version > protoBytesMinVersion ? txToProtoBytes(tx) : binary.serializeTx(tx);

  return verifySignature(publicKey ?? tx.senderPublicKey, bytes, tx.proofs[proofNumber] as string);
}

export { validateTxSignature };

/**
 * Longs as strings, remove unnecessary fields
 * @param t
 */
export const deleteProofsAndId = (t: any) => {
  const tx: any = t;
  delete tx.id;
  delete tx.proofs;
  return tx;
};

export function checkProtoSerializeDeserialize({ Json, Bytes }: { Json: any; Bytes: string }) {
  const txJson = deleteProofsAndId(Json);
  // Use makeTx for proper defaults; fall back to raw JSON for fixtures with intentionally
  // invalid business data (e.g., zero amounts) that fail validation but are valid codec tests
  let txObject: any;
  try {
    txObject = makeTx(txJson);
  } catch {
    txObject = txJson;
  }
  const protoBytes = txToProtoBytes(txObject);
  const parsed = protoBytesToTx(protoBytes);
  expect(parsed).toMatchObject(txJson);

  const actualBytes = base16Encode(protoBytes);
  const expectedBytes = base16Encode(base64Decode(Bytes));
  expect(expectedBytes).toBe(actualBytes);
}

export function checkBinarySerializeDeserialize({ Json, Bytes }: { Json: any; Bytes: string }) {
  const txJson = deleteProofsAndId(Json);
  // Use makeTx for proper defaults; fall back to raw JSON for fixtures with intentionally
  // invalid business data (e.g., zero amounts) that fail validation but are valid codec tests
  let txObject: any;
  try {
    txObject = makeTx(txJson);
  } catch {
    txObject = txJson;
  }
  const binaryBytes = binary.serializeTx(txObject);
  const actualBytes = base16Encode(binaryBytes);
  const expectedBytes = base16Encode(base64Decode(Bytes));
  expect(expectedBytes).toBe(actualBytes);
}
export const longMax = '9223372036854775807';

export function errorMessageByTemplate(field: string, _value?: any) {
  return `tx "${field}" has invalid data. Check tx data.`;
}

export function rndString(len: number) {
  const chars = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'];
  const rndStr = [...Array(len)].map((_i) => chars[(Math.random() * chars.length) | 0]).join('');
  return rndStr;
}
