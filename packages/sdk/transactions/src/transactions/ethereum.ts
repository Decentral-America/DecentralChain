/**
 * @module index
 */

import { dccAddress2eth, ethAddress2dcc } from '@decentralchain/node-api';
import {
  base16Decode,
  base16Encode,
  ethereumKeyPair,
  ethereumSign,
  keccak,
  type TBinaryIn,
} from '@decentralchain/ts-lib-crypto';
import { RLP } from '@ethereumjs/rlp';
import { networkByte } from '../generic';

/** The node hard-rejects any other gas price — see EthereumTransaction.scala's GasPrice constant. */
const GAS_PRICE_WEI = 10_000_000_000n;
/** wei -> wavelets divisor — see EthereumTransaction.scala's AmountMultiplier. */
const AMOUNT_MULTIPLIER = 10_000_000_000n;
/** Matches the default DCC fee used by transfer() elsewhere in this SDK. gasLimit IS the fee, verbatim. */
const DEFAULT_FEE = 100_000;

export interface IEthereumTransferParams {
  /** DCC base58 address, or 0x-prefixed 20-byte Ethereum-style hex address. */
  recipient: string;
  /** Transfer amount in wavelets (same unit/semantics as ITransferParams.amount). */
  amount: number;
  chainId?: string | number;
  /**
   * Becomes the transaction's on-chain `timestamp` verbatim (this chain has
   * no separate replay-protection nonce counter) — defaults to Date.now().
   * Reusing the same nonce/timestamp for two transfers from the same key
   * risks them racing on timestamp-based validation; do not hardcode this
   * across multiple calls.
   */
  nonce?: number;
  /** DCC fee in wavelets. Becomes gasLimit verbatim — not a real gas unit. Defaults to 100_000. */
  fee?: number;
}

export interface IEthereumSignedTransaction {
  /** 0x-prefixed signed RLP hex — the sole `params[0]` for eth_sendRawTransaction. */
  raw: string;
  /** 0x-prefixed keccak256(raw) — what eth_sendRawTransaction echoes back and what
   *  eth_getTransactionReceipt / eth_getTransactionByHash expect as input. */
  id: string;
  /** 0x-prefixed 20-byte Ethereum-style sender address. */
  from: string;
  /** DCC base58 address for the same sender (same 26-byte envelope every other tx type uses). */
  fromAddress: string;
}

function recipientToBytes(recipient: string): Uint8Array {
  const hex = /^0x[0-9a-fA-F]{40}$/.test(recipient) ? recipient : dccAddress2eth(recipient);
  return base16Decode(hex.slice(2));
}

/** The 0x-prefixed, 20-byte Ethereum-style hex address for a secp256k1 public key. */
export function ethereumAddressHex(ethPublicKey: TBinaryIn): string {
  return `0x${base16Encode(keccak(ethPublicKey).slice(-20))}`;
}

/**
 * The DCC base58 address (the same 26-byte envelope every other transaction
 * type uses) for a secp256k1 public key — i.e. the account an
 * `ethereumTransfer()` signed with the matching private key sends from.
 * Useful on its own to fund/look up that account before a transaction exists.
 */
export function ethereumAddress(ethPublicKey: TBinaryIn, chainId?: string | number): string {
  return ethAddress2dcc(ethereumAddressHex(ethPublicKey), networkByte(chainId, 63));
}

/**
 * Build and sign a native-DCC-value Ethereum-format (Type 18 / EIP-155)
 * transfer transaction. Only plain transfers are supported — the node
 * requires `data` to be empty and `value` to be non-zero for this shape;
 * ERC20-style and dApp-invocation payloads (non-empty `data`) are out of
 * scope for this builder.
 *
 * Returns the signed raw transaction bytes for `eth_sendRawTransaction`,
 * along with the computed tx id and both address forms of the sender.
 */
export function ethereumTransfer(
  params: IEthereumTransferParams,
  privateKey: TBinaryIn,
): IEthereumSignedTransaction {
  const chainId = networkByte(params.chainId, 63);
  const { ethPrivateKey, ethPublicKey } = ethereumKeyPair(privateKey);

  const nonce = BigInt(params.nonce ?? Date.now());
  const gasLimit = BigInt(params.fee ?? DEFAULT_FEE);
  const value = BigInt(params.amount) * AMOUNT_MULTIPLIER;
  const to = recipientToBytes(params.recipient);
  const data = new Uint8Array(0);

  // EIP-155 unsigned signing payload. `to`/`data` MUST be passed as raw
  // Uint8Array, never bigint/number — encoding a byte-string field as an
  // integer would let RLP silently strip a leading 0x00 byte and corrupt
  // the recipient address (see the round-trip test in ethereum.spec.ts).
  const unsignedFields = [
    nonce,
    GAS_PRICE_WEI,
    gasLimit,
    to,
    value,
    data,
    BigInt(chainId),
    new Uint8Array(0),
    new Uint8Array(0),
  ];
  const { r, s, recovery } = ethereumSign(ethPrivateKey, RLP.encode(unsignedFields));
  const v = BigInt(chainId) * 2n + 35n + BigInt(recovery);

  const signedFields = [nonce, GAS_PRICE_WEI, gasLimit, to, value, data, v, r, s];
  const raw = RLP.encode(signedFields);
  const ethHex = ethereumAddressHex(ethPublicKey);

  return {
    from: ethHex,
    fromAddress: ethAddress2dcc(ethHex, chainId),
    id: `0x${base16Encode(keccak(raw))}`,
    raw: `0x${base16Encode(raw)}`,
  };
}
