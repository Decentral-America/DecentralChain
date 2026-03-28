import { base58Decode, publicKey } from '@decentralchain/ts-lib-crypto';
import { type ExchangeTransactionOrder } from '@decentralchain/ts-types';
import { type IBasicParams, type WithProofs, type WithSender } from './transactions';
import { type TPrivateKey, type TSeedTypes } from './types';

export function getSenderPublicKey(
  seedsAndIndexes: [string | TPrivateKey, number | undefined][],
  params: Partial<WithSender>,
) {
  if (params.senderPublicKey != null) return params.senderPublicKey;
  const firstSeed = seedsAndIndexes[0];
  if (!firstSeed) throw new Error('Please provide either seed or senderPublicKey');
  return publicKey(firstSeed[0]);
}

export const base64Prefix = (str: string | null) =>
  str == null || str.slice(0, 7) === 'base64:' ? str : `base64:${str}`;

export function addProof(tx: WithProofs, proof: string, index?: number) {
  if (index == null) {
    if (tx.proofs.length >= 8) throw new Error('Maximum number of proofs (8) exceeded');
    tx.proofs = [...tx.proofs, proof];
    return tx;
  }
  if (!Number.isInteger(index) || index < 0 || index >= 8)
    throw new Error(`Proof index must be an integer between 0 and 7, got: ${index}`);
  if (tx.proofs != null && !!tx.proofs[index])
    throw new Error(`Proof at index ${index} already exists.`);
  for (let i = tx.proofs.length; i < index; i++) tx.proofs.push('');
  tx.proofs[index] = proof;
  return tx;
}

export function convertToPairs(seedObj?: TSeedTypes): [string | TPrivateKey, number | undefined][] {
  //Due to typescript duck typing, 'string' type satisfies IIndexSeedMap interface. Because of this we should typecheck against string first
  if (seedObj == null) {
    return [];
  } else if (typeof seedObj === 'string') {
    return [[seedObj, undefined]];
  } else if ('privateKey' in seedObj) {
    return [[seedObj, undefined]];
  } else if (Array.isArray(seedObj)) {
    return seedObj.map((s, i) => [s, i] as [string, number]).filter(([s, _]) => s);
  } else {
    const keys = Object.keys(seedObj)
      .map((k) => parseInt(k, 10))
      .filter((k) => !Number.isNaN(k))
      .sort();
    return keys.map((k) => [seedObj[k], k] as [string, number]).filter(([s]) => s != null);
  }
}

export const isOrder = (p: object): p is ExchangeTransactionOrder & WithProofs & WithSender =>
  (p as ExchangeTransactionOrder & WithProofs & WithSender).assetPair !== undefined &&
  'orderType' in p &&
  'matcherPublicKey' in p;

export function networkByte(p: number | string | undefined, def: number): number {
  switch (typeof p) {
    case 'string':
      return p.charCodeAt(0);
    case 'number':
      return p;
    default:
      return def;
  }
}

export function fee(params: IBasicParams, def: number) {
  if (params.fee != null) return params.fee;
  if (!params.additionalFee) return def;
  if (params.additionalFee < 0)
    throw new Error(`additionalFee cannot be negative, got: ${params.additionalFee}`);
  return def + params.additionalFee;
}

export function normalizeAssetId(assetId: string | null) {
  // Treat empty string the same as null — both mean "native DCC asset".
  // '' is falsy but NOT nullish, so ?? does not catch it; use explicit check.
  if (assetId == null || assetId === '') return null;
  return assetId.toUpperCase() === 'DCC' ? null : assetId;
}

export function chainIdFromRecipient(recipient: string): number {
  const aliasMatch = /^alias:(.):.+$/.exec(recipient);
  if (aliasMatch) {
    const chainChar = aliasMatch[1];
    if (!chainChar) throw new Error(`Invalid alias: ${recipient}`);
    return chainChar.charCodeAt(0);
  } else {
    try {
      const decoded = base58Decode(recipient);
      return decoded[1] as number;
    } catch (_e) {
      throw new Error(`Invalid recipient: ${recipient}`, { cause: _e });
    }
  }
}
