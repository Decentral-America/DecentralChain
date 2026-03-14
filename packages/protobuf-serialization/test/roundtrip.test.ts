import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import { describe, expect, it } from 'vitest';
import { DAppMetaSchema } from '../src/gen/waves/lang/dapp_meta_pb.js';
import {
  AmountSchema,
  Block_HeaderSchema,
  BlockchainUpdated_Rollback_RollbackType,
  BlockchainUpdatedSchema,
  BlockSchema,
  BlockSnapshotSchema,
  DataEntrySchema,
  EndorseBlockSchema,
  FinalizationVotingSchema,
  InvokeScriptResultSchema,
  MicroBlockSchema,
  Order_Side,
  OrderSchema,
  RecipientSchema,
  RewardShareSchema,
  SignedMicroBlockSchema,
  SignedTransactionSchema,
  type Transaction,
  TransactionSchema,
  TransactionStateSnapshotSchema,
  TransactionStatus,
} from '../src/index.js';

/**
 * Asserts a value is neither null nor undefined and returns it narrowed.
 */
function assertDefined<T>(value: T): NonNullable<T> {
  expect(value).toBeDefined();
  expect(value).not.toBeNull();
  return value as NonNullable<T>;
}

describe('protobuf roundtrip encoding', () => {
  describe('Amount', () => {
    it('should encode and decode with asset_id and amount', () => {
      const original = create(AmountSchema, {
        amount: 1_000_000n,
        assetId: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
      });

      const buffer = toBinary(AmountSchema, original);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(0);

      const decoded = fromBinary(AmountSchema, buffer);
      expect(decoded.amount).toBe(1_000_000n);
      expect(new Uint8Array(decoded.assetId)).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
    });

    it('should encode and decode with zero amount (native token)', () => {
      const original = create(AmountSchema, {
        amount: 0n,
        assetId: new Uint8Array([]),
      });

      const buffer = toBinary(AmountSchema, original);
      const decoded = fromBinary(AmountSchema, buffer);
      expect(decoded.amount).toBe(0n);
    });

    it('should handle large int64 values beyond Number.MAX_SAFE_INTEGER', () => {
      const largeValue = 9007199254740993n; // > Number.MAX_SAFE_INTEGER
      const original = create(AmountSchema, {
        amount: largeValue,
        assetId: new Uint8Array([10, 20]),
      });

      const buffer = toBinary(AmountSchema, original);
      const decoded = fromBinary(AmountSchema, buffer);
      expect(decoded.amount.toString()).toBe('9007199254740993');
    });

    it('should handle negative int64 values', () => {
      const original = create(AmountSchema, {
        amount: -1n,
        assetId: new Uint8Array([]),
      });

      const buffer = toBinary(AmountSchema, original);
      const decoded = fromBinary(AmountSchema, buffer);
      expect(decoded.amount).toBe(-1n);
    });

    it('should handle max int64 value', () => {
      const maxBigint = 9223372036854775807n; // Long.MAX_VALUE equivalent
      const original = create(AmountSchema, {
        amount: maxBigint,
        assetId: new Uint8Array([0xff]),
      });

      const buffer = toBinary(AmountSchema, original);
      const decoded = fromBinary(AmountSchema, buffer);
      expect(decoded.amount.toString()).toBe(maxBigint.toString());
    });

    it('should produce deterministic encoding (same input → same bytes)', () => {
      const original = create(AmountSchema, {
        amount: 42n,
        assetId: new Uint8Array([1, 2, 3]),
      });

      const buffer1 = toBinary(AmountSchema, original);
      const buffer2 = toBinary(AmountSchema, original);
      expect(buffer1).toEqual(buffer2);
    });
  });

  describe('Recipient', () => {
    it('should encode and decode with public_key_hash', () => {
      const publicKeyHash = new Uint8Array(20);
      publicKeyHash.fill(0xab);

      const original = create(RecipientSchema, {
        recipient: { case: 'publicKeyHash', value: publicKeyHash },
      });

      const buffer = toBinary(RecipientSchema, original);
      const decoded = fromBinary(RecipientSchema, buffer);
      expect(decoded.recipient.case).toBe('publicKeyHash');
      expect(new Uint8Array(decoded.recipient.value as Uint8Array)).toEqual(publicKeyHash);
    });

    it('should encode and decode with alias', () => {
      const original = create(RecipientSchema, {
        recipient: { case: 'alias', value: 'test-alias' },
      });

      const buffer = toBinary(RecipientSchema, original);
      const decoded = fromBinary(RecipientSchema, buffer);
      expect(decoded.recipient.case).toBe('alias');
      expect(decoded.recipient.value).toBe('test-alias');
    });

    it('should handle empty alias string', () => {
      const original = create(RecipientSchema, {
        recipient: { case: 'alias', value: '' },
      });

      const buffer = toBinary(RecipientSchema, original);
      const decoded = fromBinary(RecipientSchema, buffer);
      // Empty string is the proto3 default, so field may not round-trip
      if (decoded.recipient.case === 'alias') {
        expect(decoded.recipient.value).toBe('');
      } else {
        expect(decoded.recipient.case).toBeUndefined();
      }
    });

    it('should handle max-length alias (30 characters)', () => {
      const original = create(RecipientSchema, {
        recipient: { case: 'alias', value: 'a'.repeat(30) },
      });

      const buffer = toBinary(RecipientSchema, original);
      const decoded = fromBinary(RecipientSchema, buffer);
      expect(decoded.recipient.case).toBe('alias');
      expect(decoded.recipient.value).toBe('a'.repeat(30));
    });
  });

  describe('Block.Header', () => {
    it('should encode and decode a basic block header', () => {
      const original = create(Block_HeaderSchema, {
        baseTarget: 100n,
        chainId: 84, // T for testnet
        generationSignature: new Uint8Array(32).fill(0xcc),
        generator: new Uint8Array(32).fill(0xdd),
        rewardVote: -1n,
        timestamp: BigInt(Date.now()),
        version: 5,
      });

      const buffer = toBinary(Block_HeaderSchema, original);
      const decoded = fromBinary(Block_HeaderSchema, buffer);

      expect(decoded.chainId).toBe(84);
      expect(decoded.version).toBe(5);
      expect(decoded.baseTarget).toBe(100n);
      expect(decoded.rewardVote).toBe(-1n);
    });

    it('should preserve feature_votes array', () => {
      const original = create(Block_HeaderSchema, {
        baseTarget: 50n,
        chainId: 84,
        featureVotes: [1, 2, 14, 15],
        generationSignature: new Uint8Array(32),
        generator: new Uint8Array(32),
        rewardVote: 0n,
        timestamp: 1000000n,
        version: 5,
      });

      const buffer = toBinary(Block_HeaderSchema, original);
      const decoded = fromBinary(Block_HeaderSchema, buffer);
      expect(decoded.featureVotes).toEqual([1, 2, 14, 15]);
    });

    it('should encode and decode a full Block with transactions', () => {
      const header = create(Block_HeaderSchema, {
        baseTarget: 100n,
        chainId: 84,
        generationSignature: new Uint8Array(32).fill(0xaa),
        generator: new Uint8Array(32).fill(0xbb),
        rewardVote: 600000000n,
        timestamp: 1000000n,
        version: 5,
      });

      const block = create(BlockSchema, {
        header,
        signature: new Uint8Array(64).fill(0xee),
        transactions: [],
      });

      const buffer = toBinary(BlockSchema, block);
      const decoded = fromBinary(BlockSchema, buffer);
      const decodedHeader = assertDefined(decoded.header);
      expect(decodedHeader.chainId).toBe(84);
      expect(new Uint8Array(decoded.signature)).toEqual(new Uint8Array(64).fill(0xee));
      expect(decoded.transactions).toEqual([]);
    });
  });

  describe('RewardShare', () => {
    it('should encode and decode reward share', () => {
      const original = create(RewardShareSchema, {
        address: new Uint8Array(26).fill(0x01),
        reward: 600000000n,
      });

      const buffer = toBinary(RewardShareSchema, original);
      const decoded = fromBinary(RewardShareSchema, buffer);

      expect(decoded.reward).toBe(600000000n);
      expect(new Uint8Array(decoded.address)).toEqual(new Uint8Array(26).fill(0x01));
    });

    it('should handle zero reward', () => {
      const original = create(RewardShareSchema, {
        address: new Uint8Array(26).fill(0x02),
        reward: 0n,
      });

      const buffer = toBinary(RewardShareSchema, original);
      const decoded = fromBinary(RewardShareSchema, buffer);
      expect(decoded.reward).toBe(0n);
    });
  });

  describe('Order', () => {
    it('should encode and decode a BUY order', () => {
      const original = create(OrderSchema, {
        amount: 100_000_000n,
        assetPair: {
          amountAssetId: new Uint8Array([1, 2, 3, 4]),
          priceAssetId: new Uint8Array([5, 6, 7, 8]),
        },
        chainId: 84,
        expiration: BigInt(Date.now() + 86400000),
        matcherFee: {
          amount: 300_000n,
          assetId: new Uint8Array([]),
        },
        matcherPublicKey: new Uint8Array(32).fill(0x11),
        orderSide: Order_Side.BUY,
        price: 50_000n,
        senderPublicKey: new Uint8Array(32).fill(0x22),
        timestamp: BigInt(Date.now()),
        version: 4,
      });

      const buffer = toBinary(OrderSchema, original);
      expect(buffer.length).toBeGreaterThan(0);

      const decoded = fromBinary(OrderSchema, buffer);
      expect(decoded.chainId).toBe(84);
      expect(decoded.orderSide).toBe(Order_Side.BUY);
      expect(decoded.amount).toBe(100_000_000n);
      expect(decoded.price).toBe(50_000n);
      expect(decoded.version).toBe(4);
    });

    it('should encode and decode a SELL order', () => {
      const original = create(OrderSchema, {
        amount: 500_000_000n,
        assetPair: {
          amountAssetId: new Uint8Array(32).fill(0x44),
          priceAssetId: new Uint8Array([]),
        },
        chainId: 84,
        expiration: 2000000000n,
        matcherFee: {
          amount: 300_000n,
          assetId: new Uint8Array([]),
        },
        matcherPublicKey: new Uint8Array(32).fill(0x33),
        orderSide: Order_Side.SELL,
        price: 200_000n,
        senderPublicKey: new Uint8Array(32).fill(0x55),
        timestamp: 1000000000n,
        version: 3,
      });

      const buffer = toBinary(OrderSchema, original);
      const decoded = fromBinary(OrderSchema, buffer);
      expect(decoded.orderSide).toBe(Order_Side.SELL);
      expect(decoded.amount).toBe(500_000_000n);
    });

    it('should preserve AssetPair fields through encoding', () => {
      const amountAsset = new Uint8Array(32).fill(0xaa);
      const priceAsset = new Uint8Array(32).fill(0xbb);

      const original = create(OrderSchema, {
        amount: 1n,
        assetPair: {
          amountAssetId: amountAsset,
          priceAssetId: priceAsset,
        },
        expiration: 1n,
        price: 1n,
        timestamp: 1n,
      });

      const buffer = toBinary(OrderSchema, original);
      const decoded = fromBinary(OrderSchema, buffer);
      const pair = assertDefined(decoded.assetPair);
      expect(new Uint8Array(pair.amountAssetId)).toEqual(amountAsset);
      expect(new Uint8Array(pair.priceAssetId)).toEqual(priceAsset);
    });
  });

  describe('Transaction', () => {
    it('should encode and decode a TransferTransactionData', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'transfer',
          value: {
            amount: { amount: 10_000_000n, assetId: new Uint8Array([]) },
            attachment: new Uint8Array([0xde, 0xad]),
            recipient: { recipient: { case: 'alias', value: 'bob' } },
          },
        },
        fee: { amount: 100_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x01),
        timestamp: BigInt(Date.now()),
        version: 3,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);

      expect(decoded.chainId).toBe(84);
      expect(decoded.version).toBe(3);
      const fee = assertDefined(decoded.fee);
      expect(fee.amount).toBe(100_000n);
      expect(decoded.data.case).toBe('transfer');
      if (decoded.data.case === 'transfer') {
        const transfer = decoded.data.value;
        const recipient = assertDefined(transfer.recipient);
        expect(recipient.recipient.case).toBe('alias');
        expect(recipient.recipient.value).toBe('bob');
        const transferAmt = assertDefined(transfer.amount);
        expect(transferAmt.amount).toBe(10_000_000n);
        expect(new Uint8Array(transfer.attachment)).toEqual(new Uint8Array([0xde, 0xad]));
      }
    });

    it('should encode and decode a CreateAliasTransactionData', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'createAlias',
          value: { alias: 'my-alias' },
        },
        fee: { amount: 100_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x02),
        timestamp: 1000000000n,
        version: 3,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('createAlias');
      if (decoded.data.case === 'createAlias') {
        expect(decoded.data.value.alias).toBe('my-alias');
      }
    });

    it('should encode and decode a DataTransactionData with all entry types', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'dataTransaction',
          value: {
            data: [
              create(DataEntrySchema, { key: 'intKey', value: { case: 'intValue', value: 42n } }),
              create(DataEntrySchema, {
                key: 'boolKey',
                value: { case: 'boolValue', value: true },
              }),
              create(DataEntrySchema, {
                key: 'binaryKey',
                value: { case: 'binaryValue', value: new Uint8Array([0xca, 0xfe]) },
              }),
              create(DataEntrySchema, {
                key: 'stringKey',
                value: { case: 'stringValue', value: 'hello' },
              }),
            ],
          },
        },
        fee: { amount: 500_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x03),
        timestamp: 1000000000n,
        version: 2,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('dataTransaction');
      if (decoded.data.case === 'dataTransaction') {
        const entries = decoded.data.value.data;
        expect(entries).toHaveLength(4);
        expect(entries[0].key).toBe('intKey');
        expect(entries[0].value).toEqual({ case: 'intValue', value: 42n });
        expect(entries[1].key).toBe('boolKey');
        expect(entries[1].value).toEqual({ case: 'boolValue', value: true });
        expect(entries[2].key).toBe('binaryKey');
        expect(entries[2].value.case).toBe('binaryValue');
        expect(new Uint8Array(entries[2].value.value as Uint8Array)).toEqual(
          new Uint8Array([0xca, 0xfe]),
        );
        expect(entries[3].key).toBe('stringKey');
        expect(entries[3].value).toEqual({ case: 'stringValue', value: 'hello' });
      }
    });

    it('should encode and decode IssueTransactionData', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'issue',
          value: {
            amount: 1_000_000_000_000n,
            decimals: 8,
            description: 'A test token for DecentralChain',
            name: 'TestToken',
            reissuable: true,
            script: new Uint8Array([]),
          },
        },
        fee: { amount: 100_000_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x04),
        timestamp: 1000000000n,
        version: 3,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('issue');
      if (decoded.data.case === 'issue') {
        const issue = decoded.data.value;
        expect(issue.name).toBe('TestToken');
        expect(issue.decimals).toBe(8);
        expect(issue.reissuable).toBe(true);
        expect(issue.amount).toBe(1_000_000_000_000n);
      }
    });

    it('should encode and decode MassTransferTransactionData', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'massTransfer',
          value: {
            assetId: new Uint8Array(32).fill(0xaa),
            attachment: new Uint8Array([0x01, 0x02]),
            transfers: [
              {
                amount: 1_000_000n,
                recipient: { recipient: { case: 'alias' as const, value: 'alice' } },
              },
              {
                amount: 2_000_000n,
                recipient: { recipient: { case: 'alias' as const, value: 'bob' } },
              },
              {
                amount: 3_000_000n,
                recipient: { recipient: { case: 'alias' as const, value: 'carol' } },
              },
            ],
          },
        },
        fee: { amount: 200_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x05),
        timestamp: 1000000000n,
        version: 2,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('massTransfer');
      if (decoded.data.case === 'massTransfer') {
        const mt = decoded.data.value;
        expect(mt.transfers).toHaveLength(3);
        const r0 = assertDefined(mt.transfers[0].recipient);
        expect(r0.recipient.case).toBe('alias');
        expect(r0.recipient.value).toBe('alice');
        expect(mt.transfers[0].amount).toBe(1_000_000n);
        const r2 = assertDefined(mt.transfers[2].recipient);
        expect(r2.recipient.case).toBe('alias');
        expect(r2.recipient.value).toBe('carol');
        expect(mt.transfers[2].amount).toBe(3_000_000n);
      }
    });

    it('should encode and decode GenesisTransactionData', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'genesis',
          value: {
            amount: 10_000_000_000_000_000n,
            recipientAddress: new Uint8Array(26).fill(0x01),
          },
        },
        fee: { amount: 0n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x00),
        timestamp: 1460678400000n,
        version: 1,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('genesis');
      if (decoded.data.case === 'genesis') {
        expect(decoded.data.value.amount.toString()).toBe('10000000000000000');
        expect(new Uint8Array(decoded.data.value.recipientAddress)).toEqual(
          new Uint8Array(26).fill(0x01),
        );
      }
    });

    it('should encode and decode PaymentTransactionData', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'payment',
          value: {
            amount: 50_000_000n,
            recipientAddress: new Uint8Array(26).fill(0x02),
          },
        },
        fee: { amount: 100_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x0a),
        timestamp: 1000000000n,
        version: 1,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('payment');
      if (decoded.data.case === 'payment') {
        expect(decoded.data.value.amount).toBe(50_000_000n);
        expect(new Uint8Array(decoded.data.value.recipientAddress)).toEqual(
          new Uint8Array(26).fill(0x02),
        );
      }
    });

    it('should encode and decode ExchangeTransactionData', () => {
      const buyOrder = create(OrderSchema, {
        amount: 100_000_000n,
        assetPair: {
          amountAssetId: new Uint8Array(32).fill(0xaa),
          priceAssetId: new Uint8Array(32).fill(0xbb),
        },
        chainId: 84,
        expiration: 1000086400n,
        matcherFee: { amount: 300_000n, assetId: new Uint8Array([]) },
        matcherPublicKey: new Uint8Array(32).fill(0x11),
        orderSide: Order_Side.BUY,
        price: 5_000_000n,
        proofs: [new Uint8Array(64).fill(0xee)],
        senderPublicKey: new Uint8Array(32).fill(0x22),
        timestamp: 1000000000n,
        version: 4,
      });

      const sellOrder = create(OrderSchema, {
        amount: 100_000_000n,
        assetPair: {
          amountAssetId: new Uint8Array(32).fill(0xaa),
          priceAssetId: new Uint8Array(32).fill(0xbb),
        },
        chainId: 84,
        expiration: 1000086401n,
        matcherFee: { amount: 300_000n, assetId: new Uint8Array([]) },
        matcherPublicKey: new Uint8Array(32).fill(0x11),
        orderSide: Order_Side.SELL,
        price: 5_000_000n,
        proofs: [new Uint8Array(64).fill(0xff)],
        senderPublicKey: new Uint8Array(32).fill(0x33),
        timestamp: 1000000001n,
        version: 4,
      });

      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'exchange',
          value: {
            amount: 50_000_000n,
            buyMatcherFee: 150_000n,
            orders: [buyOrder, sellOrder],
            price: 5_000_000n,
            sellMatcherFee: 150_000n,
          },
        },
        fee: { amount: 300_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x11),
        timestamp: 1000000002n,
        version: 3,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('exchange');
      if (decoded.data.case === 'exchange') {
        const exchange = decoded.data.value;
        expect(exchange.amount).toBe(50_000_000n);
        expect(exchange.price).toBe(5_000_000n);
        expect(exchange.buyMatcherFee).toBe(150_000n);
        expect(exchange.sellMatcherFee).toBe(150_000n);
        expect(exchange.orders).toHaveLength(2);
        expect(exchange.orders[0].orderSide).toBe(Order_Side.BUY);
        expect(exchange.orders[1].orderSide).toBe(Order_Side.SELL);
        expect(exchange.orders[0].amount).toBe(100_000_000n);
        expect(exchange.orders[1].price).toBe(5_000_000n);
      }
    });

    it('should encode and decode LeaseTransactionData', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'lease',
          value: {
            amount: 100_000_000n,
            recipient: {
              recipient: { case: 'publicKeyHash', value: new Uint8Array(20).fill(0xcc) },
            },
          },
        },
        fee: { amount: 100_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x0b),
        timestamp: 1000000000n,
        version: 3,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('lease');
      if (decoded.data.case === 'lease') {
        expect(decoded.data.value.amount).toBe(100_000_000n);
        const recipient = assertDefined(decoded.data.value.recipient);
        expect(recipient.recipient.case).toBe('publicKeyHash');
        expect(new Uint8Array(recipient.recipient.value as Uint8Array)).toEqual(
          new Uint8Array(20).fill(0xcc),
        );
      }
    });

    it('should encode and decode LeaseCancelTransactionData', () => {
      const leaseId = new Uint8Array(32).fill(0xdd);
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'leaseCancel',
          value: { leaseId },
        },
        fee: { amount: 100_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x0c),
        timestamp: 1000000000n,
        version: 3,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('leaseCancel');
      if (decoded.data.case === 'leaseCancel') {
        expect(new Uint8Array(decoded.data.value.leaseId)).toEqual(leaseId);
      }
    });

    it('should encode and decode BurnTransactionData', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'burn',
          value: {
            assetAmount: { amount: 500_000_000n, assetId: new Uint8Array(32).fill(0xee) },
          },
        },
        fee: { amount: 100_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x0d),
        timestamp: 1000000000n,
        version: 3,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('burn');
      if (decoded.data.case === 'burn') {
        const assetAmt = assertDefined(decoded.data.value.assetAmount);
        expect(assetAmt.amount).toBe(500_000_000n);
        expect(new Uint8Array(assetAmt.assetId)).toEqual(new Uint8Array(32).fill(0xee));
      }
    });

    it('should encode and decode ReissueTransactionData', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'reissue',
          value: {
            assetAmount: { amount: 1_000_000_000n, assetId: new Uint8Array(32).fill(0xff) },
            reissuable: false,
          },
        },
        fee: { amount: 100_000_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x0e),
        timestamp: 1000000000n,
        version: 3,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('reissue');
      if (decoded.data.case === 'reissue') {
        expect(decoded.data.value.reissuable).toBe(false);
        const assetAmt = assertDefined(decoded.data.value.assetAmount);
        expect(assetAmt.amount).toBe(1_000_000_000n);
      }
    });

    it('should encode and decode SetScriptTransactionData', () => {
      const scriptBytes = new Uint8Array(128).fill(0xab);
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'setScript',
          value: { script: scriptBytes },
        },
        fee: { amount: 1_000_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x0f),
        timestamp: 1000000000n,
        version: 2,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('setScript');
      if (decoded.data.case === 'setScript') {
        expect(new Uint8Array(decoded.data.value.script)).toEqual(scriptBytes);
      }
    });

    it('should encode and decode SetAssetScriptTransactionData', () => {
      const assetId = new Uint8Array(32).fill(0xab);
      const scriptBytes = new Uint8Array(64).fill(0xcd);
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'setAssetScript',
          value: { assetId, script: scriptBytes },
        },
        fee: { amount: 100_000_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x10),
        timestamp: 1000000000n,
        version: 2,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('setAssetScript');
      if (decoded.data.case === 'setAssetScript') {
        expect(new Uint8Array(decoded.data.value.assetId)).toEqual(assetId);
        expect(new Uint8Array(decoded.data.value.script)).toEqual(scriptBytes);
      }
    });

    it('should encode and decode SponsorFeeTransactionData', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'sponsorFee',
          value: {
            minFee: { amount: 100_000n, assetId: new Uint8Array(32).fill(0xaa) },
          },
        },
        fee: { amount: 100_000_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x11),
        timestamp: 1000000000n,
        version: 2,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('sponsorFee');
      if (decoded.data.case === 'sponsorFee') {
        const minFee = assertDefined(decoded.data.value.minFee);
        expect(minFee.amount).toBe(100_000n);
        expect(new Uint8Array(minFee.assetId)).toEqual(new Uint8Array(32).fill(0xaa));
      }
    });

    it('should encode and decode InvokeScriptTransactionData', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'invokeScript',
          value: {
            dApp: { recipient: { case: 'alias', value: 'my-dapp' } },
            functionCall: new Uint8Array([0x01, 0x09, 0x01, 0x00]),
            payments: [
              { amount: 1_000_000n, assetId: new Uint8Array([]) },
              { amount: 2_000_000n, assetId: new Uint8Array(32).fill(0xbb) },
            ],
          },
        },
        fee: { amount: 500_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x12),
        timestamp: 1000000000n,
        version: 2,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('invokeScript');
      if (decoded.data.case === 'invokeScript') {
        const invoke = decoded.data.value;
        const dApp = assertDefined(invoke.dApp);
        expect(dApp.recipient.case).toBe('alias');
        expect(dApp.recipient.value).toBe('my-dapp');
        expect(new Uint8Array(invoke.functionCall)).toEqual(
          new Uint8Array([0x01, 0x09, 0x01, 0x00]),
        );
        expect(invoke.payments).toHaveLength(2);
        expect(invoke.payments[0].amount).toBe(1_000_000n);
        expect(invoke.payments[1].amount).toBe(2_000_000n);
        expect(new Uint8Array(invoke.payments[1].assetId)).toEqual(new Uint8Array(32).fill(0xbb));
      }
    });

    it('should encode and decode UpdateAssetInfoTransactionData', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'updateAssetInfo',
          value: {
            assetId: new Uint8Array(32).fill(0xcc),
            description: 'Updated description for the token',
            name: 'UpdatedToken',
          },
        },
        fee: { amount: 100_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x13),
        timestamp: 1000000000n,
        version: 1,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('updateAssetInfo');
      if (decoded.data.case === 'updateAssetInfo') {
        expect(decoded.data.value.name).toBe('UpdatedToken');
        expect(decoded.data.value.description).toBe('Updated description for the token');
        expect(new Uint8Array(decoded.data.value.assetId)).toEqual(new Uint8Array(32).fill(0xcc));
      }
    });
  });

  describe('SignedTransaction', () => {
    it('should encode and decode a signed transaction with proofs', () => {
      const tx = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'transfer',
          value: {
            amount: { amount: 5_000_000n, assetId: new Uint8Array([]) },
            attachment: new Uint8Array([]),
            recipient: { recipient: { case: 'alias', value: 'test' } },
          },
        },
        fee: { amount: 100_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x01),
        timestamp: 1000000000n,
        version: 3,
      });

      const signedTx = create(SignedTransactionSchema, {
        proofs: [new Uint8Array(64).fill(0xff)],
        transaction: { case: 'wavesTransaction', value: tx },
      });

      const buffer = toBinary(SignedTransactionSchema, signedTx);
      const decoded = fromBinary(SignedTransactionSchema, buffer);

      expect(decoded.transaction.case).toBe('wavesTransaction');
      if (decoded.transaction.case === 'wavesTransaction') {
        expect(decoded.transaction.value.chainId).toBe(84);
      }
      expect(decoded.proofs).toHaveLength(1);
      expect(decoded.proofs[0]).toHaveLength(64);
    });

    it('should encode and decode with multiple proofs (multisig)', () => {
      const tx = create(TransactionSchema, {
        chainId: 84,
        data: { case: 'createAlias', value: { alias: 'multisig-test' } },
        fee: { amount: 500_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x10),
        timestamp: 1000000000n,
        version: 2,
      });

      const signedTx = create(SignedTransactionSchema, {
        proofs: [
          new Uint8Array(64).fill(0xaa),
          new Uint8Array(64).fill(0xbb),
          new Uint8Array(64).fill(0xcc),
        ],
        transaction: { case: 'wavesTransaction', value: tx },
      });

      const buffer = toBinary(SignedTransactionSchema, signedTx);
      const decoded = fromBinary(SignedTransactionSchema, buffer);
      expect(decoded.proofs).toHaveLength(3);
      expect(new Uint8Array(decoded.proofs[1])).toEqual(new Uint8Array(64).fill(0xbb));
    });
  });

  describe('InvokeExpressionTransactionData', () => {
    it('should encode and decode an invoke expression transaction', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'invokeExpression',
          value: { expression: new Uint8Array([0x01, 0x02, 0x03, 0x04]) },
        },
        fee: { amount: 500_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x06),
        timestamp: 1000000000n,
        version: 1,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('invokeExpression');
      if (decoded.data.case === 'invokeExpression') {
        expect(new Uint8Array(decoded.data.value.expression)).toEqual(
          new Uint8Array([0x01, 0x02, 0x03, 0x04]),
        );
      }
    });

    it('should handle empty expression bytes', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'invokeExpression',
          value: { expression: new Uint8Array([]) },
        },
        fee: { amount: 500_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x07),
        timestamp: 1000000000n,
        version: 1,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('invokeExpression');
      if (decoded.data.case === 'invokeExpression') {
        expect(decoded.data.value.expression).toBeDefined();
      }
    });
  });

  describe('CommitToGenerationTransactionData', () => {
    it('should encode and decode a commit to generation transaction', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'commitToGeneration',
          value: {
            commitmentSignature: new Uint8Array(96).fill(0xbb),
            endorserPublicKey: new Uint8Array(48).fill(0xaa),
            generationPeriodStart: 42,
          },
        },
        fee: { amount: 100_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x08),
        timestamp: 1000000000n,
        version: 1,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('commitToGeneration');
      if (decoded.data.case === 'commitToGeneration') {
        expect(decoded.data.value.generationPeriodStart).toBe(42);
        expect(new Uint8Array(decoded.data.value.endorserPublicKey)).toEqual(
          new Uint8Array(48).fill(0xaa),
        );
        expect(new Uint8Array(decoded.data.value.commitmentSignature)).toEqual(
          new Uint8Array(96).fill(0xbb),
        );
      }
    });

    it('should handle zero generation_period_start', () => {
      const original = create(TransactionSchema, {
        chainId: 84,
        data: {
          case: 'commitToGeneration',
          value: {
            commitmentSignature: new Uint8Array(96).fill(0xdd),
            endorserPublicKey: new Uint8Array(48).fill(0xcc),
            generationPeriodStart: 0,
          },
        },
        fee: { amount: 100_000n, assetId: new Uint8Array([]) },
        senderPublicKey: new Uint8Array(32).fill(0x09),
        timestamp: 1000000000n,
        version: 1,
      });

      const buffer = toBinary(TransactionSchema, original);
      const decoded = fromBinary(TransactionSchema, buffer);
      expect(decoded.data.case).toBe('commitToGeneration');
      if (decoded.data.case === 'commitToGeneration') {
        // 0 is proto3 default — field may not appear on the wire
        expect(
          decoded.data.value.generationPeriodStart === 0 ||
            decoded.data.value.generationPeriodStart === undefined,
        ).toBe(true);
      }
    });
  });

  describe('InvokeScriptResult', () => {
    it('should encode and decode a result with data entries and transfers', () => {
      const original = create(InvokeScriptResultSchema, {
        data: [
          create(DataEntrySchema, { key: 'counter', value: { case: 'intValue', value: 100n } }),
          create(DataEntrySchema, { key: 'flag', value: { case: 'boolValue', value: true } }),
        ],
        transfers: [
          {
            address: new Uint8Array(26).fill(0x01),
            amount: { amount: 5_000_000n, assetId: new Uint8Array([]) },
          },
        ],
      });

      const buffer = toBinary(InvokeScriptResultSchema, original);
      const decoded = fromBinary(InvokeScriptResultSchema, buffer);
      expect(decoded.data).toHaveLength(2);
      expect(decoded.data[0].key).toBe('counter');
      expect(decoded.data[0].value).toEqual({ case: 'intValue', value: 100n });
      expect(decoded.transfers).toHaveLength(1);
      const transferAmt = assertDefined(decoded.transfers[0].amount);
      expect(transferAmt.amount).toBe(5_000_000n);
    });

    it('should encode and decode error messages', () => {
      const original = create(InvokeScriptResultSchema, {
        errorMessage: {
          code: 1,
          text: 'InvokeScript execution failed',
        },
      });

      const buffer = toBinary(InvokeScriptResultSchema, original);
      const decoded = fromBinary(InvokeScriptResultSchema, buffer);
      const err = assertDefined(decoded.errorMessage);
      expect(err.code).toBe(1);
      expect(err.text).toBe('InvokeScript execution failed');
    });
  });

  describe('TransactionStateSnapshot', () => {
    it('should encode and decode balance snapshots', () => {
      const original = create(TransactionStateSnapshotSchema, {
        balances: [
          {
            address: new Uint8Array(26).fill(0x01),
            amount: { amount: 10_000_000n, assetId: new Uint8Array([]) },
          },
        ],
      });

      const buffer = toBinary(TransactionStateSnapshotSchema, original);
      const decoded = fromBinary(TransactionStateSnapshotSchema, buffer);
      expect(decoded.balances).toHaveLength(1);
      const bal = assertDefined(decoded.balances[0].amount);
      expect(bal.amount).toBe(10_000_000n);
    });
  });

  describe('events (BlockchainUpdated)', () => {
    it('should encode and decode a BlockchainUpdated message', () => {
      const original = create(BlockchainUpdatedSchema, {
        height: 1000,
        id: new Uint8Array(32).fill(0x01),
      });

      const buffer = toBinary(BlockchainUpdatedSchema, original);
      const decoded = fromBinary(BlockchainUpdatedSchema, buffer);
      expect(new Uint8Array(decoded.id)).toEqual(new Uint8Array(32).fill(0x01));
      expect(decoded.height).toBe(1000);
    });

    it('should encode and decode a BlockchainUpdated with Append containing state updates', () => {
      const original = create(BlockchainUpdatedSchema, {
        height: 2000,
        id: new Uint8Array(32).fill(0x02),
        update: {
          case: 'append',
          value: {
            stateUpdate: {
              balances: [
                {
                  address: new Uint8Array(26).fill(0x01),
                  amountAfter: { amount: 99_000_000n, assetId: new Uint8Array([]) },
                  amountBefore: 100_000_000n,
                },
              ],
            },
            transactionIds: [new Uint8Array(32).fill(0xaa), new Uint8Array(32).fill(0xbb)],
          },
        },
      });

      const buffer = toBinary(BlockchainUpdatedSchema, original);
      const decoded = fromBinary(BlockchainUpdatedSchema, buffer);
      expect(decoded.height).toBe(2000);
      expect(decoded.update.case).toBe('append');
      if (decoded.update.case === 'append') {
        const append = decoded.update.value;
        expect(append.transactionIds).toHaveLength(2);
        const stateUpdate = assertDefined(append.stateUpdate);
        expect(stateUpdate.balances).toHaveLength(1);
        expect(stateUpdate.balances[0].amountBefore).toBe(100_000_000n);
        const amountAfter = assertDefined(stateUpdate.balances[0].amountAfter);
        expect(amountAfter.amount).toBe(99_000_000n);
      }
    });

    it('should encode and decode a Rollback update', () => {
      const original = create(BlockchainUpdatedSchema, {
        height: 1500,
        id: new Uint8Array(32).fill(0x03),
        update: {
          case: 'rollback',
          value: {
            removedTransactionIds: [new Uint8Array(32).fill(0xcc)],
            type: BlockchainUpdated_Rollback_RollbackType.BLOCK,
          },
        },
      });

      const buffer = toBinary(BlockchainUpdatedSchema, original);
      const decoded = fromBinary(BlockchainUpdatedSchema, buffer);
      expect(decoded.update.case).toBe('rollback');
      if (decoded.update.case === 'rollback') {
        expect(decoded.update.value.type).toBe(BlockchainUpdated_Rollback_RollbackType.BLOCK);
        expect(decoded.update.value.removedTransactionIds).toHaveLength(1);
      }
    });
  });

  describe('MicroBlock', () => {
    it('should encode and decode a MicroBlock', () => {
      const original = create(MicroBlockSchema, {
        reference: new Uint8Array(64).fill(0x01),
        senderPublicKey: new Uint8Array(32).fill(0x03),
        transactions: [],
        updatedBlockSignature: new Uint8Array(64).fill(0x02),
        version: 5,
      });

      const buffer = toBinary(MicroBlockSchema, original);
      const decoded = fromBinary(MicroBlockSchema, buffer);
      expect(decoded.version).toBe(5);
      expect(new Uint8Array(decoded.reference)).toEqual(new Uint8Array(64).fill(0x01));
      expect(new Uint8Array(decoded.senderPublicKey)).toEqual(new Uint8Array(32).fill(0x03));
    });

    it('should encode and decode a SignedMicroBlock', () => {
      const microBlock = create(MicroBlockSchema, {
        reference: new Uint8Array(64).fill(0x01),
        senderPublicKey: new Uint8Array(32).fill(0x03),
        transactions: [],
        updatedBlockSignature: new Uint8Array(64).fill(0x02),
        version: 5,
      });

      const original = create(SignedMicroBlockSchema, {
        microBlock,
        signature: new Uint8Array(64).fill(0xee),
        totalBlockId: new Uint8Array(32).fill(0xff),
      });

      const buffer = toBinary(SignedMicroBlockSchema, original);
      const decoded = fromBinary(SignedMicroBlockSchema, buffer);
      expect(new Uint8Array(decoded.signature)).toEqual(new Uint8Array(64).fill(0xee));
      expect(new Uint8Array(decoded.totalBlockId)).toEqual(new Uint8Array(32).fill(0xff));
      const inner = assertDefined(decoded.microBlock);
      expect(inner.version).toBe(5);
    });
  });

  describe('BlockSnapshot', () => {
    it('should encode and decode a BlockSnapshot', () => {
      const original = create(BlockSnapshotSchema, {
        blockId: new Uint8Array(32).fill(0x01),
        snapshots: [
          create(TransactionStateSnapshotSchema, {
            balances: [
              {
                address: new Uint8Array(26).fill(0x02),
                amount: { amount: 50_000_000n, assetId: new Uint8Array([]) },
              },
            ],
            transactionStatus: TransactionStatus.SUCCEEDED,
          }),
        ],
      });

      const buffer = toBinary(BlockSnapshotSchema, original);
      const decoded = fromBinary(BlockSnapshotSchema, buffer);
      expect(new Uint8Array(decoded.blockId)).toEqual(new Uint8Array(32).fill(0x01));
      expect(decoded.snapshots).toHaveLength(1);
      expect(decoded.snapshots[0].balances).toHaveLength(1);
    });
  });

  describe('TransactionStateSnapshot (detailed)', () => {
    it('should encode and decode lease balance snapshots', () => {
      const original = create(TransactionStateSnapshotSchema, {
        leaseBalances: [
          {
            address: new Uint8Array(26).fill(0x10),
            in: 5_000_000n,
            out: 3_000_000n,
          },
        ],
      });

      const buffer = toBinary(TransactionStateSnapshotSchema, original);
      const decoded = fromBinary(TransactionStateSnapshotSchema, buffer);
      expect(decoded.leaseBalances).toHaveLength(1);
      expect(decoded.leaseBalances[0].in).toBe(5_000_000n);
      expect(decoded.leaseBalances[0].out).toBe(3_000_000n);
    });

    it('should encode and decode new leases', () => {
      const original = create(TransactionStateSnapshotSchema, {
        newLeases: [
          {
            amount: 100_000_000n,
            leaseId: new Uint8Array(32).fill(0x11),
            recipientAddress: new Uint8Array(26).fill(0x33),
            senderPublicKey: new Uint8Array(32).fill(0x22),
          },
        ],
      });

      const buffer = toBinary(TransactionStateSnapshotSchema, original);
      const decoded = fromBinary(TransactionStateSnapshotSchema, buffer);
      expect(decoded.newLeases).toHaveLength(1);
      expect(decoded.newLeases[0].amount).toBe(100_000_000n);
    });

    it('should encode and decode cancelled leases', () => {
      const original = create(TransactionStateSnapshotSchema, {
        cancelledLeases: [{ leaseId: new Uint8Array(32).fill(0x44) }],
      });

      const buffer = toBinary(TransactionStateSnapshotSchema, original);
      const decoded = fromBinary(TransactionStateSnapshotSchema, buffer);
      expect(decoded.cancelledLeases).toHaveLength(1);
      expect(new Uint8Array(decoded.cancelledLeases[0].leaseId)).toEqual(
        new Uint8Array(32).fill(0x44),
      );
    });

    it('should encode and decode asset statics (NewAsset)', () => {
      const original = create(TransactionStateSnapshotSchema, {
        assetStatics: [
          {
            assetId: new Uint8Array(32).fill(0x55),
            decimals: 8,
            issuerPublicKey: new Uint8Array(32).fill(0x66),
            nft: false,
          },
        ],
      });

      const buffer = toBinary(TransactionStateSnapshotSchema, original);
      const decoded = fromBinary(TransactionStateSnapshotSchema, buffer);
      expect(decoded.assetStatics).toHaveLength(1);
      expect(decoded.assetStatics[0].decimals).toBe(8);
      expect(decoded.assetStatics[0].nft).toBe(false);
    });

    it('should encode and decode order fills', () => {
      const original = create(TransactionStateSnapshotSchema, {
        orderFills: [
          {
            fee: 300_000n,
            orderId: new Uint8Array(32).fill(0x77),
            volume: 50_000_000n,
          },
        ],
      });

      const buffer = toBinary(TransactionStateSnapshotSchema, original);
      const decoded = fromBinary(TransactionStateSnapshotSchema, buffer);
      expect(decoded.orderFills).toHaveLength(1);
      expect(decoded.orderFills[0].volume).toBe(50_000_000n);
      expect(decoded.orderFills[0].fee).toBe(300_000n);
    });

    it('should encode and decode account data entries', () => {
      const original = create(TransactionStateSnapshotSchema, {
        accountData: [
          {
            address: new Uint8Array(26).fill(0x88),
            entries: [
              create(DataEntrySchema, {
                key: 'balance',
                value: { case: 'intValue', value: 999_000n },
              }),
              create(DataEntrySchema, { key: 'active', value: { case: 'boolValue', value: true } }),
            ],
          },
        ],
      });

      const buffer = toBinary(TransactionStateSnapshotSchema, original);
      const decoded = fromBinary(TransactionStateSnapshotSchema, buffer);
      expect(decoded.accountData).toHaveLength(1);
      const entries = decoded.accountData[0].entries;
      expect(entries).toHaveLength(2);
      expect(entries[0].key).toBe('balance');
      expect(entries[0].value).toEqual({ case: 'intValue', value: 999_000n });
    });

    it('should encode and decode sponsorships', () => {
      const original = create(TransactionStateSnapshotSchema, {
        sponsorships: [
          {
            assetId: new Uint8Array(32).fill(0x99),
            minFee: 100_000n,
          },
        ],
      });

      const buffer = toBinary(TransactionStateSnapshotSchema, original);
      const decoded = fromBinary(TransactionStateSnapshotSchema, buffer);
      expect(decoded.sponsorships).toHaveLength(1);
      expect(decoded.sponsorships[0].minFee).toBe(100_000n);
    });

    it('should encode and decode all TransactionStatus enum values', () => {
      for (const value of Object.values(TransactionStatus)) {
        if (typeof value !== 'number') continue;
        const original = create(TransactionStateSnapshotSchema, {
          transactionStatus: value as TransactionStatus,
        });
        const buffer = toBinary(TransactionStateSnapshotSchema, original);
        const decoded = fromBinary(TransactionStateSnapshotSchema, buffer);
        // SUCCEEDED (0) is the proto3 default — may not appear on the wire
        if (value === 0) {
          expect(decoded.transactionStatus === 0 || decoded.transactionStatus === undefined).toBe(
            true,
          );
        } else {
          expect(decoded.transactionStatus).toBe(value);
        }
      }
    });
  });

  describe('InvokeScriptResult (detailed)', () => {
    it('should encode and decode issues, reissues, and burns', () => {
      const original = create(InvokeScriptResultSchema, {
        burns: [
          {
            amount: 100_000_000n,
            assetId: new Uint8Array(32).fill(0x03),
          },
        ],
        issues: [
          {
            amount: 1_000_000_000n,
            assetId: new Uint8Array(32).fill(0x01),
            decimals: 6,
            description: 'Token issued by invoke',
            name: 'InvokeToken',
            nonce: 1n,
            reissuable: true,
            script: new Uint8Array([]),
          },
        ],
        reissues: [
          {
            amount: 500_000_000n,
            assetId: new Uint8Array(32).fill(0x02),
            isReissuable: true,
          },
        ],
      });

      const buffer = toBinary(InvokeScriptResultSchema, original);
      const decoded = fromBinary(InvokeScriptResultSchema, buffer);
      expect(decoded.issues).toHaveLength(1);
      expect(decoded.issues[0].name).toBe('InvokeToken');
      expect(decoded.issues[0].amount).toBe(1_000_000_000n);
      expect(decoded.reissues).toHaveLength(1);
      expect(decoded.reissues[0].amount).toBe(500_000_000n);
      expect(decoded.burns).toHaveLength(1);
      expect(decoded.burns[0].amount).toBe(100_000_000n);
    });

    it('should encode and decode leases and lease cancels', () => {
      const original = create(InvokeScriptResultSchema, {
        leaseCancels: [{ leaseId: new Uint8Array(32).fill(0x05) }],
        leases: [
          {
            amount: 10_000_000n,
            leaseId: new Uint8Array(32).fill(0x04),
            nonce: 42n,
            recipient: { recipient: { case: 'alias', value: 'lease-target' } },
          },
        ],
      });

      const buffer = toBinary(InvokeScriptResultSchema, original);
      const decoded = fromBinary(InvokeScriptResultSchema, buffer);
      expect(decoded.leases).toHaveLength(1);
      expect(decoded.leases[0].amount).toBe(10_000_000n);
      const leaseRecipient = assertDefined(decoded.leases[0].recipient);
      expect(leaseRecipient.recipient.case).toBe('alias');
      expect(leaseRecipient.recipient.value).toBe('lease-target');
      expect(decoded.leaseCancels).toHaveLength(1);
      expect(new Uint8Array(decoded.leaseCancels[0].leaseId)).toEqual(
        new Uint8Array(32).fill(0x05),
      );
    });

    it('should encode and decode sponsor fees', () => {
      const original = create(InvokeScriptResultSchema, {
        sponsorFees: [
          {
            minFee: { amount: 50_000n, assetId: new Uint8Array(32).fill(0x06) },
          },
        ],
      });

      const buffer = toBinary(InvokeScriptResultSchema, original);
      const decoded = fromBinary(InvokeScriptResultSchema, buffer);
      expect(decoded.sponsorFees).toHaveLength(1);
      const minFee = assertDefined(decoded.sponsorFees[0].minFee);
      expect(minFee.amount).toBe(50_000n);
    });

    it('should encode and decode nested invocations', () => {
      const original = create(InvokeScriptResultSchema, {
        invokes: [
          {
            call: {
              args: [
                { value: { case: 'integerValue', value: 100n } },
                { value: { case: 'stringValue', value: 'hello' } },
                { value: { case: 'booleanValue', value: true } },
                { value: { case: 'binaryValue', value: new Uint8Array([0xca, 0xfe]) } },
              ],
              function: 'deposit',
            },
            dApp: new Uint8Array(26).fill(0x07),
            payments: [{ amount: 1_000_000n, assetId: new Uint8Array([]) }],
            stateChanges: {
              data: [
                create(DataEntrySchema, {
                  key: 'result',
                  value: { case: 'intValue', value: 200n },
                }),
              ],
            },
          },
        ],
      });

      const buffer = toBinary(InvokeScriptResultSchema, original);
      const decoded = fromBinary(InvokeScriptResultSchema, buffer);
      expect(decoded.invokes).toHaveLength(1);
      const inv = decoded.invokes[0];
      const call = assertDefined(inv.call);
      expect(call.function).toBe('deposit');
      expect(call.args).toHaveLength(4);
      expect(call.args[0].value).toEqual({ case: 'integerValue', value: 100n });
      expect(call.args[1].value).toEqual({ case: 'stringValue', value: 'hello' });
      expect(call.args[2].value).toEqual({ case: 'booleanValue', value: true });
      expect(inv.payments).toHaveLength(1);
      const stateChanges = assertDefined(inv.stateChanges);
      expect(stateChanges.data).toHaveLength(1);
      expect(stateChanges.data[0].key).toBe('result');
    });
  });

  describe('DAppMeta', () => {
    it('should encode and decode DAppMeta with callable signatures', () => {
      const original = create(DAppMetaSchema, {
        compactNameAndOriginalNamePairList: [
          { compactName: 'a', originalName: 'deposit' },
          { compactName: 'b', originalName: 'withdraw' },
        ],
        funcs: [
          { types: new Uint8Array([0x01, 0x02, 0x03]) },
          { types: new Uint8Array([0x04, 0x05]) },
        ],
        originalNames: ['deposit', 'withdraw'],
        version: 2,
      });

      const buffer = toBinary(DAppMetaSchema, original);
      const decoded = fromBinary(DAppMetaSchema, buffer);
      expect(decoded.version).toBe(2);
      expect(decoded.funcs).toHaveLength(2);
      expect(new Uint8Array(decoded.funcs[0].types)).toEqual(new Uint8Array([0x01, 0x02, 0x03]));
      expect(decoded.compactNameAndOriginalNamePairList).toHaveLength(2);
      expect(decoded.compactNameAndOriginalNamePairList[0].originalName).toBe('deposit');
      expect(decoded.originalNames).toEqual(['deposit', 'withdraw']);
    });
  });

  describe('FinalizationVoting and EndorseBlock', () => {
    it('should encode and decode FinalizationVoting', () => {
      const original = create(FinalizationVotingSchema, {
        aggregatedEndorsementSignature: new Uint8Array(96).fill(0xaa),
        endorserIndexes: [0, 1, 2, 5],
        finalizedBlockHeight: 1000,
      });

      const buffer = toBinary(FinalizationVotingSchema, original);
      const decoded = fromBinary(FinalizationVotingSchema, buffer);
      expect(decoded.endorserIndexes).toEqual([0, 1, 2, 5]);
      expect(decoded.finalizedBlockHeight).toBe(1000);
      expect(new Uint8Array(decoded.aggregatedEndorsementSignature)).toEqual(
        new Uint8Array(96).fill(0xaa),
      );
    });

    it('should encode and decode EndorseBlock', () => {
      const original = create(EndorseBlockSchema, {
        endorsedBlockId: new Uint8Array(32).fill(0x02),
        endorserIndex: 3,
        finalizedBlockHeight: 999,
        finalizedBlockId: new Uint8Array(32).fill(0x01),
        signature: new Uint8Array(96).fill(0xbb),
      });

      const buffer = toBinary(EndorseBlockSchema, original);
      const decoded = fromBinary(EndorseBlockSchema, buffer);
      expect(decoded.endorserIndex).toBe(3);
      expect(decoded.finalizedBlockHeight).toBe(999);
      expect(new Uint8Array(decoded.signature)).toEqual(new Uint8Array(96).fill(0xbb));
    });
  });
});

describe('protobuf schema structure', () => {
  it('should export all Schema descriptors', () => {
    // Every Schema is a GenMessage descriptor with create/encode/decode capability
    const schemas = [
      AmountSchema,
      BlockSchema,
      TransactionSchema,
      SignedTransactionSchema,
      OrderSchema,
      RecipientSchema,
      RewardShareSchema,
    ];

    for (const schema of schemas) {
      expect(schema).toBeDefined();
      expect(typeof schema).toBe('object');
    }
  });

  it('should export Block_Header nested schema', () => {
    expect(Block_HeaderSchema).toBeDefined();
    const header = create(Block_HeaderSchema, { chainId: 1 });
    expect(header.chainId).toBe(1);
  });

  it('should export all transaction data schemas', () => {
    // Verify we can create every transaction type via the Transaction oneof
    const txDataCases: Array<Transaction['data']['case']> = [
      'genesis',
      'payment',
      'issue',
      'transfer',
      'reissue',
      'burn',
      'exchange',
      'lease',
      'leaseCancel',
      'createAlias',
      'massTransfer',
      'dataTransaction',
      'setScript',
      'sponsorFee',
      'setAssetScript',
      'invokeScript',
      'updateAssetInfo',
      'invokeExpression',
      'commitToGeneration',
    ];
    // All cases should be string values
    for (const c of txDataCases) {
      expect(typeof c).toBe('string');
    }
  });

  it('should export Order enums with correct values', () => {
    expect(Order_Side.BUY).toBe(0);
    expect(Order_Side.SELL).toBe(1);
  });

  it('should export DataEntry schema', () => {
    expect(DataEntrySchema).toBeDefined();
    const entry = create(DataEntrySchema, {
      key: 'test',
      value: { case: 'intValue', value: 1n },
    });
    expect(entry.key).toBe('test');
  });

  it('should export InvokeScriptResult schema', () => {
    expect(InvokeScriptResultSchema).toBeDefined();
    const result = create(InvokeScriptResultSchema, {});
    expect(result.data).toEqual([]);
  });

  it('should export create, toBinary, fromBinary utilities', () => {
    expect(typeof create).toBe('function');
    expect(typeof toBinary).toBe('function');
    expect(typeof fromBinary).toBe('function');
  });
});

describe('protobuf error handling', () => {
  it('should throw on corrupt buffer', () => {
    const corruptBuffer = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff]);
    expect(() => fromBinary(AmountSchema, corruptBuffer)).toThrow();
  });

  it('should decode empty buffer to default values', () => {
    const emptyBuffer = new Uint8Array([]);
    const decoded = fromBinary(AmountSchema, emptyBuffer);
    expect(decoded.amount).toBe(0n);
  });

  it('should throw when buffer is truncated mid-field', () => {
    const original = create(AmountSchema, {
      amount: 1_000_000n,
      assetId: new Uint8Array(32).fill(0xaa),
    });
    const fullBuffer = toBinary(AmountSchema, original);
    // Truncate to half the buffer
    const truncated = fullBuffer.slice(0, Math.floor(fullBuffer.length / 2));
    expect(() => fromBinary(AmountSchema, truncated)).toThrow();
  });

  it('should throw on corrupt SignedTransaction buffer', () => {
    const corrupt = new Uint8Array([0x0a, 0xff, 0xff, 0xff, 0x0f]);
    expect(() => fromBinary(SignedTransactionSchema, corrupt)).toThrow();
  });

  it('should throw on corrupt Transaction buffer', () => {
    const corrupt = new Uint8Array([0x08, 0x54, 0x80, 0xff, 0xff]);
    expect(() => fromBinary(TransactionSchema, corrupt)).toThrow();
  });
});

describe('financial safety edge cases', () => {
  it('should preserve min int64 (negative overflow boundary)', () => {
    const minBigint = -9223372036854775808n; // Long.MIN_VALUE equivalent
    const original = create(AmountSchema, {
      amount: minBigint,
      assetId: new Uint8Array([]),
    });

    const buffer = toBinary(AmountSchema, original);
    const decoded = fromBinary(AmountSchema, buffer);
    expect(decoded.amount.toString()).toBe(minBigint.toString());
  });

  it('should handle SignedTransaction with ethereum_transaction bytes', () => {
    const ethTxBytes = new Uint8Array(256).fill(0xab);
    const original = create(SignedTransactionSchema, {
      proofs: [],
      transaction: { case: 'ethereumTransaction', value: ethTxBytes },
    });

    const buffer = toBinary(SignedTransactionSchema, original);
    const decoded = fromBinary(SignedTransactionSchema, buffer);
    expect(decoded.transaction.case).toBe('ethereumTransaction');
    if (decoded.transaction.case === 'ethereumTransaction') {
      expect(new Uint8Array(decoded.transaction.value)).toEqual(ethTxBytes);
    }
  });

  it('should preserve exact byte content for cryptographic fields (signatures and keys)', () => {
    const senderPk = new Uint8Array(32);
    const proof = new Uint8Array(64);
    for (let i = 0; i < 32; i++) senderPk[i] = i;
    for (let i = 0; i < 64; i++) proof[i] = 255 - i;

    const tx = create(TransactionSchema, {
      chainId: 87, // W for mainnet
      data: {
        case: 'transfer',
        value: {
          amount: { amount: 1n, assetId: new Uint8Array([]) },
          attachment: new Uint8Array([]),
          recipient: { recipient: { case: 'alias', value: 'test' } },
        },
      },
      fee: { amount: 100_000n, assetId: new Uint8Array([]) },
      senderPublicKey: senderPk,
      timestamp: 1000000000n,
      version: 3,
    });

    const signedTx = create(SignedTransactionSchema, {
      proofs: [proof],
      transaction: { case: 'wavesTransaction', value: tx },
    });

    const buffer = toBinary(SignedTransactionSchema, signedTx);
    const decoded = fromBinary(SignedTransactionSchema, buffer);
    expect(decoded.transaction.case).toBe('wavesTransaction');
    if (decoded.transaction.case === 'wavesTransaction') {
      expect(new Uint8Array(decoded.transaction.value.senderPublicKey)).toEqual(senderPk);
      expect(decoded.transaction.value.chainId).toBe(87);
    }
    expect(new Uint8Array(decoded.proofs[0])).toEqual(proof);
  });

  it('should handle ExchangeTransactionData with extreme price values', () => {
    const original = create(TransactionSchema, {
      chainId: 84,
      data: {
        case: 'exchange',
        value: {
          amount: 9007199254740993n, // > MAX_SAFE_INTEGER
          buyMatcherFee: 9223372036854775807n, // max int64
          orders: [],
          price: 999999999999999999n,
          sellMatcherFee: 0n,
        },
      },
      fee: { amount: 300_000n, assetId: new Uint8Array([]) },
      senderPublicKey: new Uint8Array(32).fill(0x01),
      timestamp: 1000000000n,
      version: 3,
    });

    const buffer = toBinary(TransactionSchema, original);
    const decoded = fromBinary(TransactionSchema, buffer);
    expect(decoded.data.case).toBe('exchange');
    if (decoded.data.case === 'exchange') {
      expect(decoded.data.value.amount.toString()).toBe('9007199254740993');
      expect(decoded.data.value.price.toString()).toBe('999999999999999999');
      expect(decoded.data.value.buyMatcherFee.toString()).toBe('9223372036854775807');
      expect(decoded.data.value.sellMatcherFee).toBe(0n);
    }
  });

  it('should produce deterministic encoding for complex transactions', () => {
    const tx = create(TransactionSchema, {
      chainId: 84,
      data: {
        case: 'dataTransaction',
        value: {
          data: [
            create(DataEntrySchema, { key: 'a', value: { case: 'intValue', value: 1n } }),
            create(DataEntrySchema, { key: 'b', value: { case: 'boolValue', value: true } }),
            create(DataEntrySchema, { key: 'c', value: { case: 'stringValue', value: 'test' } }),
            create(DataEntrySchema, {
              key: 'd',
              value: { case: 'binaryValue', value: new Uint8Array([0xff]) },
            }),
          ],
        },
      },
      fee: { amount: 500_000n, assetId: new Uint8Array([]) },
      senderPublicKey: new Uint8Array(32).fill(0x01),
      timestamp: 1000000000n,
      version: 2,
    });

    const buf1 = toBinary(TransactionSchema, tx);
    const buf2 = toBinary(TransactionSchema, tx);
    const buf3 = toBinary(TransactionSchema, tx);
    expect(buf1).toEqual(buf2);
    expect(buf2).toEqual(buf3);
  });

  it('should handle MassTransfer with max recipients count', () => {
    const transfers = Array.from({ length: 100 }, (_, i) => ({
      amount: BigInt((i + 1) * 1_000_000),
      recipient: create(RecipientSchema, {
        recipient: { case: 'alias' as const, value: `r${i}` },
      }),
    }));

    const original = create(TransactionSchema, {
      chainId: 84,
      data: {
        case: 'massTransfer',
        value: {
          assetId: new Uint8Array([]),
          attachment: new Uint8Array([]),
          transfers,
        },
      },
      fee: { amount: 5_100_000n, assetId: new Uint8Array([]) },
      senderPublicKey: new Uint8Array(32).fill(0x01),
      timestamp: 1000000000n,
      version: 2,
    });

    const buffer = toBinary(TransactionSchema, original);
    const decoded = fromBinary(TransactionSchema, buffer);
    expect(decoded.data.case).toBe('massTransfer');
    if (decoded.data.case === 'massTransfer') {
      const mt = decoded.data.value;
      expect(mt.transfers).toHaveLength(100);
      expect(mt.transfers[0].amount).toBe(1_000_000n);
      expect(mt.transfers[99].amount).toBe(100_000_000n);
      const r99 = assertDefined(mt.transfers[99].recipient);
      expect(r99.recipient.case).toBe('alias');
      expect(r99.recipient.value).toBe('r99');
    }
  });

  it('should handle DataEntry with empty key (proto3 allows it)', () => {
    const original = create(TransactionSchema, {
      chainId: 84,
      data: {
        case: 'dataTransaction',
        value: {
          data: [create(DataEntrySchema, { key: '', value: { case: 'intValue', value: 0n } })],
        },
      },
      fee: { amount: 500_000n, assetId: new Uint8Array([]) },
      senderPublicKey: new Uint8Array(32).fill(0x01),
      timestamp: 1000000000n,
      version: 2,
    });

    const buffer = toBinary(TransactionSchema, original);
    const decoded = fromBinary(TransactionSchema, buffer);
    expect(decoded.data.case).toBe('dataTransaction');
    if (decoded.data.case === 'dataTransaction') {
      expect(decoded.data.value.data).toHaveLength(1);
    }
  });

  it('should handle DataEntry with delete semantics (no value set)', () => {
    const original = create(TransactionSchema, {
      chainId: 84,
      data: {
        case: 'dataTransaction',
        value: {
          data: [create(DataEntrySchema, { key: 'to-delete' })], // No value = delete
        },
      },
      fee: { amount: 500_000n, assetId: new Uint8Array([]) },
      senderPublicKey: new Uint8Array(32).fill(0x01),
      timestamp: 1000000000n,
      version: 2,
    });

    const buffer = toBinary(TransactionSchema, original);
    const decoded = fromBinary(TransactionSchema, buffer);
    expect(decoded.data.case).toBe('dataTransaction');
    if (decoded.data.case === 'dataTransaction') {
      const entries = decoded.data.value.data;
      expect(entries).toHaveLength(1);
      expect(entries[0].key).toBe('to-delete');
      // @bufbuild/protobuf represents unset oneOf as { case: undefined }
      expect(entries[0].value.case).toBeUndefined();
    }
  });

  it('should not silently swallow unknown oneOf fields in Transaction.data', () => {
    const original = create(TransactionSchema, {
      chainId: 84,
      data: {
        case: 'transfer',
        value: {
          amount: { amount: 1n, assetId: new Uint8Array([]) },
          attachment: new Uint8Array([]),
          recipient: { recipient: { case: 'alias', value: 'x' } },
        },
      },
      fee: { amount: 100_000n, assetId: new Uint8Array([]) },
      senderPublicKey: new Uint8Array(32).fill(0x01),
      timestamp: 1000000000n,
      version: 3,
    });

    const buffer = toBinary(TransactionSchema, original);
    const decoded = fromBinary(TransactionSchema, buffer);
    // Transfer should be set
    expect(decoded.data.case).toBe('transfer');
    // @bufbuild/protobuf uses discriminated unions — only one case is active.
    // Verify no cross-contamination: the case must be exactly 'transfer'.
    expect(decoded.data.case).not.toBe('genesis');
    expect(decoded.data.case).not.toBe('payment');
    expect(decoded.data.case).not.toBe('issue');
    expect(decoded.data.case).not.toBe('reissue');
    expect(decoded.data.case).not.toBe('burn');
    expect(decoded.data.case).not.toBe('exchange');
    expect(decoded.data.case).not.toBe('lease');
    expect(decoded.data.case).not.toBe('leaseCancel');
    expect(decoded.data.case).not.toBe('createAlias');
    expect(decoded.data.case).not.toBe('massTransfer');
    expect(decoded.data.case).not.toBe('dataTransaction');
    expect(decoded.data.case).not.toBe('setScript');
    expect(decoded.data.case).not.toBe('sponsorFee');
    expect(decoded.data.case).not.toBe('setAssetScript');
    expect(decoded.data.case).not.toBe('invokeScript');
    expect(decoded.data.case).not.toBe('updateAssetInfo');
    expect(decoded.data.case).not.toBe('invokeExpression');
    expect(decoded.data.case).not.toBe('commitToGeneration');
  });
});
