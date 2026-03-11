// @ts-nocheck
import Long from 'long';
import { describe, expect, it } from 'vitest';
import { waves as dccProto } from '../dist/index.js';

/**
 * Asserts a value is neither null nor undefined and returns it with narrowed type.
 * Serves as both a Vitest assertion and a TypeScript type guard for nullable
 * protobuf oneOf / sub-message fields.
 *
 * @template T
 * @param {T} value
 * @returns {NonNullable<T>}
 */
function assertDefined(value) {
  expect(value).toBeDefined();
  expect(value).not.toBeNull();
  return /** @type {NonNullable<T>} */ (value);
}

describe('protobuf roundtrip encoding', () => {
  describe('Amount', () => {
    it('should encode and decode with asset_id and amount', () => {
      const original = {
        assetId: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
        amount: Long.fromNumber(1_000_000),
      };

      const buffer = dccProto.Amount.encode(original).finish();
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(0);

      const decoded = dccProto.Amount.decode(buffer);
      expect(decoded.amount.toNumber()).toBe(1_000_000);
      expect(new Uint8Array(decoded.assetId)).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
    });

    it('should encode and decode with zero amount (native token)', () => {
      const original = {
        assetId: new Uint8Array([]),
        amount: Long.fromNumber(0),
      };

      const buffer = dccProto.Amount.encode(original).finish();
      const decoded = dccProto.Amount.decode(buffer);
      expect(decoded.amount.toNumber()).toBe(0);
    });

    it('should handle large int64 values beyond Number.MAX_SAFE_INTEGER', () => {
      const largeValue = Long.fromString('9007199254740993'); // > Number.MAX_SAFE_INTEGER
      const original = {
        assetId: new Uint8Array([10, 20]),
        amount: largeValue,
      };

      const buffer = dccProto.Amount.encode(original).finish();
      const decoded = dccProto.Amount.decode(buffer);
      expect(decoded.amount.toString()).toBe('9007199254740993');
    });

    it('should handle negative int64 values', () => {
      const original = {
        assetId: new Uint8Array([]),
        amount: Long.fromNumber(-1),
      };

      const buffer = dccProto.Amount.encode(original).finish();
      const decoded = dccProto.Amount.decode(buffer);
      expect(decoded.amount.toNumber()).toBe(-1);
    });

    it('should handle max int64 value', () => {
      const maxLong = Long.MAX_VALUE;
      const original = {
        assetId: new Uint8Array([0xff]),
        amount: maxLong,
      };

      const buffer = dccProto.Amount.encode(original).finish();
      const decoded = dccProto.Amount.decode(buffer);
      expect(decoded.amount.toString()).toBe(maxLong.toString());
    });

    it('should produce deterministic encoding (same input → same bytes)', () => {
      const original = {
        assetId: new Uint8Array([1, 2, 3]),
        amount: Long.fromNumber(42),
      };

      const buffer1 = dccProto.Amount.encode(original).finish();
      const buffer2 = dccProto.Amount.encode(original).finish();
      expect(buffer1).toEqual(buffer2);
    });
  });

  describe('Recipient', () => {
    it('should encode and decode with public_key_hash', () => {
      const publicKeyHash = new Uint8Array(20);
      publicKeyHash.fill(0xab);

      const original = {
        publicKeyHash,
      };

      const buffer = dccProto.Recipient.encode(original).finish();
      const decoded = dccProto.Recipient.decode(buffer);
      expect(decoded.publicKeyHash).toBeDefined();
      expect(new Uint8Array(/** @type {Uint8Array} */ (decoded.publicKeyHash))).toEqual(
        publicKeyHash,
      );
    });

    it('should encode and decode with alias', () => {
      const original = {
        alias: 'test-alias',
      };

      const buffer = dccProto.Recipient.encode(original).finish();
      const decoded = dccProto.Recipient.decode(buffer);
      expect(decoded.alias).toBe('test-alias');
    });

    it('should handle empty alias string', () => {
      const original = {
        alias: '',
      };

      const buffer = dccProto.Recipient.encode(original).finish();
      const decoded = dccProto.Recipient.decode(buffer);
      // Empty string is the proto3 default, so alias field may not be set
      expect(decoded.alias === '' || decoded.alias === undefined).toBe(true);
    });

    it('should handle max-length alias (30 characters)', () => {
      const original = {
        alias: 'a'.repeat(30),
      };

      const buffer = dccProto.Recipient.encode(original).finish();
      const decoded = dccProto.Recipient.decode(buffer);
      expect(decoded.alias).toBe('a'.repeat(30));
    });
  });

  describe('Block.Header', () => {
    it('should encode and decode a basic block header', () => {
      const original = {
        chainId: 84, // T for testnet
        version: 5,
        timestamp: Long.fromNumber(Date.now()),
        baseTarget: Long.fromNumber(100),
        generationSignature: new Uint8Array(32).fill(0xcc),
        generator: new Uint8Array(32).fill(0xdd),
        rewardVote: Long.fromNumber(-1),
      };

      const buffer = dccProto.Block.Header.encode(original).finish();
      const decoded = dccProto.Block.Header.decode(buffer);

      expect(decoded.chainId).toBe(84);
      expect(decoded.version).toBe(5);
      expect(decoded.baseTarget.toNumber()).toBe(100);
      expect(decoded.rewardVote.toNumber()).toBe(-1);
    });

    it('should preserve feature_votes array', () => {
      const original = {
        chainId: 84,
        version: 5,
        timestamp: Long.fromNumber(1000000),
        baseTarget: Long.fromNumber(50),
        generationSignature: new Uint8Array(32),
        generator: new Uint8Array(32),
        rewardVote: Long.fromNumber(0),
        featureVotes: [1, 2, 14, 15],
      };

      const buffer = dccProto.Block.Header.encode(original).finish();
      const decoded = dccProto.Block.Header.decode(buffer);
      expect(decoded.featureVotes).toEqual([1, 2, 14, 15]);
    });

    it('should encode and decode a full Block with transactions', () => {
      const header = {
        chainId: 84,
        version: 5,
        timestamp: Long.fromNumber(1000000),
        baseTarget: Long.fromNumber(100),
        generationSignature: new Uint8Array(32).fill(0xaa),
        generator: new Uint8Array(32).fill(0xbb),
        rewardVote: Long.fromNumber(600000000),
      };

      const block = {
        header,
        signature: new Uint8Array(64).fill(0xee),
        transactions: [],
      };

      const buffer = dccProto.Block.encode(block).finish();
      const decoded = dccProto.Block.decode(buffer);
      const decodedHeader = assertDefined(decoded.header);
      expect(decodedHeader.chainId).toBe(84);
      expect(new Uint8Array(decoded.signature)).toEqual(new Uint8Array(64).fill(0xee));
      expect(decoded.transactions).toEqual([]);
    });
  });

  describe('RewardShare', () => {
    it('should encode and decode reward share', () => {
      const original = {
        address: new Uint8Array(26).fill(0x01),
        reward: Long.fromNumber(600000000),
      };

      const buffer = dccProto.RewardShare.encode(original).finish();
      const decoded = dccProto.RewardShare.decode(buffer);

      expect(decoded.reward.toNumber()).toBe(600000000);
      expect(new Uint8Array(decoded.address)).toEqual(new Uint8Array(26).fill(0x01));
    });

    it('should handle zero reward', () => {
      const original = {
        address: new Uint8Array(26).fill(0x02),
        reward: Long.fromNumber(0),
      };

      const buffer = dccProto.RewardShare.encode(original).finish();
      const decoded = dccProto.RewardShare.decode(buffer);
      expect(decoded.reward.toNumber()).toBe(0);
    });
  });

  describe('Order', () => {
    it('should encode and decode a BUY order', () => {
      const original = {
        chainId: 84,
        matcherPublicKey: new Uint8Array(32).fill(0x11),
        assetPair: {
          amountAssetId: new Uint8Array([1, 2, 3, 4]),
          priceAssetId: new Uint8Array([5, 6, 7, 8]),
        },
        orderSide: dccProto.Order.Side.BUY,
        amount: Long.fromNumber(100_000_000),
        price: Long.fromNumber(50_000),
        timestamp: Long.fromNumber(Date.now()),
        expiration: Long.fromNumber(Date.now() + 86400000),
        matcherFee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(300_000),
        },
        version: 4,
        senderPublicKey: new Uint8Array(32).fill(0x22),
      };

      const buffer = dccProto.Order.encode(original).finish();
      expect(buffer.length).toBeGreaterThan(0);

      const decoded = dccProto.Order.decode(buffer);
      expect(decoded.chainId).toBe(84);
      expect(decoded.orderSide).toBe(dccProto.Order.Side.BUY);
      expect(decoded.amount.toNumber()).toBe(100_000_000);
      expect(decoded.price.toNumber()).toBe(50_000);
      expect(decoded.version).toBe(4);
    });

    it('should encode and decode a SELL order', () => {
      const original = {
        chainId: 84,
        orderSide: dccProto.Order.Side.SELL,
        amount: Long.fromNumber(500_000_000),
        price: Long.fromNumber(200_000),
        matcherPublicKey: new Uint8Array(32).fill(0x33),
        assetPair: {
          amountAssetId: new Uint8Array(32).fill(0x44),
          priceAssetId: new Uint8Array([]),
        },
        timestamp: Long.fromNumber(1000000000),
        expiration: Long.fromNumber(2000000000),
        matcherFee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(300_000),
        },
        version: 3,
        senderPublicKey: new Uint8Array(32).fill(0x55),
      };

      const buffer = dccProto.Order.encode(original).finish();
      const decoded = dccProto.Order.decode(buffer);
      expect(decoded.orderSide).toBe(dccProto.Order.Side.SELL);
      expect(decoded.amount.toNumber()).toBe(500_000_000);
    });

    it('should preserve AssetPair fields through encoding', () => {
      const amountAsset = new Uint8Array(32).fill(0xaa);
      const priceAsset = new Uint8Array(32).fill(0xbb);

      const original = {
        assetPair: {
          amountAssetId: amountAsset,
          priceAssetId: priceAsset,
        },
        amount: Long.fromNumber(1),
        price: Long.fromNumber(1),
        timestamp: Long.fromNumber(1),
        expiration: Long.fromNumber(1),
      };

      const buffer = dccProto.Order.encode(original).finish();
      const decoded = dccProto.Order.decode(buffer);
      const pair = assertDefined(decoded.assetPair);
      expect(new Uint8Array(assertDefined(pair.amountAssetId))).toEqual(amountAsset);
      expect(new Uint8Array(assertDefined(pair.priceAssetId))).toEqual(priceAsset);
    });
  });

  describe('Transaction', () => {
    it('should encode and decode a TransferTransactionData', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x01),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(100_000),
        },
        timestamp: Long.fromNumber(Date.now()),
        version: 3,
        transfer: {
          recipient: { alias: 'bob' },
          amount: {
            assetId: new Uint8Array([]),
            amount: Long.fromNumber(10_000_000),
          },
          attachment: new Uint8Array([0xde, 0xad]),
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);

      expect(decoded.chainId).toBe(84);
      expect(decoded.version).toBe(3);
      const fee = assertDefined(decoded.fee);
      const feeAmount = assertDefined(fee.amount);
      expect(feeAmount.toNumber()).toBe(100_000);
      const transfer = assertDefined(decoded.transfer);
      const recipient = assertDefined(transfer.recipient);
      expect(recipient.alias).toBe('bob');
      const transferAmt = assertDefined(transfer.amount);
      const transferAmtValue = assertDefined(transferAmt.amount);
      expect(transferAmtValue.toNumber()).toBe(10_000_000);
      expect(new Uint8Array(assertDefined(transfer.attachment))).toEqual(
        new Uint8Array([0xde, 0xad]),
      );
    });

    it('should encode and decode a CreateAliasTransactionData', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x02),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(100_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 3,
        createAlias: {
          alias: 'my-alias',
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const createAlias = assertDefined(decoded.createAlias);
      expect(createAlias.alias).toBe('my-alias');
    });

    it('should encode and decode a DataTransactionData with all entry types', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x03),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(500_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 2,
        dataTransaction: {
          data: [
            { key: 'intKey', intValue: Long.fromNumber(42) },
            { key: 'boolKey', boolValue: true },
            { key: 'binaryKey', binaryValue: new Uint8Array([0xca, 0xfe]) },
            { key: 'stringKey', stringValue: 'hello' },
          ],
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const dataTx = assertDefined(decoded.dataTransaction);
      const entries = assertDefined(dataTx.data);

      expect(entries).toHaveLength(4);
      expect(entries[0].key).toBe('intKey');
      expect(assertDefined(entries[0].intValue).toNumber()).toBe(42);
      expect(entries[1].key).toBe('boolKey');
      expect(entries[1].boolValue).toBe(true);
      expect(entries[2].key).toBe('binaryKey');
      expect(new Uint8Array(assertDefined(entries[2].binaryValue))).toEqual(
        new Uint8Array([0xca, 0xfe]),
      );
      expect(entries[3].key).toBe('stringKey');
      expect(entries[3].stringValue).toBe('hello');
    });

    it('should encode and decode IssueTransactionData', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x04),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(100_000_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 3,
        issue: {
          name: 'TestToken',
          description: 'A test token for DecentralChain',
          amount: Long.fromNumber(1_000_000_000_000),
          decimals: 8,
          reissuable: true,
          script: new Uint8Array([]),
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const issue = assertDefined(decoded.issue);
      expect(issue.name).toBe('TestToken');
      expect(issue.decimals).toBe(8);
      expect(issue.reissuable).toBe(true);
      expect(assertDefined(issue.amount).toNumber()).toBe(1_000_000_000_000);
    });

    it('should encode and decode MassTransferTransactionData', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x05),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(200_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 2,
        massTransfer: {
          assetId: new Uint8Array(32).fill(0xaa),
          transfers: [
            {
              recipient: { alias: 'alice' },
              amount: Long.fromNumber(1_000_000),
            },
            { recipient: { alias: 'bob' }, amount: Long.fromNumber(2_000_000) },
            {
              recipient: { alias: 'carol' },
              amount: Long.fromNumber(3_000_000),
            },
          ],
          attachment: new Uint8Array([0x01, 0x02]),
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const mt = assertDefined(decoded.massTransfer);
      const transfers = assertDefined(mt.transfers);
      expect(transfers).toHaveLength(3);
      expect(assertDefined(transfers[0].recipient).alias).toBe('alice');
      expect(assertDefined(transfers[0].amount).toNumber()).toBe(1_000_000);
      expect(assertDefined(transfers[2].recipient).alias).toBe('carol');
      expect(assertDefined(transfers[2].amount).toNumber()).toBe(3_000_000);
    });

    it('should encode and decode GenesisTransactionData', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x00),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(0),
        },
        timestamp: Long.fromNumber(1460678400000),
        version: 1,
        genesis: {
          recipientAddress: new Uint8Array(26).fill(0x01),
          amount: Long.fromNumber(10_000_000_000_000_000),
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const genesis = assertDefined(decoded.genesis);
      expect(assertDefined(genesis.amount).toString()).toBe('10000000000000000');
      expect(new Uint8Array(assertDefined(genesis.recipientAddress))).toEqual(
        new Uint8Array(26).fill(0x01),
      );
    });

    it('should encode and decode PaymentTransactionData', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x0a),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(100_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 1,
        payment: {
          recipientAddress: new Uint8Array(26).fill(0x02),
          amount: Long.fromNumber(50_000_000),
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const payment = assertDefined(decoded.payment);
      expect(assertDefined(payment.amount).toNumber()).toBe(50_000_000);
      expect(new Uint8Array(assertDefined(payment.recipientAddress))).toEqual(
        new Uint8Array(26).fill(0x02),
      );
    });

    it('should encode and decode ExchangeTransactionData', () => {
      const buyOrder = {
        chainId: 84,
        matcherPublicKey: new Uint8Array(32).fill(0x11),
        assetPair: {
          amountAssetId: new Uint8Array(32).fill(0xaa),
          priceAssetId: new Uint8Array(32).fill(0xbb),
        },
        orderSide: dccProto.Order.Side.BUY,
        amount: Long.fromNumber(100_000_000),
        price: Long.fromNumber(5_000_000),
        timestamp: Long.fromNumber(1000000000),
        expiration: Long.fromNumber(1000086400),
        matcherFee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(300_000),
        },
        version: 4,
        senderPublicKey: new Uint8Array(32).fill(0x22),
        proofs: [new Uint8Array(64).fill(0xee)],
      };

      const sellOrder = {
        chainId: 84,
        matcherPublicKey: new Uint8Array(32).fill(0x11),
        assetPair: {
          amountAssetId: new Uint8Array(32).fill(0xaa),
          priceAssetId: new Uint8Array(32).fill(0xbb),
        },
        orderSide: dccProto.Order.Side.SELL,
        amount: Long.fromNumber(100_000_000),
        price: Long.fromNumber(5_000_000),
        timestamp: Long.fromNumber(1000000001),
        expiration: Long.fromNumber(1000086401),
        matcherFee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(300_000),
        },
        version: 4,
        senderPublicKey: new Uint8Array(32).fill(0x33),
        proofs: [new Uint8Array(64).fill(0xff)],
      };

      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x11),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(300_000),
        },
        timestamp: Long.fromNumber(1000000002),
        version: 3,
        exchange: {
          amount: Long.fromNumber(50_000_000),
          price: Long.fromNumber(5_000_000),
          buyMatcherFee: Long.fromNumber(150_000),
          sellMatcherFee: Long.fromNumber(150_000),
          orders: [buyOrder, sellOrder],
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const exchange = assertDefined(decoded.exchange);
      expect(assertDefined(exchange.amount).toNumber()).toBe(50_000_000);
      expect(assertDefined(exchange.price).toNumber()).toBe(5_000_000);
      expect(assertDefined(exchange.buyMatcherFee).toNumber()).toBe(150_000);
      expect(assertDefined(exchange.sellMatcherFee).toNumber()).toBe(150_000);
      const orders = assertDefined(exchange.orders);
      expect(orders).toHaveLength(2);
      expect(orders[0].orderSide).toBe(dccProto.Order.Side.BUY);
      expect(orders[1].orderSide).toBe(dccProto.Order.Side.SELL);
      expect(assertDefined(orders[0].amount).toNumber()).toBe(100_000_000);
      expect(assertDefined(orders[1].price).toNumber()).toBe(5_000_000);
    });

    it('should encode and decode LeaseTransactionData', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x0b),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(100_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 3,
        lease: {
          recipient: { publicKeyHash: new Uint8Array(20).fill(0xcc) },
          amount: Long.fromNumber(100_000_000),
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const lease = assertDefined(decoded.lease);
      expect(assertDefined(lease.amount).toNumber()).toBe(100_000_000);
      const recipient = assertDefined(lease.recipient);
      expect(new Uint8Array(/** @type {Uint8Array} */ (recipient.publicKeyHash))).toEqual(
        new Uint8Array(20).fill(0xcc),
      );
    });

    it('should encode and decode LeaseCancelTransactionData', () => {
      const leaseId = new Uint8Array(32).fill(0xdd);
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x0c),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(100_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 3,
        leaseCancel: {
          leaseId,
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const cancel = assertDefined(decoded.leaseCancel);
      expect(new Uint8Array(assertDefined(cancel.leaseId))).toEqual(leaseId);
    });

    it('should encode and decode BurnTransactionData', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x0d),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(100_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 3,
        burn: {
          assetAmount: {
            assetId: new Uint8Array(32).fill(0xee),
            amount: Long.fromNumber(500_000_000),
          },
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const burn = assertDefined(decoded.burn);
      const assetAmt = assertDefined(burn.assetAmount);
      expect(assertDefined(assetAmt.amount).toNumber()).toBe(500_000_000);
      expect(new Uint8Array(assertDefined(assetAmt.assetId))).toEqual(
        new Uint8Array(32).fill(0xee),
      );
    });

    it('should encode and decode ReissueTransactionData', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x0e),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(100_000_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 3,
        reissue: {
          assetAmount: {
            assetId: new Uint8Array(32).fill(0xff),
            amount: Long.fromNumber(1_000_000_000),
          },
          reissuable: false,
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const reissue = assertDefined(decoded.reissue);
      expect(reissue.reissuable).toBe(false);
      const assetAmt = assertDefined(reissue.assetAmount);
      expect(assertDefined(assetAmt.amount).toNumber()).toBe(1_000_000_000);
    });

    it('should encode and decode SetScriptTransactionData', () => {
      const scriptBytes = new Uint8Array(128).fill(0xab);
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x0f),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(1_000_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 2,
        setScript: {
          script: scriptBytes,
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const setScript = assertDefined(decoded.setScript);
      expect(new Uint8Array(assertDefined(setScript.script))).toEqual(scriptBytes);
    });

    it('should encode and decode SetAssetScriptTransactionData', () => {
      const assetId = new Uint8Array(32).fill(0xab);
      const scriptBytes = new Uint8Array(64).fill(0xcd);
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x10),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(100_000_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 2,
        setAssetScript: {
          assetId,
          script: scriptBytes,
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const setAssetScript = assertDefined(decoded.setAssetScript);
      expect(new Uint8Array(assertDefined(setAssetScript.assetId))).toEqual(assetId);
      expect(new Uint8Array(assertDefined(setAssetScript.script))).toEqual(scriptBytes);
    });

    it('should encode and decode SponsorFeeTransactionData', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x11),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(100_000_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 2,
        sponsorFee: {
          minFee: {
            assetId: new Uint8Array(32).fill(0xaa),
            amount: Long.fromNumber(100_000),
          },
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const sponsorFee = assertDefined(decoded.sponsorFee);
      const minFee = assertDefined(sponsorFee.minFee);
      expect(assertDefined(minFee.amount).toNumber()).toBe(100_000);
      expect(new Uint8Array(assertDefined(minFee.assetId))).toEqual(new Uint8Array(32).fill(0xaa));
    });

    it('should encode and decode InvokeScriptTransactionData', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x12),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(500_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 2,
        invokeScript: {
          dApp: { alias: 'my-dapp' },
          functionCall: new Uint8Array([0x01, 0x09, 0x01, 0x00]),
          payments: [
            {
              assetId: new Uint8Array([]),
              amount: Long.fromNumber(1_000_000),
            },
            {
              assetId: new Uint8Array(32).fill(0xbb),
              amount: Long.fromNumber(2_000_000),
            },
          ],
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const invoke = assertDefined(decoded.invokeScript);
      const dApp = assertDefined(invoke.dApp);
      expect(dApp.alias).toBe('my-dapp');
      expect(new Uint8Array(assertDefined(invoke.functionCall))).toEqual(
        new Uint8Array([0x01, 0x09, 0x01, 0x00]),
      );
      const invokePayments = assertDefined(invoke.payments);
      expect(invokePayments).toHaveLength(2);
      expect(assertDefined(invokePayments[0].amount).toNumber()).toBe(1_000_000);
      expect(assertDefined(invokePayments[1].amount).toNumber()).toBe(2_000_000);
      expect(new Uint8Array(assertDefined(invokePayments[1].assetId))).toEqual(
        new Uint8Array(32).fill(0xbb),
      );
    });

    it('should encode and decode UpdateAssetInfoTransactionData', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x13),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(100_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 1,
        updateAssetInfo: {
          assetId: new Uint8Array(32).fill(0xcc),
          name: 'UpdatedToken',
          description: 'Updated description for the token',
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const update = assertDefined(decoded.updateAssetInfo);
      expect(update.name).toBe('UpdatedToken');
      expect(update.description).toBe('Updated description for the token');
      expect(new Uint8Array(assertDefined(update.assetId))).toEqual(new Uint8Array(32).fill(0xcc));
    });
  });

  describe('SignedTransaction', () => {
    it('should encode and decode a signed transaction with proofs', () => {
      const tx = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x01),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(100_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 3,
        transfer: {
          recipient: { alias: 'test' },
          amount: {
            assetId: new Uint8Array([]),
            amount: Long.fromNumber(5_000_000),
          },
          attachment: new Uint8Array([]),
        },
      };

      const signedTx = {
        wavesTransaction: tx,
        proofs: [
          new Uint8Array(64).fill(0xff), // simulated ed25519 signature
        ],
      };

      const buffer = dccProto.SignedTransaction.encode(signedTx).finish();
      const decoded = dccProto.SignedTransaction.decode(buffer);

      const inner = assertDefined(decoded.wavesTransaction);
      expect(inner.chainId).toBe(84);
      expect(decoded.proofs).toHaveLength(1);
      expect(decoded.proofs[0]).toHaveLength(64);
    });

    it('should encode and decode with multiple proofs (multisig)', () => {
      const signedTx = {
        wavesTransaction: {
          chainId: 84,
          senderPublicKey: new Uint8Array(32).fill(0x10),
          fee: {
            assetId: new Uint8Array([]),
            amount: Long.fromNumber(500_000),
          },
          timestamp: Long.fromNumber(1000000000),
          version: 2,
          createAlias: { alias: 'multisig-test' },
        },
        proofs: [
          new Uint8Array(64).fill(0xaa),
          new Uint8Array(64).fill(0xbb),
          new Uint8Array(64).fill(0xcc),
        ],
      };

      const buffer = dccProto.SignedTransaction.encode(signedTx).finish();
      const decoded = dccProto.SignedTransaction.decode(buffer);
      expect(decoded.proofs).toHaveLength(3);
      expect(new Uint8Array(decoded.proofs[1])).toEqual(new Uint8Array(64).fill(0xbb));
    });
  });

  describe('InvokeExpressionTransactionData', () => {
    it('should encode and decode an invoke expression transaction', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x06),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(500_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 1,
        invokeExpression: {
          expression: new Uint8Array([0x01, 0x02, 0x03, 0x04]),
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const invokeExpr = assertDefined(decoded.invokeExpression);
      expect(new Uint8Array(assertDefined(invokeExpr.expression))).toEqual(
        new Uint8Array([0x01, 0x02, 0x03, 0x04]),
      );
    });

    it('should handle empty expression bytes', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x07),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(500_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 1,
        invokeExpression: {
          expression: new Uint8Array([]),
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const invokeExpr = assertDefined(decoded.invokeExpression);
      expect(invokeExpr.expression).toBeDefined();
    });
  });

  describe('CommitToGenerationTransactionData', () => {
    it('should encode and decode a commit to generation transaction', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x08),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(100_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 1,
        commitToGeneration: {
          generationPeriodStart: 42,
          endorserPublicKey: new Uint8Array(48).fill(0xaa),
          commitmentSignature: new Uint8Array(96).fill(0xbb),
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const commit = assertDefined(decoded.commitToGeneration);
      expect(commit.generationPeriodStart).toBe(42);
      expect(new Uint8Array(assertDefined(commit.endorserPublicKey))).toEqual(
        new Uint8Array(48).fill(0xaa),
      );
      expect(new Uint8Array(assertDefined(commit.commitmentSignature))).toEqual(
        new Uint8Array(96).fill(0xbb),
      );
    });

    it('should handle zero generation_period_start', () => {
      const original = {
        chainId: 84,
        senderPublicKey: new Uint8Array(32).fill(0x09),
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(100_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 1,
        commitToGeneration: {
          generationPeriodStart: 0,
          endorserPublicKey: new Uint8Array(48).fill(0xcc),
          commitmentSignature: new Uint8Array(96).fill(0xdd),
        },
      };

      const buffer = dccProto.Transaction.encode(original).finish();
      const decoded = dccProto.Transaction.decode(buffer);
      const commit = assertDefined(decoded.commitToGeneration);
      // 0 is proto3 default — field may not be present on the wire
      expect(commit.generationPeriodStart === 0 || commit.generationPeriodStart === undefined).toBe(
        true,
      );
    });
  });

  describe('InvokeScriptResult', () => {
    it('should encode and decode a result with data entries and transfers', () => {
      const original = {
        data: [
          { key: 'counter', intValue: Long.fromNumber(100) },
          { key: 'flag', boolValue: true },
        ],
        transfers: [
          {
            address: new Uint8Array(26).fill(0x01),
            amount: {
              assetId: new Uint8Array([]),
              amount: Long.fromNumber(5_000_000),
            },
          },
        ],
      };

      const buffer = dccProto.InvokeScriptResult.encode(original).finish();
      const decoded = dccProto.InvokeScriptResult.decode(buffer);
      expect(decoded.data).toHaveLength(2);
      expect(decoded.data[0].key).toBe('counter');
      expect(assertDefined(decoded.data[0].intValue).toNumber()).toBe(100);
      expect(decoded.transfers).toHaveLength(1);
      const transferAmt = assertDefined(decoded.transfers[0].amount);
      expect(assertDefined(transferAmt.amount).toNumber()).toBe(5_000_000);
    });

    it('should encode and decode error messages', () => {
      const original = {
        errorMessage: {
          code: 1,
          text: 'InvokeScript execution failed',
        },
      };

      const buffer = dccProto.InvokeScriptResult.encode(original).finish();
      const decoded = dccProto.InvokeScriptResult.decode(buffer);
      const err = assertDefined(decoded.errorMessage);
      expect(err.code).toBe(1);
      expect(err.text).toBe('InvokeScript execution failed');
    });
  });

  describe('TransactionStateSnapshot', () => {
    it('should encode and decode balance snapshots', () => {
      const original = {
        balances: [
          {
            address: new Uint8Array(26).fill(0x01),
            amount: {
              assetId: new Uint8Array([]),
              amount: Long.fromNumber(10_000_000),
            },
          },
        ],
      };

      const buffer = dccProto.TransactionStateSnapshot.encode(original).finish();
      const decoded = dccProto.TransactionStateSnapshot.decode(buffer);
      expect(decoded.balances).toHaveLength(1);
      const bal = assertDefined(decoded.balances[0].amount);
      expect(assertDefined(bal.amount).toNumber()).toBe(10_000_000);
    });
  });

  describe('events (BlockchainUpdated)', () => {
    it('should encode and decode a BlockchainUpdated message', () => {
      const original = {
        id: new Uint8Array(32).fill(0x01),
        height: 1000,
      };

      const buffer = dccProto.events.BlockchainUpdated.encode(original).finish();
      const decoded = dccProto.events.BlockchainUpdated.decode(buffer);
      expect(new Uint8Array(decoded.id)).toEqual(new Uint8Array(32).fill(0x01));
      expect(decoded.height).toBe(1000);
    });

    it('should encode and decode a BlockchainUpdated with Append containing state updates', () => {
      const original = {
        id: new Uint8Array(32).fill(0x02),
        height: 2000,
        append: {
          transactionIds: [new Uint8Array(32).fill(0xaa), new Uint8Array(32).fill(0xbb)],
          stateUpdate: {
            balances: [
              {
                address: new Uint8Array(26).fill(0x01),
                amountAfter: {
                  assetId: new Uint8Array([]),
                  amount: Long.fromNumber(99_000_000),
                },
                amountBefore: Long.fromNumber(100_000_000),
              },
            ],
          },
        },
      };

      const buffer = dccProto.events.BlockchainUpdated.encode(original).finish();
      const decoded = dccProto.events.BlockchainUpdated.decode(buffer);
      expect(decoded.height).toBe(2000);
      const append = assertDefined(decoded.append);
      expect(append.transactionIds).toHaveLength(2);
      const stateUpdate = assertDefined(append.stateUpdate);
      const suBalances = assertDefined(stateUpdate.balances);
      expect(suBalances).toHaveLength(1);
      expect(assertDefined(suBalances[0].amountBefore).toNumber()).toBe(100_000_000);
      const amountAfter = assertDefined(suBalances[0].amountAfter);
      expect(assertDefined(amountAfter.amount).toNumber()).toBe(99_000_000);
    });

    it('should encode and decode a Rollback update', () => {
      const original = {
        id: new Uint8Array(32).fill(0x03),
        height: 1500,
        rollback: {
          type: dccProto.events.BlockchainUpdated.Rollback.RollbackType.BLOCK,
          removedTransactionIds: [new Uint8Array(32).fill(0xcc)],
        },
      };

      const buffer = dccProto.events.BlockchainUpdated.encode(original).finish();
      const decoded = dccProto.events.BlockchainUpdated.decode(buffer);
      const rollback = assertDefined(decoded.rollback);
      expect(rollback.type).toBe(dccProto.events.BlockchainUpdated.Rollback.RollbackType.BLOCK);
      expect(rollback.removedTransactionIds).toHaveLength(1);
    });
  });

  describe('MicroBlock', () => {
    it('should encode and decode a MicroBlock', () => {
      const original = {
        version: 5,
        reference: new Uint8Array(64).fill(0x01),
        updatedBlockSignature: new Uint8Array(64).fill(0x02),
        senderPublicKey: new Uint8Array(32).fill(0x03),
        transactions: [],
      };

      const buffer = dccProto.MicroBlock.encode(original).finish();
      const decoded = dccProto.MicroBlock.decode(buffer);
      expect(decoded.version).toBe(5);
      expect(new Uint8Array(decoded.reference)).toEqual(new Uint8Array(64).fill(0x01));
      expect(new Uint8Array(decoded.senderPublicKey)).toEqual(new Uint8Array(32).fill(0x03));
    });

    it('should encode and decode a SignedMicroBlock', () => {
      const microBlock = {
        version: 5,
        reference: new Uint8Array(64).fill(0x01),
        updatedBlockSignature: new Uint8Array(64).fill(0x02),
        senderPublicKey: new Uint8Array(32).fill(0x03),
        transactions: [],
      };

      const original = {
        microBlock,
        signature: new Uint8Array(64).fill(0xee),
        totalBlockId: new Uint8Array(32).fill(0xff),
      };

      const buffer = dccProto.SignedMicroBlock.encode(original).finish();
      const decoded = dccProto.SignedMicroBlock.decode(buffer);
      expect(new Uint8Array(decoded.signature)).toEqual(new Uint8Array(64).fill(0xee));
      expect(new Uint8Array(decoded.totalBlockId)).toEqual(new Uint8Array(32).fill(0xff));
      const inner = assertDefined(decoded.microBlock);
      expect(inner.version).toBe(5);
    });
  });

  describe('BlockSnapshot', () => {
    it('should encode and decode a BlockSnapshot', () => {
      const original = {
        blockId: new Uint8Array(32).fill(0x01),
        snapshots: [
          {
            balances: [
              {
                address: new Uint8Array(26).fill(0x02),
                amount: {
                  assetId: new Uint8Array([]),
                  amount: Long.fromNumber(50_000_000),
                },
              },
            ],
            transactionStatus: dccProto.TransactionStatus.SUCCEEDED,
          },
        ],
      };

      const buffer = dccProto.BlockSnapshot.encode(original).finish();
      const decoded = dccProto.BlockSnapshot.decode(buffer);
      expect(new Uint8Array(decoded.blockId)).toEqual(new Uint8Array(32).fill(0x01));
      expect(decoded.snapshots).toHaveLength(1);
      expect(decoded.snapshots[0].balances).toHaveLength(1);
    });
  });

  describe('TransactionStateSnapshot (detailed)', () => {
    it('should encode and decode lease balance snapshots', () => {
      const original = {
        leaseBalances: [
          {
            address: new Uint8Array(26).fill(0x10),
            in: Long.fromNumber(5_000_000),
            out: Long.fromNumber(3_000_000),
          },
        ],
      };

      const buffer = dccProto.TransactionStateSnapshot.encode(original).finish();
      const decoded = dccProto.TransactionStateSnapshot.decode(buffer);
      expect(decoded.leaseBalances).toHaveLength(1);
      expect(assertDefined(decoded.leaseBalances[0].in).toNumber()).toBe(5_000_000);
      expect(assertDefined(decoded.leaseBalances[0].out).toNumber()).toBe(3_000_000);
    });

    it('should encode and decode new leases', () => {
      const original = {
        newLeases: [
          {
            leaseId: new Uint8Array(32).fill(0x11),
            senderPublicKey: new Uint8Array(32).fill(0x22),
            recipientAddress: new Uint8Array(26).fill(0x33),
            amount: Long.fromNumber(100_000_000),
          },
        ],
      };

      const buffer = dccProto.TransactionStateSnapshot.encode(original).finish();
      const decoded = dccProto.TransactionStateSnapshot.decode(buffer);
      expect(decoded.newLeases).toHaveLength(1);
      expect(assertDefined(decoded.newLeases[0].amount).toNumber()).toBe(100_000_000);
    });

    it('should encode and decode cancelled leases', () => {
      const original = {
        cancelledLeases: [
          {
            leaseId: new Uint8Array(32).fill(0x44),
          },
        ],
      };

      const buffer = dccProto.TransactionStateSnapshot.encode(original).finish();
      const decoded = dccProto.TransactionStateSnapshot.decode(buffer);
      expect(decoded.cancelledLeases).toHaveLength(1);
      expect(new Uint8Array(assertDefined(decoded.cancelledLeases[0].leaseId))).toEqual(
        new Uint8Array(32).fill(0x44),
      );
    });

    it('should encode and decode asset statics (NewAsset)', () => {
      const original = {
        assetStatics: [
          {
            assetId: new Uint8Array(32).fill(0x55),
            issuerPublicKey: new Uint8Array(32).fill(0x66),
            decimals: 8,
            nft: false,
          },
        ],
      };

      const buffer = dccProto.TransactionStateSnapshot.encode(original).finish();
      const decoded = dccProto.TransactionStateSnapshot.decode(buffer);
      expect(decoded.assetStatics).toHaveLength(1);
      expect(decoded.assetStatics[0].decimals).toBe(8);
      expect(decoded.assetStatics[0].nft).toBe(false);
    });

    it('should encode and decode order fills', () => {
      const original = {
        orderFills: [
          {
            orderId: new Uint8Array(32).fill(0x77),
            volume: Long.fromNumber(50_000_000),
            fee: Long.fromNumber(300_000),
          },
        ],
      };

      const buffer = dccProto.TransactionStateSnapshot.encode(original).finish();
      const decoded = dccProto.TransactionStateSnapshot.decode(buffer);
      expect(decoded.orderFills).toHaveLength(1);
      expect(assertDefined(decoded.orderFills[0].volume).toNumber()).toBe(50_000_000);
      expect(assertDefined(decoded.orderFills[0].fee).toNumber()).toBe(300_000);
    });

    it('should encode and decode account data entries', () => {
      const original = {
        accountData: [
          {
            address: new Uint8Array(26).fill(0x88),
            entries: [
              { key: 'balance', intValue: Long.fromNumber(999_000) },
              { key: 'active', boolValue: true },
            ],
          },
        ],
      };

      const buffer = dccProto.TransactionStateSnapshot.encode(original).finish();
      const decoded = dccProto.TransactionStateSnapshot.decode(buffer);
      const acctData = assertDefined(decoded.accountData);
      expect(acctData).toHaveLength(1);
      const entries = assertDefined(acctData[0].entries);
      expect(entries).toHaveLength(2);
      expect(entries[0].key).toBe('balance');
      expect(assertDefined(entries[0].intValue).toNumber()).toBe(999_000);
    });

    it('should encode and decode sponsorships', () => {
      const original = {
        sponsorships: [
          {
            assetId: new Uint8Array(32).fill(0x99),
            minFee: Long.fromNumber(100_000),
          },
        ],
      };

      const buffer = dccProto.TransactionStateSnapshot.encode(original).finish();
      const decoded = dccProto.TransactionStateSnapshot.decode(buffer);
      expect(decoded.sponsorships).toHaveLength(1);
      expect(assertDefined(decoded.sponsorships[0].minFee).toNumber()).toBe(100_000);
    });

    it('should encode and decode all TransactionStatus enum values', () => {
      for (const value of Object.values(dccProto.TransactionStatus)) {
        if (typeof value !== 'number') continue;
        const original = { transactionStatus: value };
        const buffer = dccProto.TransactionStateSnapshot.encode(original).finish();
        const decoded = dccProto.TransactionStateSnapshot.decode(buffer);
        // SUCCEEDED (0) is the proto3 default — it may not appear on the wire
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
      const original = {
        issues: [
          {
            assetId: new Uint8Array(32).fill(0x01),
            name: 'InvokeToken',
            description: 'Token issued by invoke',
            amount: Long.fromNumber(1_000_000_000),
            decimals: 6,
            reissuable: true,
            script: new Uint8Array([]),
            nonce: Long.fromNumber(1),
          },
        ],
        reissues: [
          {
            assetId: new Uint8Array(32).fill(0x02),
            amount: Long.fromNumber(500_000_000),
            isReissuable: true,
          },
        ],
        burns: [
          {
            assetId: new Uint8Array(32).fill(0x03),
            amount: Long.fromNumber(100_000_000),
          },
        ],
      };

      const buffer = dccProto.InvokeScriptResult.encode(original).finish();
      const decoded = dccProto.InvokeScriptResult.decode(buffer);
      expect(decoded.issues).toHaveLength(1);
      expect(decoded.issues[0].name).toBe('InvokeToken');
      expect(assertDefined(decoded.issues[0].amount).toNumber()).toBe(1_000_000_000);
      expect(decoded.reissues).toHaveLength(1);
      expect(assertDefined(decoded.reissues[0].amount).toNumber()).toBe(500_000_000);
      expect(decoded.burns).toHaveLength(1);
      expect(assertDefined(decoded.burns[0].amount).toNumber()).toBe(100_000_000);
    });

    it('should encode and decode leases and lease cancels', () => {
      const original = {
        leases: [
          {
            recipient: { alias: 'lease-target' },
            amount: Long.fromNumber(10_000_000),
            nonce: Long.fromNumber(42),
            leaseId: new Uint8Array(32).fill(0x04),
          },
        ],
        leaseCancels: [
          {
            leaseId: new Uint8Array(32).fill(0x05),
          },
        ],
      };

      const buffer = dccProto.InvokeScriptResult.encode(original).finish();
      const decoded = dccProto.InvokeScriptResult.decode(buffer);
      expect(decoded.leases).toHaveLength(1);
      expect(assertDefined(decoded.leases[0].amount).toNumber()).toBe(10_000_000);
      expect(assertDefined(decoded.leases[0].recipient).alias).toBe('lease-target');
      expect(decoded.leaseCancels).toHaveLength(1);
      expect(new Uint8Array(assertDefined(decoded.leaseCancels[0].leaseId))).toEqual(
        new Uint8Array(32).fill(0x05),
      );
    });

    it('should encode and decode sponsor fees', () => {
      const original = {
        sponsorFees: [
          {
            minFee: {
              assetId: new Uint8Array(32).fill(0x06),
              amount: Long.fromNumber(50_000),
            },
          },
        ],
      };

      const buffer = dccProto.InvokeScriptResult.encode(original).finish();
      const decoded = dccProto.InvokeScriptResult.decode(buffer);
      expect(decoded.sponsorFees).toHaveLength(1);
      const minFee = assertDefined(decoded.sponsorFees[0].minFee);
      expect(assertDefined(minFee.amount).toNumber()).toBe(50_000);
    });

    it('should encode and decode nested invocations', () => {
      const original = {
        invokes: [
          {
            dApp: new Uint8Array(26).fill(0x07),
            call: {
              function: 'deposit',
              args: [
                { integerValue: Long.fromNumber(100) },
                { stringValue: 'hello' },
                { booleanValue: true },
                { binaryValue: new Uint8Array([0xca, 0xfe]) },
              ],
            },
            payments: [
              {
                assetId: new Uint8Array([]),
                amount: Long.fromNumber(1_000_000),
              },
            ],
            stateChanges: {
              data: [{ key: 'result', intValue: Long.fromNumber(200) }],
            },
          },
        ],
      };

      const buffer = dccProto.InvokeScriptResult.encode(original).finish();
      const decoded = dccProto.InvokeScriptResult.decode(buffer);
      expect(decoded.invokes).toHaveLength(1);
      const inv = decoded.invokes[0];
      const call = assertDefined(inv.call);
      expect(call.function).toBe('deposit');
      const callArgs = assertDefined(call.args);
      expect(callArgs).toHaveLength(4);
      expect(assertDefined(callArgs[0].integerValue).toNumber()).toBe(100);
      expect(callArgs[1].stringValue).toBe('hello');
      expect(callArgs[2].booleanValue).toBe(true);
      expect(inv.payments).toHaveLength(1);
      const stateChanges = assertDefined(inv.stateChanges);
      const scData = assertDefined(stateChanges.data);
      expect(scData).toHaveLength(1);
      expect(scData[0].key).toBe('result');
    });
  });

  describe('DAppMeta', () => {
    it('should encode and decode DAppMeta with callable signatures', () => {
      const original = {
        version: 2,
        funcs: [
          { types: new Uint8Array([0x01, 0x02, 0x03]) },
          { types: new Uint8Array([0x04, 0x05]) },
        ],
        compactNameAndOriginalNamePairList: [
          { compactName: 'a', originalName: 'deposit' },
          { compactName: 'b', originalName: 'withdraw' },
        ],
        originalNames: ['deposit', 'withdraw'],
      };

      const buffer = dccProto.DAppMeta.encode(original).finish();
      const decoded = dccProto.DAppMeta.decode(buffer);
      expect(decoded.version).toBe(2);
      expect(decoded.funcs).toHaveLength(2);
      expect(new Uint8Array(assertDefined(decoded.funcs[0].types))).toEqual(
        new Uint8Array([0x01, 0x02, 0x03]),
      );
      expect(decoded.compactNameAndOriginalNamePairList).toHaveLength(2);
      expect(decoded.compactNameAndOriginalNamePairList[0].originalName).toBe('deposit');
      expect(decoded.originalNames).toEqual(['deposit', 'withdraw']);
    });
  });

  describe('FinalizationVoting and EndorseBlock', () => {
    it('should encode and decode FinalizationVoting', () => {
      const original = {
        endorserIndexes: [0, 1, 2, 5],
        finalizedBlockHeight: 1000,
        aggregatedEndorsementSignature: new Uint8Array(96).fill(0xaa),
      };

      const buffer = dccProto.FinalizationVoting.encode(original).finish();
      const decoded = dccProto.FinalizationVoting.decode(buffer);
      expect(decoded.endorserIndexes).toEqual([0, 1, 2, 5]);
      expect(decoded.finalizedBlockHeight).toBe(1000);
      expect(new Uint8Array(decoded.aggregatedEndorsementSignature)).toEqual(
        new Uint8Array(96).fill(0xaa),
      );
    });

    it('should encode and decode EndorseBlock', () => {
      const original = {
        endorserIndex: 3,
        finalizedBlockId: new Uint8Array(32).fill(0x01),
        finalizedBlockHeight: 999,
        endorsedBlockId: new Uint8Array(32).fill(0x02),
        signature: new Uint8Array(96).fill(0xbb),
      };

      const buffer = dccProto.EndorseBlock.encode(original).finish();
      const decoded = dccProto.EndorseBlock.decode(buffer);
      expect(decoded.endorserIndex).toBe(3);
      expect(decoded.finalizedBlockHeight).toBe(999);
      expect(new Uint8Array(decoded.signature)).toEqual(new Uint8Array(96).fill(0xbb));
    });
  });
});

describe('protobuf namespace structure', () => {
  it('should export the protobuf namespace', () => {
    expect(dccProto).toBeDefined();
  });

  it('should contain core message types with encode/decode methods', () => {
    const coreTypes = [
      dccProto.Amount,
      dccProto.Block,
      dccProto.Transaction,
      dccProto.SignedTransaction,
      dccProto.Order,
      dccProto.Recipient,
      dccProto.RewardShare,
    ];

    for (const type of coreTypes) {
      expect(type).toBeDefined();
      expect(type.encode).toBeTypeOf('function');
      expect(type.decode).toBeTypeOf('function');
    }
  });

  it('should contain Block.Header nested type', () => {
    expect(dccProto.Block.Header).toBeDefined();
    expect(dccProto.Block.Header.encode).toBeTypeOf('function');
    expect(dccProto.Block.Header.decode).toBeTypeOf('function');
  });

  it('should contain all transaction data types', () => {
    const txTypes = [
      dccProto.GenesisTransactionData,
      dccProto.PaymentTransactionData,
      dccProto.TransferTransactionData,
      dccProto.CreateAliasTransactionData,
      dccProto.DataTransactionData,
      dccProto.IssueTransactionData,
      dccProto.ReissueTransactionData,
      dccProto.BurnTransactionData,
      dccProto.ExchangeTransactionData,
      dccProto.LeaseTransactionData,
      dccProto.LeaseCancelTransactionData,
      dccProto.MassTransferTransactionData,
      dccProto.SetScriptTransactionData,
      dccProto.SponsorFeeTransactionData,
      dccProto.SetAssetScriptTransactionData,
      dccProto.InvokeScriptTransactionData,
      dccProto.UpdateAssetInfoTransactionData,
      dccProto.InvokeExpressionTransactionData,
      dccProto.CommitToGenerationTransactionData,
    ];

    for (const type of txTypes) {
      expect(type).toBeDefined();
      expect(type.encode).toBeTypeOf('function');
      expect(type.decode).toBeTypeOf('function');
    }
  });

  it('should contain Order enums', () => {
    expect(dccProto.Order.Side).toBeDefined();
    expect(dccProto.Order.Side.BUY).toBe(0);
    expect(dccProto.Order.Side.SELL).toBe(1);
    expect(dccProto.Order.PriceMode).toBeDefined();
  });

  it('should contain AssetPair message', () => {
    expect(dccProto.AssetPair).toBeDefined();
    expect(dccProto.AssetPair.encode).toBeTypeOf('function');
    expect(dccProto.AssetPair.decode).toBeTypeOf('function');
  });

  it('should contain events namespace', () => {
    expect(dccProto.events).toBeDefined();
    expect(dccProto.events.BlockchainUpdated).toBeDefined();
    expect(dccProto.events.BlockchainUpdated.encode).toBeTypeOf('function');
    expect(dccProto.events.BlockchainUpdated.decode).toBeTypeOf('function');
  });

  it('should contain events.grpc namespace', () => {
    expect(dccProto.events.grpc).toBeDefined();
    expect(dccProto.events.grpc.BlockchainUpdatesApi).toBeDefined();
  });

  it('should contain node.grpc namespace with API services', () => {
    expect(dccProto.node).toBeDefined();
    expect(dccProto.node.grpc).toBeDefined();
    expect(dccProto.node.grpc.AccountsApi).toBeDefined();
    expect(dccProto.node.grpc.TransactionsApi).toBeDefined();
    expect(dccProto.node.grpc.BlocksApi).toBeDefined();
    expect(dccProto.node.grpc.AssetsApi).toBeDefined();
    expect(dccProto.node.grpc.BlockchainApi).toBeDefined();
  });

  it('should contain DataEntry message with all value types', () => {
    expect(dccProto.DataEntry).toBeDefined();
    expect(dccProto.DataEntry.encode).toBeTypeOf('function');
    expect(dccProto.DataEntry.decode).toBeTypeOf('function');
  });

  it('should contain InvokeScriptResult for smart contract outputs', () => {
    expect(dccProto.InvokeScriptResult).toBeDefined();
    expect(dccProto.InvokeScriptResult.encode).toBeTypeOf('function');
    expect(dccProto.InvokeScriptResult.decode).toBeTypeOf('function');
  });
});

describe('protobuf error handling', () => {
  it('should throw on corrupt buffer', () => {
    const corruptBuffer = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff]);
    expect(() => dccProto.Amount.decode(corruptBuffer)).toThrow();
  });

  it('should decode empty buffer to default values', () => {
    const emptyBuffer = new Uint8Array([]);
    const decoded = dccProto.Amount.decode(emptyBuffer);
    expect(decoded.amount.toNumber()).toBe(0);
  });

  it('should throw when buffer is truncated mid-field', () => {
    const original = {
      assetId: new Uint8Array(32).fill(0xaa),
      amount: Long.fromNumber(1_000_000),
    };
    const fullBuffer = dccProto.Amount.encode(original).finish();
    // Truncate to half the buffer
    const truncated = fullBuffer.slice(0, Math.floor(fullBuffer.length / 2));
    expect(() => dccProto.Amount.decode(truncated)).toThrow();
  });

  it('should throw on corrupt SignedTransaction buffer', () => {
    const corrupt = new Uint8Array([0x0a, 0xff, 0xff, 0xff, 0x0f]);
    expect(() => dccProto.SignedTransaction.decode(corrupt)).toThrow();
  });

  it('should throw on corrupt Transaction buffer', () => {
    const corrupt = new Uint8Array([0x08, 0x54, 0x80, 0xff, 0xff]);
    expect(() => dccProto.Transaction.decode(corrupt)).toThrow();
  });
});

describe('financial safety edge cases', () => {
  it('should preserve min int64 (negative overflow boundary)', () => {
    const minLong = Long.MIN_VALUE;
    const original = {
      assetId: new Uint8Array([]),
      amount: minLong,
    };

    const buffer = dccProto.Amount.encode(original).finish();
    const decoded = dccProto.Amount.decode(buffer);
    expect(decoded.amount.toString()).toBe(minLong.toString());
  });

  it('should handle SignedTransaction with ethereum_transaction bytes', () => {
    // Simulated RLP-encoded Ethereum transaction
    const ethTxBytes = new Uint8Array(256).fill(0xab);
    const original = {
      ethereumTransaction: ethTxBytes,
      proofs: [],
    };

    const buffer = dccProto.SignedTransaction.encode(original).finish();
    const decoded = dccProto.SignedTransaction.decode(buffer);
    expect(new Uint8Array(assertDefined(decoded.ethereumTransaction))).toEqual(ethTxBytes);
  });

  it('should preserve exact byte content for cryptographic fields (signatures and keys)', () => {
    // Ensure no byte mutation occurs on signature-critical fields
    const senderPk = new Uint8Array(32);
    const proof = new Uint8Array(64);
    for (let i = 0; i < 32; i++) senderPk[i] = i;
    for (let i = 0; i < 64; i++) proof[i] = 255 - i;

    const signedTx = {
      wavesTransaction: {
        chainId: 87, // W for mainnet
        senderPublicKey: senderPk,
        fee: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(100_000),
        },
        timestamp: Long.fromNumber(1000000000),
        version: 3,
        transfer: {
          recipient: { alias: 'test' },
          amount: {
            assetId: new Uint8Array([]),
            amount: Long.fromNumber(1),
          },
          attachment: new Uint8Array([]),
        },
      },
      proofs: [proof],
    };

    const buffer = dccProto.SignedTransaction.encode(signedTx).finish();
    const decoded = dccProto.SignedTransaction.decode(buffer);
    const inner = assertDefined(decoded.wavesTransaction);
    expect(new Uint8Array(assertDefined(inner.senderPublicKey))).toEqual(senderPk);
    expect(new Uint8Array(decoded.proofs[0])).toEqual(proof);
    // Also verify mainnet chain ID survives
    expect(inner.chainId).toBe(87);
  });

  it('should handle ExchangeTransactionData with extreme price values', () => {
    const original = {
      chainId: 84,
      senderPublicKey: new Uint8Array(32).fill(0x01),
      fee: {
        assetId: new Uint8Array([]),
        amount: Long.fromNumber(300_000),
      },
      timestamp: Long.fromNumber(1000000000),
      version: 3,
      exchange: {
        amount: Long.fromString('9007199254740993'), // > MAX_SAFE_INTEGER
        price: Long.fromString('999999999999999999'),
        buyMatcherFee: Long.MAX_VALUE,
        sellMatcherFee: Long.fromNumber(0),
        orders: [],
      },
    };

    const buffer = dccProto.Transaction.encode(original).finish();
    const decoded = dccProto.Transaction.decode(buffer);
    const exchange = assertDefined(decoded.exchange);
    expect(assertDefined(exchange.amount).toString()).toBe('9007199254740993');
    expect(assertDefined(exchange.price).toString()).toBe('999999999999999999');
    expect(assertDefined(exchange.buyMatcherFee).toString()).toBe(Long.MAX_VALUE.toString());
    expect(assertDefined(exchange.sellMatcherFee).toNumber()).toBe(0);
  });

  it('should produce deterministic encoding for complex transactions', () => {
    const tx = {
      chainId: 84,
      senderPublicKey: new Uint8Array(32).fill(0x01),
      fee: {
        assetId: new Uint8Array([]),
        amount: Long.fromNumber(500_000),
      },
      timestamp: Long.fromNumber(1000000000),
      version: 2,
      dataTransaction: {
        data: [
          { key: 'a', intValue: Long.fromNumber(1) },
          { key: 'b', boolValue: true },
          { key: 'c', stringValue: 'test' },
          { key: 'd', binaryValue: new Uint8Array([0xff]) },
        ],
      },
    };

    const buf1 = dccProto.Transaction.encode(tx).finish();
    const buf2 = dccProto.Transaction.encode(tx).finish();
    const buf3 = dccProto.Transaction.encode(tx).finish();
    expect(buf1).toEqual(buf2);
    expect(buf2).toEqual(buf3);
  });

  it('should handle MassTransfer with max recipients count', () => {
    const transfers = Array.from({ length: 100 }, (_, i) => ({
      recipient: { alias: `r${i}` },
      amount: Long.fromNumber((i + 1) * 1_000_000),
    }));

    const original = {
      chainId: 84,
      senderPublicKey: new Uint8Array(32).fill(0x01),
      fee: {
        assetId: new Uint8Array([]),
        amount: Long.fromNumber(5_100_000),
      },
      timestamp: Long.fromNumber(1000000000),
      version: 2,
      massTransfer: {
        assetId: new Uint8Array([]),
        transfers,
        attachment: new Uint8Array([]),
      },
    };

    const buffer = dccProto.Transaction.encode(original).finish();
    const decoded = dccProto.Transaction.decode(buffer);
    const mt = assertDefined(decoded.massTransfer);
    const mtTransfers = assertDefined(mt.transfers);
    expect(mtTransfers).toHaveLength(100);
    // Verify first and last
    expect(assertDefined(mtTransfers[0].amount).toNumber()).toBe(1_000_000);
    expect(assertDefined(mtTransfers[99].amount).toNumber()).toBe(100_000_000);
    expect(assertDefined(mtTransfers[99].recipient).alias).toBe('r99');
  });

  it('should handle DataEntry with empty key (proto3 allows it)', () => {
    const original = {
      chainId: 84,
      senderPublicKey: new Uint8Array(32).fill(0x01),
      fee: {
        assetId: new Uint8Array([]),
        amount: Long.fromNumber(500_000),
      },
      timestamp: Long.fromNumber(1000000000),
      version: 2,
      dataTransaction: {
        data: [{ key: '', intValue: Long.fromNumber(0) }],
      },
    };

    const buffer = dccProto.Transaction.encode(original).finish();
    const decoded = dccProto.Transaction.decode(buffer);
    const dataTx = assertDefined(decoded.dataTransaction);
    // Empty string is proto3 default — key may or may not be present
    expect(dataTx.data).toHaveLength(1);
  });

  it('should handle DataEntry with delete semantics (no value set)', () => {
    const original = {
      chainId: 84,
      senderPublicKey: new Uint8Array(32).fill(0x01),
      fee: {
        assetId: new Uint8Array([]),
        amount: Long.fromNumber(500_000),
      },
      timestamp: Long.fromNumber(1000000000),
      version: 2,
      dataTransaction: {
        data: [{ key: 'to-delete' }], // No value field = delete entry
      },
    };

    const buffer = dccProto.Transaction.encode(original).finish();
    const decoded = dccProto.Transaction.decode(buffer);
    const dataTx = assertDefined(decoded.dataTransaction);
    const dataEntries = assertDefined(dataTx.data);
    expect(dataEntries).toHaveLength(1);
    expect(dataEntries[0].key).toBe('to-delete');
    // protobufjs represents unset oneOf value fields as null, not undefined.
    // This is correct proto3 behavior — a DataEntry with no value set
    // is the canonical delete semantics on the DecentralChain blockchain.
    expect(dataEntries[0].intValue).toBeNull();
    expect(dataEntries[0].boolValue).toBeNull();
    expect(dataEntries[0].binaryValue).toBeNull();
    expect(dataEntries[0].stringValue).toBeNull();
  });

  it('should not silently swallow unknown oneOf fields in Transaction.data', () => {
    // Encode a transfer, then decode — only the transfer oneOf should be present
    const original = {
      chainId: 84,
      senderPublicKey: new Uint8Array(32).fill(0x01),
      fee: {
        assetId: new Uint8Array([]),
        amount: Long.fromNumber(100_000),
      },
      timestamp: Long.fromNumber(1000000000),
      version: 3,
      transfer: {
        recipient: { alias: 'x' },
        amount: {
          assetId: new Uint8Array([]),
          amount: Long.fromNumber(1),
        },
        attachment: new Uint8Array([]),
      },
    };

    const buffer = dccProto.Transaction.encode(original).finish();
    const decoded = dccProto.Transaction.decode(buffer);
    // Transfer should be set
    expect(decoded.transfer).toBeDefined();
    // protobufjs represents unset oneOf variants as null.
    // Verify no cross-contamination between oneOf transaction data fields.
    expect(decoded.genesis).toBeNull();
    expect(decoded.payment).toBeNull();
    expect(decoded.issue).toBeNull();
    expect(decoded.reissue).toBeNull();
    expect(decoded.burn).toBeNull();
    expect(decoded.exchange).toBeNull();
    expect(decoded.lease).toBeNull();
    expect(decoded.leaseCancel).toBeNull();
    expect(decoded.createAlias).toBeNull();
    expect(decoded.massTransfer).toBeNull();
    expect(decoded.dataTransaction).toBeNull();
    expect(decoded.setScript).toBeNull();
    expect(decoded.sponsorFee).toBeNull();
    expect(decoded.setAssetScript).toBeNull();
    expect(decoded.invokeScript).toBeNull();
    expect(decoded.updateAssetInfo).toBeNull();
    expect(decoded.invokeExpression).toBeNull();
    expect(decoded.commitToGeneration).toBeNull();
  });
});
