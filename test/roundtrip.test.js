import { describe, it, expect } from "vitest";
import { waves } from "../dist/index.js";
import Long from "long";

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

describe("protobuf roundtrip encoding", () => {
  describe("Amount", () => {
    it("should encode and decode with asset_id and amount", () => {
      const original = {
        assetId: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
        amount: Long.fromNumber(1_000_000),
      };

      const buffer = waves.Amount.encode(original).finish();
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(0);

      const decoded = waves.Amount.decode(buffer);
      expect(decoded.amount.toNumber()).toBe(1_000_000);
      expect(new Uint8Array(decoded.assetId)).toEqual(
        new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
      );
    });

    it("should encode and decode with zero amount (native token)", () => {
      const original = {
        assetId: new Uint8Array([]),
        amount: Long.fromNumber(0),
      };

      const buffer = waves.Amount.encode(original).finish();
      const decoded = waves.Amount.decode(buffer);
      expect(decoded.amount.toNumber()).toBe(0);
    });

    it("should handle large int64 values beyond Number.MAX_SAFE_INTEGER", () => {
      const largeValue = Long.fromString("9007199254740993"); // > Number.MAX_SAFE_INTEGER
      const original = {
        assetId: new Uint8Array([10, 20]),
        amount: largeValue,
      };

      const buffer = waves.Amount.encode(original).finish();
      const decoded = waves.Amount.decode(buffer);
      expect(decoded.amount.toString()).toBe("9007199254740993");
    });

    it("should handle negative int64 values", () => {
      const original = {
        assetId: new Uint8Array([]),
        amount: Long.fromNumber(-1),
      };

      const buffer = waves.Amount.encode(original).finish();
      const decoded = waves.Amount.decode(buffer);
      expect(decoded.amount.toNumber()).toBe(-1);
    });

    it("should handle max int64 value", () => {
      const maxLong = Long.MAX_VALUE;
      const original = {
        assetId: new Uint8Array([0xff]),
        amount: maxLong,
      };

      const buffer = waves.Amount.encode(original).finish();
      const decoded = waves.Amount.decode(buffer);
      expect(decoded.amount.toString()).toBe(maxLong.toString());
    });

    it("should produce deterministic encoding (same input → same bytes)", () => {
      const original = {
        assetId: new Uint8Array([1, 2, 3]),
        amount: Long.fromNumber(42),
      };

      const buffer1 = waves.Amount.encode(original).finish();
      const buffer2 = waves.Amount.encode(original).finish();
      expect(buffer1).toEqual(buffer2);
    });
  });

  describe("Recipient", () => {
    it("should encode and decode with public_key_hash", () => {
      const publicKeyHash = new Uint8Array(20);
      publicKeyHash.fill(0xab);

      const original = {
        publicKeyHash,
      };

      const buffer = waves.Recipient.encode(original).finish();
      const decoded = waves.Recipient.decode(buffer);
      expect(decoded.publicKeyHash).toBeDefined();
      expect(
        new Uint8Array(/** @type {Uint8Array} */ (decoded.publicKeyHash)),
      ).toEqual(publicKeyHash);
    });

    it("should encode and decode with alias", () => {
      const original = {
        alias: "test-alias",
      };

      const buffer = waves.Recipient.encode(original).finish();
      const decoded = waves.Recipient.decode(buffer);
      expect(decoded.alias).toBe("test-alias");
    });

    it("should handle empty alias string", () => {
      const original = {
        alias: "",
      };

      const buffer = waves.Recipient.encode(original).finish();
      const decoded = waves.Recipient.decode(buffer);
      // Empty string is the proto3 default, so alias field may not be set
      expect(decoded.alias === "" || decoded.alias === undefined).toBe(true);
    });

    it("should handle max-length alias (30 characters)", () => {
      const original = {
        alias: "a".repeat(30),
      };

      const buffer = waves.Recipient.encode(original).finish();
      const decoded = waves.Recipient.decode(buffer);
      expect(decoded.alias).toBe("a".repeat(30));
    });
  });

  describe("Block.Header", () => {
    it("should encode and decode a basic block header", () => {
      const original = {
        chainId: 84, // T for testnet
        version: 5,
        timestamp: Long.fromNumber(Date.now()),
        baseTarget: Long.fromNumber(100),
        generationSignature: new Uint8Array(32).fill(0xcc),
        generator: new Uint8Array(32).fill(0xdd),
        rewardVote: Long.fromNumber(-1),
      };

      const buffer = waves.Block.Header.encode(original).finish();
      const decoded = waves.Block.Header.decode(buffer);

      expect(decoded.chainId).toBe(84);
      expect(decoded.version).toBe(5);
      expect(decoded.baseTarget.toNumber()).toBe(100);
      expect(decoded.rewardVote.toNumber()).toBe(-1);
    });

    it("should preserve feature_votes array", () => {
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

      const buffer = waves.Block.Header.encode(original).finish();
      const decoded = waves.Block.Header.decode(buffer);
      expect(decoded.featureVotes).toEqual([1, 2, 14, 15]);
    });

    it("should encode and decode a full Block with transactions", () => {
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

      const buffer = waves.Block.encode(block).finish();
      const decoded = waves.Block.decode(buffer);
      const decodedHeader = assertDefined(decoded.header);
      expect(decodedHeader.chainId).toBe(84);
      expect(new Uint8Array(decoded.signature)).toEqual(
        new Uint8Array(64).fill(0xee),
      );
      expect(decoded.transactions).toEqual([]);
    });
  });

  describe("RewardShare", () => {
    it("should encode and decode reward share", () => {
      const original = {
        address: new Uint8Array(26).fill(0x01),
        reward: Long.fromNumber(600000000),
      };

      const buffer = waves.RewardShare.encode(original).finish();
      const decoded = waves.RewardShare.decode(buffer);

      expect(decoded.reward.toNumber()).toBe(600000000);
      expect(new Uint8Array(decoded.address)).toEqual(
        new Uint8Array(26).fill(0x01),
      );
    });

    it("should handle zero reward", () => {
      const original = {
        address: new Uint8Array(26).fill(0x02),
        reward: Long.fromNumber(0),
      };

      const buffer = waves.RewardShare.encode(original).finish();
      const decoded = waves.RewardShare.decode(buffer);
      expect(decoded.reward.toNumber()).toBe(0);
    });
  });

  describe("Order", () => {
    it("should encode and decode a BUY order", () => {
      const original = {
        chainId: 84,
        matcherPublicKey: new Uint8Array(32).fill(0x11),
        assetPair: {
          amountAssetId: new Uint8Array([1, 2, 3, 4]),
          priceAssetId: new Uint8Array([5, 6, 7, 8]),
        },
        orderSide: waves.Order.Side.BUY,
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

      const buffer = waves.Order.encode(original).finish();
      expect(buffer.length).toBeGreaterThan(0);

      const decoded = waves.Order.decode(buffer);
      expect(decoded.chainId).toBe(84);
      expect(decoded.orderSide).toBe(waves.Order.Side.BUY);
      expect(decoded.amount.toNumber()).toBe(100_000_000);
      expect(decoded.price.toNumber()).toBe(50_000);
      expect(decoded.version).toBe(4);
    });

    it("should encode and decode a SELL order", () => {
      const original = {
        chainId: 84,
        orderSide: waves.Order.Side.SELL,
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

      const buffer = waves.Order.encode(original).finish();
      const decoded = waves.Order.decode(buffer);
      expect(decoded.orderSide).toBe(waves.Order.Side.SELL);
      expect(decoded.amount.toNumber()).toBe(500_000_000);
    });

    it("should preserve AssetPair fields through encoding", () => {
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

      const buffer = waves.Order.encode(original).finish();
      const decoded = waves.Order.decode(buffer);
      const pair = assertDefined(decoded.assetPair);
      expect(new Uint8Array(assertDefined(pair.amountAssetId))).toEqual(
        amountAsset,
      );
      expect(new Uint8Array(assertDefined(pair.priceAssetId))).toEqual(
        priceAsset,
      );
    });
  });

  describe("Transaction", () => {
    it("should encode and decode a TransferTransactionData", () => {
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
          recipient: { alias: "bob" },
          amount: {
            assetId: new Uint8Array([]),
            amount: Long.fromNumber(10_000_000),
          },
          attachment: new Uint8Array([0xde, 0xad]),
        },
      };

      const buffer = waves.Transaction.encode(original).finish();
      const decoded = waves.Transaction.decode(buffer);

      expect(decoded.chainId).toBe(84);
      expect(decoded.version).toBe(3);
      const fee = assertDefined(decoded.fee);
      const feeAmount = assertDefined(fee.amount);
      expect(feeAmount.toNumber()).toBe(100_000);
      const transfer = assertDefined(decoded.transfer);
      const recipient = assertDefined(transfer.recipient);
      expect(recipient.alias).toBe("bob");
      const transferAmt = assertDefined(transfer.amount);
      const transferAmtValue = assertDefined(transferAmt.amount);
      expect(transferAmtValue.toNumber()).toBe(10_000_000);
      expect(new Uint8Array(assertDefined(transfer.attachment))).toEqual(
        new Uint8Array([0xde, 0xad]),
      );
    });

    it("should encode and decode a CreateAliasTransactionData", () => {
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
          alias: "my-alias",
        },
      };

      const buffer = waves.Transaction.encode(original).finish();
      const decoded = waves.Transaction.decode(buffer);
      const createAlias = assertDefined(decoded.createAlias);
      expect(createAlias.alias).toBe("my-alias");
    });

    it("should encode and decode a DataTransactionData with all entry types", () => {
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
            { key: "intKey", intValue: Long.fromNumber(42) },
            { key: "boolKey", boolValue: true },
            { key: "binaryKey", binaryValue: new Uint8Array([0xca, 0xfe]) },
            { key: "stringKey", stringValue: "hello" },
          ],
        },
      };

      const buffer = waves.Transaction.encode(original).finish();
      const decoded = waves.Transaction.decode(buffer);
      const dataTx = assertDefined(decoded.dataTransaction);
      const entries = assertDefined(dataTx.data);

      expect(entries).toHaveLength(4);
      expect(entries[0].key).toBe("intKey");
      expect(assertDefined(entries[0].intValue).toNumber()).toBe(42);
      expect(entries[1].key).toBe("boolKey");
      expect(entries[1].boolValue).toBe(true);
      expect(entries[2].key).toBe("binaryKey");
      expect(new Uint8Array(assertDefined(entries[2].binaryValue))).toEqual(
        new Uint8Array([0xca, 0xfe]),
      );
      expect(entries[3].key).toBe("stringKey");
      expect(entries[3].stringValue).toBe("hello");
    });

    it("should encode and decode IssueTransactionData", () => {
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
          name: "TestToken",
          description: "A test token for DecentralChain",
          amount: Long.fromNumber(1_000_000_000_000),
          decimals: 8,
          reissuable: true,
          script: new Uint8Array([]),
        },
      };

      const buffer = waves.Transaction.encode(original).finish();
      const decoded = waves.Transaction.decode(buffer);
      const issue = assertDefined(decoded.issue);
      expect(issue.name).toBe("TestToken");
      expect(issue.decimals).toBe(8);
      expect(issue.reissuable).toBe(true);
      expect(assertDefined(issue.amount).toNumber()).toBe(1_000_000_000_000);
    });

    it("should encode and decode MassTransferTransactionData", () => {
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
              recipient: { alias: "alice" },
              amount: Long.fromNumber(1_000_000),
            },
            { recipient: { alias: "bob" }, amount: Long.fromNumber(2_000_000) },
            {
              recipient: { alias: "carol" },
              amount: Long.fromNumber(3_000_000),
            },
          ],
          attachment: new Uint8Array([0x01, 0x02]),
        },
      };

      const buffer = waves.Transaction.encode(original).finish();
      const decoded = waves.Transaction.decode(buffer);
      const mt = assertDefined(decoded.massTransfer);
      const transfers = assertDefined(mt.transfers);
      expect(transfers).toHaveLength(3);
      expect(assertDefined(transfers[0].recipient).alias).toBe("alice");
      expect(assertDefined(transfers[0].amount).toNumber()).toBe(1_000_000);
      expect(assertDefined(transfers[2].recipient).alias).toBe("carol");
      expect(assertDefined(transfers[2].amount).toNumber()).toBe(3_000_000);
    });
  });

  describe("SignedTransaction", () => {
    it("should encode and decode a signed transaction with proofs", () => {
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
          recipient: { alias: "test" },
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

      const buffer = waves.SignedTransaction.encode(signedTx).finish();
      const decoded = waves.SignedTransaction.decode(buffer);

      const inner = assertDefined(decoded.wavesTransaction);
      expect(inner.chainId).toBe(84);
      expect(decoded.proofs).toHaveLength(1);
      expect(decoded.proofs[0]).toHaveLength(64);
    });

    it("should encode and decode with multiple proofs (multisig)", () => {
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
          createAlias: { alias: "multisig-test" },
        },
        proofs: [
          new Uint8Array(64).fill(0xaa),
          new Uint8Array(64).fill(0xbb),
          new Uint8Array(64).fill(0xcc),
        ],
      };

      const buffer = waves.SignedTransaction.encode(signedTx).finish();
      const decoded = waves.SignedTransaction.decode(buffer);
      expect(decoded.proofs).toHaveLength(3);
      expect(new Uint8Array(decoded.proofs[1])).toEqual(
        new Uint8Array(64).fill(0xbb),
      );
    });
  });

  describe("InvokeExpressionTransactionData", () => {
    it("should encode and decode an invoke expression transaction", () => {
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

      const buffer = waves.Transaction.encode(original).finish();
      const decoded = waves.Transaction.decode(buffer);
      const invokeExpr = assertDefined(decoded.invokeExpression);
      expect(new Uint8Array(assertDefined(invokeExpr.expression))).toEqual(
        new Uint8Array([0x01, 0x02, 0x03, 0x04]),
      );
    });

    it("should handle empty expression bytes", () => {
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

      const buffer = waves.Transaction.encode(original).finish();
      const decoded = waves.Transaction.decode(buffer);
      const invokeExpr = assertDefined(decoded.invokeExpression);
      expect(invokeExpr.expression).toBeDefined();
    });
  });

  describe("CommitToGenerationTransactionData", () => {
    it("should encode and decode a commit to generation transaction", () => {
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

      const buffer = waves.Transaction.encode(original).finish();
      const decoded = waves.Transaction.decode(buffer);
      const commit = assertDefined(decoded.commitToGeneration);
      expect(commit.generationPeriodStart).toBe(42);
      expect(new Uint8Array(assertDefined(commit.endorserPublicKey))).toEqual(
        new Uint8Array(48).fill(0xaa),
      );
      expect(new Uint8Array(assertDefined(commit.commitmentSignature))).toEqual(
        new Uint8Array(96).fill(0xbb),
      );
    });

    it("should handle zero generation_period_start", () => {
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

      const buffer = waves.Transaction.encode(original).finish();
      const decoded = waves.Transaction.decode(buffer);
      const commit = assertDefined(decoded.commitToGeneration);
      // 0 is proto3 default — field may not be present on the wire
      expect(
        commit.generationPeriodStart === 0 ||
          commit.generationPeriodStart === undefined,
      ).toBe(true);
    });
  });

  describe("InvokeScriptResult", () => {
    it("should encode and decode a result with data entries and transfers", () => {
      const original = {
        data: [
          { key: "counter", intValue: Long.fromNumber(100) },
          { key: "flag", boolValue: true },
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

      const buffer = waves.InvokeScriptResult.encode(original).finish();
      const decoded = waves.InvokeScriptResult.decode(buffer);
      expect(decoded.data).toHaveLength(2);
      expect(decoded.data[0].key).toBe("counter");
      expect(assertDefined(decoded.data[0].intValue).toNumber()).toBe(100);
      expect(decoded.transfers).toHaveLength(1);
      const transferAmt = assertDefined(decoded.transfers[0].amount);
      expect(assertDefined(transferAmt.amount).toNumber()).toBe(5_000_000);
    });

    it("should encode and decode error messages", () => {
      const original = {
        errorMessage: {
          code: 1,
          text: "InvokeScript execution failed",
        },
      };

      const buffer = waves.InvokeScriptResult.encode(original).finish();
      const decoded = waves.InvokeScriptResult.decode(buffer);
      const err = assertDefined(decoded.errorMessage);
      expect(err.code).toBe(1);
      expect(err.text).toBe("InvokeScript execution failed");
    });
  });

  describe("TransactionStateSnapshot", () => {
    it("should encode and decode balance snapshots", () => {
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

      const buffer = waves.TransactionStateSnapshot.encode(original).finish();
      const decoded = waves.TransactionStateSnapshot.decode(buffer);
      expect(decoded.balances).toHaveLength(1);
      const bal = assertDefined(decoded.balances[0].amount);
      expect(assertDefined(bal.amount).toNumber()).toBe(10_000_000);
    });
  });

  describe("events (BlockchainUpdated)", () => {
    it("should encode and decode a BlockchainUpdated message", () => {
      const original = {
        id: new Uint8Array(32).fill(0x01),
        height: 1000,
      };

      const buffer = waves.events.BlockchainUpdated.encode(original).finish();
      const decoded = waves.events.BlockchainUpdated.decode(buffer);
      expect(new Uint8Array(decoded.id)).toEqual(new Uint8Array(32).fill(0x01));
      expect(decoded.height).toBe(1000);
    });
  });
});

describe("protobuf namespace structure", () => {
  it("should export the waves namespace", () => {
    expect(waves).toBeDefined();
  });

  it("should contain core message types with encode/decode methods", () => {
    const coreTypes = [
      waves.Amount,
      waves.Block,
      waves.Transaction,
      waves.SignedTransaction,
      waves.Order,
      waves.Recipient,
      waves.RewardShare,
    ];

    for (const type of coreTypes) {
      expect(type).toBeDefined();
      expect(type.encode).toBeTypeOf("function");
      expect(type.decode).toBeTypeOf("function");
    }
  });

  it("should contain Block.Header nested type", () => {
    expect(waves.Block.Header).toBeDefined();
    expect(waves.Block.Header.encode).toBeTypeOf("function");
    expect(waves.Block.Header.decode).toBeTypeOf("function");
  });

  it("should contain all transaction data types", () => {
    const txTypes = [
      waves.GenesisTransactionData,
      waves.PaymentTransactionData,
      waves.TransferTransactionData,
      waves.CreateAliasTransactionData,
      waves.DataTransactionData,
      waves.IssueTransactionData,
      waves.ReissueTransactionData,
      waves.BurnTransactionData,
      waves.ExchangeTransactionData,
      waves.LeaseTransactionData,
      waves.LeaseCancelTransactionData,
      waves.MassTransferTransactionData,
      waves.SetScriptTransactionData,
      waves.SponsorFeeTransactionData,
      waves.SetAssetScriptTransactionData,
      waves.InvokeScriptTransactionData,
      waves.UpdateAssetInfoTransactionData,
      waves.InvokeExpressionTransactionData,
      waves.CommitToGenerationTransactionData,
    ];

    for (const type of txTypes) {
      expect(type).toBeDefined();
      expect(type.encode).toBeTypeOf("function");
      expect(type.decode).toBeTypeOf("function");
    }
  });

  it("should contain Order enums", () => {
    expect(waves.Order.Side).toBeDefined();
    expect(waves.Order.Side.BUY).toBe(0);
    expect(waves.Order.Side.SELL).toBe(1);
    expect(waves.Order.PriceMode).toBeDefined();
  });

  it("should contain AssetPair message", () => {
    expect(waves.AssetPair).toBeDefined();
    expect(waves.AssetPair.encode).toBeTypeOf("function");
    expect(waves.AssetPair.decode).toBeTypeOf("function");
  });

  it("should contain events namespace", () => {
    expect(waves.events).toBeDefined();
    expect(waves.events.BlockchainUpdated).toBeDefined();
    expect(waves.events.BlockchainUpdated.encode).toBeTypeOf("function");
    expect(waves.events.BlockchainUpdated.decode).toBeTypeOf("function");
  });

  it("should contain events.grpc namespace", () => {
    expect(waves.events.grpc).toBeDefined();
    expect(waves.events.grpc.BlockchainUpdatesApi).toBeDefined();
  });

  it("should contain node.grpc namespace with API services", () => {
    expect(waves.node).toBeDefined();
    expect(waves.node.grpc).toBeDefined();
    expect(waves.node.grpc.AccountsApi).toBeDefined();
    expect(waves.node.grpc.TransactionsApi).toBeDefined();
    expect(waves.node.grpc.BlocksApi).toBeDefined();
    expect(waves.node.grpc.AssetsApi).toBeDefined();
    expect(waves.node.grpc.BlockchainApi).toBeDefined();
  });

  it("should contain DataEntry message with all value types", () => {
    expect(waves.DataEntry).toBeDefined();
    expect(waves.DataEntry.encode).toBeTypeOf("function");
    expect(waves.DataEntry.decode).toBeTypeOf("function");
  });

  it("should contain InvokeScriptResult for smart contract outputs", () => {
    expect(waves.InvokeScriptResult).toBeDefined();
    expect(waves.InvokeScriptResult.encode).toBeTypeOf("function");
    expect(waves.InvokeScriptResult.decode).toBeTypeOf("function");
  });
});

describe("protobuf error handling", () => {
  it("should throw on corrupt buffer", () => {
    const corruptBuffer = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff]);
    expect(() => waves.Amount.decode(corruptBuffer)).toThrow();
  });

  it("should decode empty buffer to default values", () => {
    const emptyBuffer = new Uint8Array([]);
    const decoded = waves.Amount.decode(emptyBuffer);
    expect(decoded.amount.toNumber()).toBe(0);
  });

  it("should throw when buffer is truncated mid-field", () => {
    const original = {
      assetId: new Uint8Array(32).fill(0xaa),
      amount: Long.fromNumber(1_000_000),
    };
    const fullBuffer = waves.Amount.encode(original).finish();
    // Truncate to half the buffer
    const truncated = fullBuffer.slice(0, Math.floor(fullBuffer.length / 2));
    expect(() => waves.Amount.decode(truncated)).toThrow();
  });
});
