import { BigNumber } from '@decentralchain/bignumber';
import {
  base16Decode,
  base58Decode,
  base58Encode,
  base64Decode,
  blake2b,
  createAddress,
  verifyAddress,
} from '@decentralchain/crypto';
import { binary, schemas, serializePrimitives } from '@decentralchain/marshall';
import type { Amount, Recipient } from '@decentralchain/protobuf-serialization';
import {
  AmountSchema,
  create,
  DataEntrySchema,
  Order_PriceMode,
  Order_Side,
  OrderSchema,
  RecipientSchema,
  TransactionSchema,
  toBinary,
} from '@decentralchain/protobuf-serialization';
import type { InvokeScriptCallArgument } from '@decentralchain/ts-types';
import { TRANSACTION_TYPE } from '@decentralchain/ts-types';

import { JSONbn } from '../_core/jsonBn';
import type {
  MessageInputCustomData,
  MessageOrder,
  MessageTx,
  MessageTxAlias,
  MessageTxBurn,
  MessageTxCancelLease,
  MessageTxData,
  MessageTxInvokeScript,
  MessageTxIssue,
  MessageTxLease,
  MessageTxMassTransfer,
  MessageTxReissue,
  MessageTxSetAssetScript,
  MessageTxSetScript,
  MessageTxSponsorship,
  MessageTxTransfer,
  MessageTxUpdateAssetInfo,
} from './types';

export function isAddressString(input: string, chainId?: number) {
  try {
    return verifyAddress(base58Decode(input), chainId != null ? { chainId } : {});
  } catch (_err) {
    return false;
  }
}

export function isAlias(input: string) {
  const parts = input.split(':');

  // parts.length === 3 is checked first — parts[0] and parts[2] are guaranteed to exist
  return parts.length === 3 && parts[0] === 'alias' && /^[-_.@0-9a-z]{4,30}$/.test(parts[2] ?? '');
}

export function isBase58(input: string) {
  try {
    base58Decode(input);
    return true;
  } catch {
    return false;
  }
}

export function processAliasOrAddress(recipient: string, chainId: number) {
  return isAddressString(recipient) || isAlias(recipient)
    ? recipient
    : `alias:${String.fromCharCode(chainId)}:${recipient}`;
}

export function makeAuthBytes(data: { host: string; data: string }) {
  // DCC canonical auth domain separator — aligns with @decentralchain/transactions
  // serializeAuthData() and verifyAuthData(). All three SDK auth paths now use
  // the same prefix, making cross-tool signature verification work correctly.
  return Uint8Array.of(
    ...serializePrimitives.LEN(serializePrimitives.SHORT)(serializePrimitives.STRING)(
      'DccWalletAuthentication',
    ),
    ...serializePrimitives.LEN(serializePrimitives.SHORT)(serializePrimitives.STRING)(
      data.host || '',
    ),
    ...serializePrimitives.LEN(serializePrimitives.SHORT)(serializePrimitives.STRING)(
      data.data || '',
    ),
  );
}

export function makeCancelOrderBytes(data: { sender: string; orderId: string }) {
  return Uint8Array.of(...base58Decode(data.sender), ...base58Decode(data.orderId));
}

export function makeCustomDataBytes(data: MessageInputCustomData) {
  if (data.version === 1) {
    return Uint8Array.of(
      0xff,
      0xff,
      0xff,
      data.version,
      ...base64Decode(data.binary.replace(/^base64:/, '')),
    );
  } else if (data.version === 2) {
    return Uint8Array.of(
      0xff,
      0xff,
      0xff,
      data.version,
      ...binary.serializerFromSchema(schemas.txFields.data[1])(data.data),
    );
  } else {
    throw new Error(`Invalid CustomData version: ${(data as { version: unknown }).version}`);
  }
}

function amountToProto(amount: string | number, assetId?: string | null): Amount {
  return create(AmountSchema, {
    amount: amount === 0 ? 0n : BigInt(amount),
    assetId: assetId == null ? new Uint8Array() : base58Decode(assetId),
  });
}

function recipientToProto(recipient: string): Recipient {
  return create(RecipientSchema, {
    recipient: recipient.startsWith('alias')
      ? { case: 'alias', value: recipient.slice(8) }
      : { case: 'publicKeyHash', value: base58Decode(recipient).slice(2, -4) },
  });
}

export function makeOrderBytes(
  order: Omit<MessageOrder, 'id' | 'proofs'> & Partial<Pick<MessageOrder, 'id' | 'proofs'>>,
) {
  return order.version < 4
    ? binary.serializeOrder(order)
    : toBinary(
        OrderSchema,
        create(OrderSchema, {
          amount: BigInt(order.amount),
          assetPair: {
            amountAssetId: order.assetPair.amountAsset
              ? base58Decode(order.assetPair.amountAsset)
              : new Uint8Array(),
            priceAssetId: order.assetPair.priceAsset
              ? base58Decode(order.assetPair.priceAsset)
              : new Uint8Array(),
          },
          chainId: order.chainId,
          expiration: BigInt(order.expiration),
          matcherFee: amountToProto(order.matcherFee, order.matcherFeeAssetId),
          matcherPublicKey: base58Decode(order.matcherPublicKey),
          orderSide: order.orderType === 'sell' ? Order_Side.SELL : Order_Side.BUY,
          price: BigInt(order.price),
          priceMode:
            order.version === 4
              ? ({
                  assetDecimals: Order_PriceMode.ASSET_DECIMALS,
                  fixedDecimals: Order_PriceMode.FIXED_DECIMALS,
                }[order.priceMode] ?? Order_PriceMode.DEFAULT)
              : Order_PriceMode.DEFAULT,
          proofs: order.proofs?.map(base58Decode) ?? [],
          sender: order.eip712Signature
            ? {
                case: 'eip712Signature' as const,
                value: base16Decode(order.eip712Signature.slice(2)),
              }
            : { case: 'senderPublicKey' as const, value: base58Decode(order.senderPublicKey) },
          timestamp: BigInt(order.timestamp),
          version: order.version,
        }),
      );
}

export function makeRequestBytes(request: { senderPublicKey: string; timestamp: number }) {
  return Uint8Array.of(
    ...serializePrimitives.BASE58_STRING(request.senderPublicKey),
    ...serializePrimitives.LONG(request.timestamp),
  );
}

export function makeDccAuthBytes(data: { publicKey: string; timestamp: number }) {
  return Uint8Array.of(
    ...base58Decode(data.publicKey),
    ...serializePrimitives.LONG(data.timestamp),
  );
}

export function makeTxBytes(
  tx:
    | Omit<MessageTxIssue, 'id' | 'initialFee' | 'proofs'>
    | Omit<MessageTxTransfer, 'id' | 'initialFee' | 'initialFeeAssetId' | 'proofs'>
    | Omit<MessageTxReissue, 'id' | 'initialFee' | 'proofs'>
    | Omit<MessageTxBurn, 'id' | 'initialFee' | 'proofs'>
    | Omit<MessageTxLease, 'id' | 'initialFee' | 'proofs'>
    | Omit<MessageTxCancelLease, 'id' | 'initialFee' | 'lease' | 'proofs'>
    | Omit<MessageTxAlias, 'id' | 'initialFee' | 'proofs'>
    | Omit<MessageTxMassTransfer, 'id' | 'initialFee' | 'proofs'>
    | Omit<MessageTxData, 'id' | 'initialFee' | 'proofs'>
    | Omit<MessageTxSetScript, 'id' | 'initialFee' | 'proofs'>
    | Omit<MessageTxSponsorship, 'id' | 'initialFee' | 'proofs'>
    | Omit<MessageTxSetAssetScript, 'id' | 'initialFee' | 'proofs'>
    | Omit<MessageTxInvokeScript, 'id' | 'initialFee' | 'initialFeeAssetId' | 'proofs'>
    | Omit<MessageTxUpdateAssetInfo, 'id' | 'initialFee' | 'proofs'>,
) {
  const protobufCommon = {
    chainId: tx.chainId,
    senderPublicKey: base58Decode(tx.senderPublicKey),
    timestamp: BigInt(tx.timestamp),
    version: tx.version,
  };

  switch (tx.type) {
    case TRANSACTION_TYPE.ISSUE:
      return tx.version < 3
        ? binary.serializeTx(tx)
        : toBinary(
            TransactionSchema,
            create(TransactionSchema, {
              ...protobufCommon,
              data: {
                case: 'issue',
                value: {
                  amount: BigInt(tx.quantity),
                  decimals: tx.decimals || 0,
                  description: tx.description || '',
                  name: tx.name,
                  reissuable: tx.reissuable || false,
                  script: tx.script
                    ? base64Decode(tx.script.replace(/^base64:/, ''))
                    : new Uint8Array(),
                },
              },
              fee: amountToProto(tx.fee),
            }),
          );
    case TRANSACTION_TYPE.TRANSFER:
      return tx.version < 3
        ? binary.serializeTx({ ...tx, attachment: tx.attachment ?? '' })
        : toBinary(
            TransactionSchema,
            create(TransactionSchema, {
              ...protobufCommon,
              data: {
                case: 'transfer',
                value: {
                  amount: amountToProto(tx.amount, tx.assetId),
                  attachment: tx.attachment ? base58Decode(tx.attachment) : new Uint8Array(),
                  recipient: recipientToProto(tx.recipient),
                },
              },
              fee: amountToProto(tx.fee, tx.feeAssetId),
            }),
          );
    case TRANSACTION_TYPE.REISSUE:
      return tx.version < 3
        ? binary.serializeTx(tx)
        : toBinary(
            TransactionSchema,
            create(TransactionSchema, {
              ...protobufCommon,
              data: {
                case: 'reissue',
                value: {
                  assetAmount: amountToProto(tx.quantity, tx.assetId),
                  reissuable: tx.reissuable || false,
                },
              },
              fee: amountToProto(tx.fee),
            }),
          );
    case TRANSACTION_TYPE.BURN:
      return tx.version < 3
        ? binary.serializeTx(tx)
        : toBinary(
            TransactionSchema,
            create(TransactionSchema, {
              ...protobufCommon,
              data: {
                case: 'burn',
                value: {
                  assetAmount: amountToProto(tx.amount, tx.assetId),
                },
              },
              fee: amountToProto(tx.fee),
            }),
          );
    case TRANSACTION_TYPE.LEASE:
      return tx.version < 3
        ? binary.serializeTx(tx)
        : toBinary(
            TransactionSchema,
            create(TransactionSchema, {
              ...protobufCommon,
              data: {
                case: 'lease',
                value: {
                  amount: BigInt(tx.amount),
                  recipient: recipientToProto(tx.recipient),
                },
              },
              fee: amountToProto(tx.fee),
            }),
          );
    case TRANSACTION_TYPE.CANCEL_LEASE:
      return tx.version < 3
        ? binary.serializeTx(tx)
        : toBinary(
            TransactionSchema,
            create(TransactionSchema, {
              ...protobufCommon,
              data: {
                case: 'leaseCancel',
                value: {
                  leaseId: base58Decode(tx.leaseId),
                },
              },
              fee: amountToProto(tx.fee),
            }),
          );
    case TRANSACTION_TYPE.ALIAS:
      return tx.version < 3
        ? binary.serializeTx(tx)
        : toBinary(
            TransactionSchema,
            create(TransactionSchema, {
              ...protobufCommon,
              data: { case: 'createAlias', value: { alias: tx.alias } },
              fee: amountToProto(tx.fee),
            }),
          );
    case TRANSACTION_TYPE.MASS_TRANSFER:
      return tx.version < 2
        ? binary.serializeTx({ ...tx, attachment: tx.attachment ?? '' })
        : toBinary(
            TransactionSchema,
            create(TransactionSchema, {
              ...protobufCommon,
              data: {
                case: 'massTransfer',
                value: {
                  assetId: tx.assetId == null ? new Uint8Array() : base58Decode(tx.assetId),
                  attachment: !tx.attachment ? new Uint8Array() : base58Decode(tx.attachment),
                  transfers: tx.transfers.map((transfer) => ({
                    amount: BigInt(transfer.amount),
                    recipient: recipientToProto(transfer.recipient),
                  })),
                },
              },
              fee: amountToProto(tx.fee),
            }),
          );
    case TRANSACTION_TYPE.DATA:
      return tx.version < 2
        ? binary.serializeTx(tx)
        : toBinary(
            TransactionSchema,
            create(TransactionSchema, {
              ...protobufCommon,
              data: {
                case: 'dataTransaction',
                value: {
                  data: tx.data.map((entry) =>
                    create(DataEntrySchema, {
                      key: entry.key,
                      value:
                        entry.type === 'integer'
                          ? { case: 'intValue', value: BigInt(entry.value) }
                          : entry.type === 'boolean'
                            ? { case: 'boolValue', value: entry.value }
                            : entry.type === 'binary'
                              ? {
                                  case: 'binaryValue',
                                  value: base64Decode(entry.value.replace(/^base64:/, '')),
                                }
                              : entry.type === 'string'
                                ? { case: 'stringValue', value: entry.value }
                                : { case: undefined },
                    }),
                  ),
                },
              },
              fee: amountToProto(tx.fee),
            }),
          );
    case TRANSACTION_TYPE.SET_SCRIPT:
      return tx.version < 2
        ? binary.serializeTx(tx)
        : toBinary(
            TransactionSchema,
            create(TransactionSchema, {
              ...protobufCommon,
              data: {
                case: 'setScript',
                value: {
                  script: tx.script
                    ? base64Decode(tx.script.replace(/^base64:/, ''))
                    : new Uint8Array(),
                },
              },
              fee: amountToProto(tx.fee),
            }),
          );
    case TRANSACTION_TYPE.SET_ASSET_SCRIPT:
      return tx.version < 2
        ? binary.serializeTx(tx)
        : toBinary(
            TransactionSchema,
            create(TransactionSchema, {
              ...protobufCommon,
              data: {
                case: 'setAssetScript',
                value: {
                  assetId: base58Decode(tx.assetId),
                  script: tx.script
                    ? base64Decode(tx.script.replace(/^base64:/, ''))
                    : new Uint8Array(),
                },
              },
              fee: amountToProto(tx.fee),
            }),
          );
    case TRANSACTION_TYPE.SPONSORSHIP:
      return tx.version < 2
        ? binary.serializeTx(tx)
        : toBinary(
            TransactionSchema,
            create(TransactionSchema, {
              ...protobufCommon,
              data: {
                case: 'sponsorFee',
                value: {
                  minFee:
                    tx.minSponsoredAssetFee === null
                      ? amountToProto(0, tx.assetId)
                      : amountToProto(tx.minSponsoredAssetFee, tx.assetId),
                },
              },
              fee: amountToProto(tx.fee),
            }),
          );
    case TRANSACTION_TYPE.INVOKE_SCRIPT:
      return tx.version < 2
        ? binary.serializeTx(tx)
        : toBinary(
            TransactionSchema,
            create(TransactionSchema, {
              ...protobufCommon,
              data: {
                case: 'invokeScript',
                value: {
                  dApp: recipientToProto(tx.dApp),
                  functionCall: binary.serializerFromSchema(schemas.txFields.functionCall[1])(
                    tx.call,
                  ),
                  payments: tx.payment.map(({ amount, assetId }) => amountToProto(amount, assetId)),
                },
              },
              fee: amountToProto(tx.fee, tx.feeAssetId),
            }),
          );
    case TRANSACTION_TYPE.UPDATE_ASSET_INFO:
      return toBinary(
        TransactionSchema,
        create(TransactionSchema, {
          ...protobufCommon,
          data: {
            case: 'updateAssetInfo',
            value: {
              assetId: base58Decode(tx.assetId),
              description: tx.description || '',
              name: tx.name,
            },
          },
          fee: amountToProto(tx.fee),
        }),
      );
  }
}

export function computeHash(bytes: Uint8Array) {
  return blake2b(bytes);
}

export function computeTxHash(bytes: Uint8Array) {
  return computeHash(
    bytes[0] === TRANSACTION_TYPE.ALIAS ? Uint8Array.of(bytes[0], ...bytes.slice(36, -16)) : bytes,
  );
}

export function stringifyOrder(order: MessageOrder, { pretty }: { pretty?: boolean } = {}) {
  const { amount, matcherFee, price, ...otherProps } = order;

  return JSONbn.stringify(
    {
      amount: new BigNumber(amount),
      matcherFee: new BigNumber(matcherFee),
      price: new BigNumber(price),
      sender: base58Encode(createAddress(base58Decode(order.senderPublicKey), order.chainId)),
      ...otherProps,
    },
    undefined,
    pretty ? 2 : undefined,
  );
}

function prepareTransactionForJson(tx: MessageTx) {
  const sender = base58Encode(createAddress(base58Decode(tx.senderPublicKey), tx.chainId));

  switch (tx.type) {
    case TRANSACTION_TYPE.ISSUE: {
      const { fee, initialFee, quantity, ...otherProps } = tx;

      return {
        fee: new BigNumber(fee),
        quantity: new BigNumber(quantity),
        ...otherProps,
        sender,
      };
    }
    case TRANSACTION_TYPE.TRANSFER: {
      const { amount, fee, initialFee, initialFeeAssetId, ...otherProps } = tx;

      return {
        amount: new BigNumber(amount),
        fee: new BigNumber(fee),
        ...otherProps,
        sender,
      };
    }
    case TRANSACTION_TYPE.REISSUE: {
      const { fee, initialFee, quantity, ...otherProps } = tx;

      return {
        fee: new BigNumber(fee),
        quantity: new BigNumber(quantity),
        ...otherProps,
        sender,
      };
    }
    case TRANSACTION_TYPE.BURN: {
      const { amount, fee, initialFee, ...otherProps } = tx;

      return {
        amount: new BigNumber(amount),
        fee: new BigNumber(fee),
        ...otherProps,
        sender,
      };
    }
    case TRANSACTION_TYPE.LEASE: {
      const { amount, fee, initialFee, ...otherProps } = tx;

      return {
        amount: new BigNumber(amount),
        fee: new BigNumber(fee),
        ...otherProps,
        sender,
      };
    }
    case TRANSACTION_TYPE.CANCEL_LEASE: {
      const { fee, initialFee, lease, ...otherProps } = tx;

      return {
        fee: new BigNumber(fee),
        ...otherProps,
        sender,
      };
    }
    case TRANSACTION_TYPE.MASS_TRANSFER: {
      const { fee, initialFee, transfers, ...otherProps } = tx;

      return {
        fee: new BigNumber(fee),
        transfers: transfers.map(({ amount, recipient }) => ({
          amount: new BigNumber(amount),
          recipient,
        })),
        ...otherProps,
        sender,
      };
    }
    case TRANSACTION_TYPE.DATA: {
      const { data, fee, initialFee, ...otherProps } = tx;

      return {
        data: data.map((entry) =>
          entry.type === 'integer' ? { ...entry, value: new BigNumber(entry.value) } : entry,
        ),
        fee: new BigNumber(fee),
        ...otherProps,
        sender,
      };
    }
    case TRANSACTION_TYPE.SPONSORSHIP: {
      const { fee, initialFee, minSponsoredAssetFee, ...otherProps } = tx;

      return {
        fee: new BigNumber(fee),
        minSponsoredAssetFee:
          minSponsoredAssetFee == null ? null : new BigNumber(minSponsoredAssetFee),
        ...otherProps,
        sender,
      };
    }
    case TRANSACTION_TYPE.INVOKE_SCRIPT: {
      const { call, fee, initialFee, payment, ...otherProps } = tx;

      return {
        call: call && {
          ...call,
          args: call.args.map(
            function convertArgToBigNumber(arg): InvokeScriptCallArgument<BigNumber> {
              if (arg.type === 'integer') {
                return { type: arg.type, value: new BigNumber(arg.value) };
              }
              if (arg.type === 'list') {
                return {
                  type: arg.type,
                  value: arg.value.map(convertArgToBigNumber),
                };
              }
              return arg;
            },
          ),
        },
        fee: new BigNumber(fee),
        payment: payment.map((p) => ({ ...p, amount: new BigNumber(p.amount) })),
        ...otherProps,
        sender,
      };
    }
    case TRANSACTION_TYPE.ALIAS:
    case TRANSACTION_TYPE.SET_SCRIPT:
    case TRANSACTION_TYPE.SET_ASSET_SCRIPT:
    case TRANSACTION_TYPE.UPDATE_ASSET_INFO: {
      const { fee, initialFee, ...otherProps } = tx;

      return {
        fee: new BigNumber(fee),
        ...otherProps,
        sender,
      };
    }
  }
}

export function stringifyTransaction(tx: MessageTx, { pretty }: { pretty?: boolean } = {}) {
  return JSONbn.stringify(prepareTransactionForJson(tx), undefined, pretty ? 2 : undefined);
}
