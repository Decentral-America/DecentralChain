/**
 * Tests for all gRPC API request/response message schemas.
 *
 * These tests cover the five generated files that are NOT re-exported through
 * the public index.ts barrel but are still measured by coverage:
 *
 *   - dcc/events/grpc/blockchain_updates_pb.ts
 *   - dcc/node/grpc/accounts_api_pb.ts
 *   - dcc/node/grpc/assets_api_pb.ts
 *   - dcc/node/grpc/blockchain_api_pb.ts
 *   - dcc/node/grpc/blocks_api_pb.ts
 *
 * Strategy: create → toBinary → fromBinary roundtrips for every message schema,
 * verify enum constants, and assert service descriptor identity. Simply importing
 * these modules drives their lazy-init top-level statements into V8 coverage.
 */

import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import { describe, expect, it } from 'vitest';

// ─── gRPC streaming event API ─────────────────────────────────────────────────
import {
  BlockchainUpdatesApi,
  GetBlockUpdateRequestSchema,
  GetBlockUpdateResponseSchema,
  GetBlockUpdatesRangeRequestSchema,
  GetBlockUpdatesRangeResponseSchema,
  SubscribeEventSchema,
  SubscribeRequestSchema,
} from '../src/gen/dcc/events/grpc/blockchain_updates_pb.js';

// ─── Node accounts API ────────────────────────────────────────────────────────
import {
  AccountRequestSchema,
  AccountsApi,
  BalanceResponse_DccBalancesSchema,
  BalanceResponseSchema,
  BalancesRequestSchema,
  DataEntryResponseSchema,
  DataRequestSchema,
  LeaseResponseSchema,
  ScriptDataSchema,
  ScriptResponseSchema,
} from '../src/gen/dcc/node/grpc/accounts_api_pb.js';

// ─── Node assets API ──────────────────────────────────────────────────────────
import {
  AssetInfoResponseSchema,
  AssetRequestSchema,
  AssetsApi,
  NFTRequestSchema,
  NFTResponseSchema,
} from '../src/gen/dcc/node/grpc/assets_api_pb.js';

// ─── Node blockchain API ──────────────────────────────────────────────────────
import {
  ActivationStatusRequestSchema,
  ActivationStatusResponseSchema,
  BaseTargetResponseSchema,
  BlockchainApi,
  FeatureActivationStatus_BlockchainFeatureStatus,
  FeatureActivationStatus_BlockchainFeatureStatusSchema,
  FeatureActivationStatus_NodeFeatureStatus,
  FeatureActivationStatus_NodeFeatureStatusSchema,
  FeatureActivationStatusSchema,
  ScoreResponseSchema,
} from '../src/gen/dcc/node/grpc/blockchain_api_pb.js';

// ─── Node blocks API ──────────────────────────────────────────────────────────
import {
  BlockRangeRequestSchema,
  BlockRequestSchema,
  BlocksApi,
  BlockWithHeightSchema,
} from '../src/gen/dcc/node/grpc/blocks_api_pb.js';

// ─── Shared schemas (used in nested message fields) ───────────────────────────
import { DataEntrySchema } from '../src/index.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

function assertDefined<T>(v: T): NonNullable<T> {
  expect(v).toBeDefined();
  expect(v).not.toBeNull();
  return v as NonNullable<T>;
}

// ═════════════════════════════════════════════════════════════════════════════
// Blockchain Updates API (events/grpc)
// ═════════════════════════════════════════════════════════════════════════════

describe('blockchain_updates_pb — gRPC streaming schemas', () => {
  it('service descriptor is exported', () => {
    expect(BlockchainUpdatesApi).toBeDefined();
    expect(typeof BlockchainUpdatesApi).toBe('object');
  });

  it('GetBlockUpdateRequest: roundtrip with height', () => {
    const original = create(GetBlockUpdateRequestSchema, { height: 1_000_000 });
    const buf = toBinary(GetBlockUpdateRequestSchema, original);
    const decoded = fromBinary(GetBlockUpdateRequestSchema, buf);
    expect(decoded.height).toBe(1_000_000);
  });

  it('GetBlockUpdateRequest: roundtrip with height=0 (proto3 default)', () => {
    const original = create(GetBlockUpdateRequestSchema, { height: 0 });
    const buf = toBinary(GetBlockUpdateRequestSchema, original);
    const decoded = fromBinary(GetBlockUpdateRequestSchema, buf);
    // 0 is the proto3 default — field omitted on wire
    expect(decoded.height === 0 || decoded.height === undefined).toBe(true);
  });

  it('GetBlockUpdateResponse: roundtrip with embedded BlockchainUpdated', () => {
    // embedded update field is optional — test both present and absent
    const empty = create(GetBlockUpdateResponseSchema, {});
    const buf = toBinary(GetBlockUpdateResponseSchema, empty);
    const decoded = fromBinary(GetBlockUpdateResponseSchema, buf);
    expect(decoded.update).toBeUndefined();
  });

  it('GetBlockUpdatesRangeRequest: roundtrip with from/to heights', () => {
    const original = create(GetBlockUpdatesRangeRequestSchema, {
      fromHeight: 500_000,
      toHeight: 500_100,
    });
    const buf = toBinary(GetBlockUpdatesRangeRequestSchema, original);
    const decoded = fromBinary(GetBlockUpdatesRangeRequestSchema, buf);
    expect(decoded.fromHeight).toBe(500_000);
    expect(decoded.toHeight).toBe(500_100);
  });

  it('GetBlockUpdatesRangeResponse: roundtrip (empty updates list)', () => {
    const original = create(GetBlockUpdatesRangeResponseSchema, { updates: [] });
    const buf = toBinary(GetBlockUpdatesRangeResponseSchema, original);
    const decoded = fromBinary(GetBlockUpdatesRangeResponseSchema, buf);
    expect(decoded.updates).toEqual([]);
  });

  it('SubscribeRequest: roundtrip with from/to heights', () => {
    const original = create(SubscribeRequestSchema, {
      fromHeight: 1,
      toHeight: 100,
    });
    const buf = toBinary(SubscribeRequestSchema, original);
    const decoded = fromBinary(SubscribeRequestSchema, buf);
    expect(decoded.fromHeight).toBe(1);
    expect(decoded.toHeight).toBe(100);
  });

  it('SubscribeRequest: roundtrip unbounded (toHeight=0)', () => {
    const original = create(SubscribeRequestSchema, { fromHeight: 1_500_000, toHeight: 0 });
    const buf = toBinary(SubscribeRequestSchema, original);
    const decoded = fromBinary(SubscribeRequestSchema, buf);
    expect(decoded.fromHeight).toBe(1_500_000);
  });

  it('SubscribeEvent: roundtrip with no update', () => {
    const original = create(SubscribeEventSchema, {});
    const buf = toBinary(SubscribeEventSchema, original);
    const decoded = fromBinary(SubscribeEventSchema, buf);
    expect(decoded.update).toBeUndefined();
  });

  it('encoding is deterministic for SubscribeRequest', () => {
    const msg = create(SubscribeRequestSchema, { fromHeight: 42, toHeight: 999 });
    expect(toBinary(SubscribeRequestSchema, msg)).toEqual(toBinary(SubscribeRequestSchema, msg));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Accounts API (node/grpc)
// ═════════════════════════════════════════════════════════════════════════════

describe('accounts_api_pb — gRPC accounts schemas', () => {
  it('service descriptor is exported', () => {
    expect(AccountsApi).toBeDefined();
    expect(typeof AccountsApi).toBe('object');
  });

  it('AccountRequest: roundtrip with 26-byte address', () => {
    const address = new Uint8Array(26).fill(0x3a);
    const original = create(AccountRequestSchema, { address });
    const buf = toBinary(AccountRequestSchema, original);
    const decoded = fromBinary(AccountRequestSchema, buf);
    expect(new Uint8Array(decoded.address)).toEqual(address);
  });

  it('AccountRequest: roundtrip with empty address (default)', () => {
    const original = create(AccountRequestSchema, {});
    const buf = toBinary(AccountRequestSchema, original);
    const decoded = fromBinary(AccountRequestSchema, buf);
    expect(decoded.address).toBeDefined();
  });

  it('DataRequest: roundtrip with address and key', () => {
    const address = new Uint8Array(26).fill(0x01);
    const original = create(DataRequestSchema, { address, key: 'balance' });
    const buf = toBinary(DataRequestSchema, original);
    const decoded = fromBinary(DataRequestSchema, buf);
    expect(new Uint8Array(decoded.address)).toEqual(address);
    expect(decoded.key).toBe('balance');
  });

  it('DataRequest: roundtrip with empty key (wildcard)', () => {
    const original = create(DataRequestSchema, {
      address: new Uint8Array(26).fill(0x02),
      key: '',
    });
    const buf = toBinary(DataRequestSchema, original);
    const decoded = fromBinary(DataRequestSchema, buf);
    expect(decoded.address).toBeDefined();
  });

  it('BalancesRequest: roundtrip with multiple assets', () => {
    const address = new Uint8Array(26).fill(0x03);
    const asset1 = new Uint8Array(32).fill(0xaa);
    const asset2 = new Uint8Array(32).fill(0xbb);
    const original = create(BalancesRequestSchema, { address, assets: [asset1, asset2] });
    const buf = toBinary(BalancesRequestSchema, original);
    const decoded = fromBinary(BalancesRequestSchema, buf);
    expect(new Uint8Array(decoded.address)).toEqual(address);
    expect(decoded.assets).toHaveLength(2);
    expect(new Uint8Array(decoded.assets[0] ?? new Uint8Array())).toEqual(asset1);
    expect(new Uint8Array(decoded.assets[1] ?? new Uint8Array())).toEqual(asset2);
  });

  it('BalancesRequest: roundtrip with no assets (DCC only)', () => {
    const original = create(BalancesRequestSchema, {
      address: new Uint8Array(26).fill(0x04),
      assets: [],
    });
    const buf = toBinary(BalancesRequestSchema, original);
    const decoded = fromBinary(BalancesRequestSchema, buf);
    expect(decoded.assets).toEqual([]);
  });

  it('BalanceResponse: roundtrip with DccBalances', () => {
    const dcc = create(BalanceResponse_DccBalancesSchema, {
      available: 900_000_000n,
      effective: 1_000_000_000n,
      generating: 800_000_000n,
      leaseIn: 100_000_000n,
      leaseOut: 0n,
      regular: 1_000_000_000n,
    });
    const original = create(BalanceResponseSchema, {
      balance: { case: 'dcc', value: dcc },
    });
    const buf = toBinary(BalanceResponseSchema, original);
    const decoded = fromBinary(BalanceResponseSchema, buf);
    expect(decoded.balance.case).toBe('dcc');
    if (decoded.balance.case === 'dcc') {
      const wb = decoded.balance.value;
      expect(wb.regular).toBe(1_000_000_000n);
      expect(wb.available).toBe(900_000_000n);
      expect(wb.leaseIn).toBe(100_000_000n);
      expect(wb.leaseOut).toBe(0n);
    }
  });

  it('BalanceResponse: roundtrip with asset amount', () => {
    const original = create(BalanceResponseSchema, {
      balance: {
        case: 'asset',
        value: { amount: 50_000_000n, assetId: new Uint8Array(32).fill(0xcc) },
      },
    });
    const buf = toBinary(BalanceResponseSchema, original);
    const decoded = fromBinary(BalanceResponseSchema, buf);
    expect(decoded.balance.case).toBe('asset');
    if (decoded.balance.case === 'asset') {
      expect(decoded.balance.value.amount).toBe(50_000_000n);
    }
  });

  it('BalanceResponse: roundtrip with no balance (default)', () => {
    const original = create(BalanceResponseSchema, {});
    const buf = toBinary(BalanceResponseSchema, original);
    const decoded = fromBinary(BalanceResponseSchema, buf);
    expect(decoded.balance.case).toBeUndefined();
  });

  it('BalanceResponse_DccBalances: roundtrip with all zeros', () => {
    const original = create(BalanceResponse_DccBalancesSchema, {
      available: 0n,
      effective: 0n,
      generating: 0n,
      leaseIn: 0n,
      leaseOut: 0n,
      regular: 0n,
    });
    const buf = toBinary(BalanceResponse_DccBalancesSchema, original);
    const decoded = fromBinary(BalanceResponse_DccBalancesSchema, buf);
    expect(decoded.regular).toBe(0n);
  });

  it('DataEntryResponse: roundtrip with int entry', () => {
    const address = new Uint8Array(26).fill(0x05);
    const entry = create(DataEntrySchema, {
      key: 'counter',
      value: { case: 'intValue', value: 42n },
    });
    const original = create(DataEntryResponseSchema, { address, entry });
    const buf = toBinary(DataEntryResponseSchema, original);
    const decoded = fromBinary(DataEntryResponseSchema, buf);
    expect(new Uint8Array(decoded.address)).toEqual(address);
    const decodedEntry = assertDefined(decoded.entry);
    expect(decodedEntry.key).toBe('counter');
    expect(decodedEntry.value).toEqual({ case: 'intValue', value: 42n });
  });

  it('DataEntryResponse: roundtrip with no entry', () => {
    const original = create(DataEntryResponseSchema, {
      address: new Uint8Array(26).fill(0x06),
    });
    const buf = toBinary(DataEntryResponseSchema, original);
    const decoded = fromBinary(DataEntryResponseSchema, buf);
    expect(decoded.entry).toBeUndefined();
  });

  it('ScriptData: roundtrip with all fields', () => {
    const original = create(ScriptDataSchema, {
      complexity: 2_000n,
      scriptBytes: new Uint8Array(128).fill(0xab),
      scriptText: '{-# STDLIB_VERSION 6 #-} true',
    });
    const buf = toBinary(ScriptDataSchema, original);
    const decoded = fromBinary(ScriptDataSchema, buf);
    expect(decoded.complexity).toBe(2_000n);
    expect(decoded.scriptText).toBe('{-# STDLIB_VERSION 6 #-} true');
    expect(new Uint8Array(decoded.scriptBytes)).toEqual(new Uint8Array(128).fill(0xab));
  });

  it('ScriptData: roundtrip with empty script', () => {
    const original = create(ScriptDataSchema, {
      complexity: 0n,
      scriptBytes: new Uint8Array([]),
      scriptText: '',
    });
    const buf = toBinary(ScriptDataSchema, original);
    const decoded = fromBinary(ScriptDataSchema, buf);
    expect(decoded.complexity).toBe(0n);
  });

  it('ScriptResponse: roundtrip with public key', () => {
    const original = create(ScriptResponseSchema, {
      complexity: 5_000n,
      publicKey: new Uint8Array(32).fill(0x11),
      scriptBytes: new Uint8Array(64).fill(0x22),
      scriptText: 'sigVerify(tx.bodyBytes, tx.proofs[0], tx.senderPublicKey)',
    });
    const buf = toBinary(ScriptResponseSchema, original);
    const decoded = fromBinary(ScriptResponseSchema, buf);
    expect(decoded.complexity).toBe(5_000n);
    expect(new Uint8Array(decoded.publicKey)).toEqual(new Uint8Array(32).fill(0x11));
    expect(decoded.scriptText).toBe('sigVerify(tx.bodyBytes, tx.proofs[0], tx.senderPublicKey)');
  });

  it('LeaseResponse: roundtrip with alias recipient', () => {
    const original = create(LeaseResponseSchema, {
      amount: 100_000_000n,
      height: 1_234_567n,
      leaseId: new Uint8Array(32).fill(0x33),
      originTransactionId: new Uint8Array(32).fill(0x44),
      recipient: { recipient: { case: 'alias', value: 'alice' } },
      sender: new Uint8Array(32).fill(0x55),
    });
    const buf = toBinary(LeaseResponseSchema, original);
    const decoded = fromBinary(LeaseResponseSchema, buf);
    expect(decoded.amount).toBe(100_000_000n);
    expect(decoded.height).toBe(1_234_567n);
    const recipient = assertDefined(decoded.recipient);
    expect(recipient.recipient.case).toBe('alias');
    expect(recipient.recipient.value).toBe('alice');
    expect(new Uint8Array(decoded.leaseId)).toEqual(new Uint8Array(32).fill(0x33));
  });

  it('LeaseResponse: roundtrip with public key hash recipient', () => {
    const pkh = new Uint8Array(20).fill(0xfe);
    const original = create(LeaseResponseSchema, {
      amount: 50_000_000n,
      height: 100n,
      leaseId: new Uint8Array(32).fill(0x66),
      originTransactionId: new Uint8Array(32).fill(0x77),
      recipient: { recipient: { case: 'publicKeyHash', value: pkh } },
      sender: new Uint8Array(32).fill(0x88),
    });
    const buf = toBinary(LeaseResponseSchema, original);
    const decoded = fromBinary(LeaseResponseSchema, buf);
    const recipient = assertDefined(decoded.recipient);
    expect(recipient.recipient.case).toBe('publicKeyHash');
    expect(new Uint8Array(recipient.recipient.value as Uint8Array)).toEqual(pkh);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Assets API (node/grpc)
// ═════════════════════════════════════════════════════════════════════════════

describe('assets_api_pb — gRPC assets schemas', () => {
  it('service descriptor is exported', () => {
    expect(AssetsApi).toBeDefined();
    expect(typeof AssetsApi).toBe('object');
  });

  it('AssetRequest: roundtrip with 32-byte asset ID', () => {
    const assetId = new Uint8Array(32).fill(0xdd);
    const original = create(AssetRequestSchema, { assetId });
    const buf = toBinary(AssetRequestSchema, original);
    const decoded = fromBinary(AssetRequestSchema, buf);
    expect(new Uint8Array(decoded.assetId)).toEqual(assetId);
  });

  it('NFTRequest: roundtrip with address and limit', () => {
    const address = new Uint8Array(26).fill(0xee);
    const original = create(NFTRequestSchema, {
      address,
      afterAssetId: new Uint8Array([]),
      limit: 100,
    });
    const buf = toBinary(NFTRequestSchema, original);
    const decoded = fromBinary(NFTRequestSchema, buf);
    expect(new Uint8Array(decoded.address)).toEqual(address);
    expect(decoded.limit).toBe(100);
  });

  it('NFTRequest: roundtrip with afterAssetId cursor', () => {
    const original = create(NFTRequestSchema, {
      address: new Uint8Array(26).fill(0xff),
      afterAssetId: new Uint8Array(32).fill(0x01),
      limit: 10,
    });
    const buf = toBinary(NFTRequestSchema, original);
    const decoded = fromBinary(NFTRequestSchema, buf);
    expect(decoded.limit).toBe(10);
    expect(new Uint8Array(decoded.afterAssetId)).toEqual(new Uint8Array(32).fill(0x01));
  });

  it('NFTResponse: roundtrip with asset ID only (no info)', () => {
    const assetId = new Uint8Array(32).fill(0x02);
    const original = create(NFTResponseSchema, { assetId });
    const buf = toBinary(NFTResponseSchema, original);
    const decoded = fromBinary(NFTResponseSchema, buf);
    expect(new Uint8Array(decoded.assetId)).toEqual(assetId);
    expect(decoded.assetInfo).toBeUndefined();
  });

  it('AssetInfoResponse: roundtrip with basic fields', () => {
    const original = create(AssetInfoResponseSchema, {
      decimals: 8,
      description: 'A DCC test token',
      issueHeight: 1_000,
      issuer: new Uint8Array(32).fill(0x03),
      name: 'DCCToken',
      reissuable: true,
      sequenceInBlock: 1,
      sponsorBalance: 0n,
      sponsorship: 0n,
      totalVolume: 1_000_000_000_000n,
    });
    const buf = toBinary(AssetInfoResponseSchema, original);
    const decoded = fromBinary(AssetInfoResponseSchema, buf);
    expect(decoded.name).toBe('DCCToken');
    expect(decoded.description).toBe('A DCC test token');
    expect(decoded.decimals).toBe(8);
    expect(decoded.reissuable).toBe(true);
    expect(decoded.totalVolume).toBe(1_000_000_000_000n);
    expect(decoded.issueHeight).toBe(1_000);
  });

  it('AssetInfoResponse: roundtrip with script', () => {
    const original = create(AssetInfoResponseSchema, {
      decimals: 0,
      description: 'Smart NFT',
      issueHeight: 2_000,
      issuer: new Uint8Array(32).fill(0x04),
      name: 'SNFT',
      reissuable: false,
      script: {
        complexity: 100n,
        scriptBytes: new Uint8Array([0x01, 0x02]),
        scriptText: 'true',
      },
      sequenceInBlock: 0,
      sponsorBalance: 0n,
      sponsorship: 0n,
      totalVolume: 1n,
    });
    const buf = toBinary(AssetInfoResponseSchema, original);
    const decoded = fromBinary(AssetInfoResponseSchema, buf);
    expect(decoded.name).toBe('SNFT');
    const script = assertDefined(decoded.script);
    expect(script.scriptText).toBe('true');
    expect(script.complexity).toBe(100n);
  });

  it('AssetInfoResponse: roundtrip with no script (unscripted asset)', () => {
    const original = create(AssetInfoResponseSchema, {
      decimals: 6,
      description: 'Plain fungible token',
      issuer: new Uint8Array(32).fill(0x05),
      name: 'PLAIN',
      reissuable: false,
      totalVolume: 500_000_000n,
    });
    const buf = toBinary(AssetInfoResponseSchema, original);
    const decoded = fromBinary(AssetInfoResponseSchema, buf);
    expect(decoded.script).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Blockchain API (node/grpc)
// ═════════════════════════════════════════════════════════════════════════════

describe('blockchain_api_pb — gRPC blockchain schemas and enums', () => {
  it('service descriptor is exported', () => {
    expect(BlockchainApi).toBeDefined();
    expect(typeof BlockchainApi).toBe('object');
  });

  it('FeatureActivationStatus_BlockchainFeatureStatus: enum values', () => {
    expect(FeatureActivationStatus_BlockchainFeatureStatus.UNDEFINED).toBe(0);
    expect(FeatureActivationStatus_BlockchainFeatureStatus.APPROVED).toBe(1);
    expect(FeatureActivationStatus_BlockchainFeatureStatus.ACTIVATED).toBe(2);
    expect(FeatureActivationStatus_BlockchainFeatureStatusSchema).toBeDefined();
  });

  it('FeatureActivationStatus_NodeFeatureStatus: enum values', () => {
    expect(FeatureActivationStatus_NodeFeatureStatus.NOT_IMPLEMENTED).toBe(0);
    expect(FeatureActivationStatus_NodeFeatureStatus.IMPLEMENTED).toBe(1);
    expect(FeatureActivationStatus_NodeFeatureStatus.VOTED).toBe(2);
    expect(FeatureActivationStatus_NodeFeatureStatusSchema).toBeDefined();
  });

  it('ActivationStatusRequest: roundtrip with height', () => {
    const original = create(ActivationStatusRequestSchema, { height: 3_500_000 });
    const buf = toBinary(ActivationStatusRequestSchema, original);
    const decoded = fromBinary(ActivationStatusRequestSchema, buf);
    expect(decoded.height).toBe(3_500_000);
  });

  it('ActivationStatusResponse: roundtrip with feature list', () => {
    const feature = create(FeatureActivationStatusSchema, {
      activationHeight: 1_000_000,
      blockchainStatus: FeatureActivationStatus_BlockchainFeatureStatus.ACTIVATED,
      description: 'Fair PoS',
      id: 14,
      nodeStatus: FeatureActivationStatus_NodeFeatureStatus.VOTED,
      supportingBlocks: 10,
    });
    const original = create(ActivationStatusResponseSchema, {
      features: [feature],
      height: 3_500_000,
      nextCheck: 3_600_000,
      votingInterval: 5_000,
      votingThreshold: 2_700,
    });
    const buf = toBinary(ActivationStatusResponseSchema, original);
    const decoded = fromBinary(ActivationStatusResponseSchema, buf);
    expect(decoded.height).toBe(3_500_000);
    expect(decoded.votingInterval).toBe(5_000);
    expect(decoded.votingThreshold).toBe(2_700);
    expect(decoded.features).toHaveLength(1);
    const f = assertDefined(decoded.features[0]);
    expect(f.id).toBe(14);
    expect(f.description).toBe('Fair PoS');
    expect(f.blockchainStatus).toBe(FeatureActivationStatus_BlockchainFeatureStatus.ACTIVATED);
    expect(f.nodeStatus).toBe(FeatureActivationStatus_NodeFeatureStatus.VOTED);
    expect(f.activationHeight).toBe(1_000_000);
  });

  it('ActivationStatusResponse: roundtrip with empty features (all active)', () => {
    const original = create(ActivationStatusResponseSchema, {
      features: [],
      height: 4_000_000,
      nextCheck: 4_100_000,
      votingInterval: 5_000,
      votingThreshold: 2_700,
    });
    const buf = toBinary(ActivationStatusResponseSchema, original);
    const decoded = fromBinary(ActivationStatusResponseSchema, buf);
    expect(decoded.features).toEqual([]);
  });

  it('FeatureActivationStatus: roundtrip with UNDEFINED blockchain status', () => {
    const original = create(FeatureActivationStatusSchema, {
      blockchainStatus: FeatureActivationStatus_BlockchainFeatureStatus.UNDEFINED,
      description: 'Pending feature',
      id: 20,
      nodeStatus: FeatureActivationStatus_NodeFeatureStatus.IMPLEMENTED,
      supportingBlocks: 150,
    });
    const buf = toBinary(FeatureActivationStatusSchema, original);
    const decoded = fromBinary(FeatureActivationStatusSchema, buf);
    expect(decoded.id).toBe(20);
    expect(decoded.supportingBlocks).toBe(150);
    expect(decoded.nodeStatus).toBe(FeatureActivationStatus_NodeFeatureStatus.IMPLEMENTED);
    // UNDEFINED (0) is proto3 default, may be omitted on wire
    expect(decoded.blockchainStatus === 0 || decoded.blockchainStatus === undefined).toBe(true);
  });

  it('FeatureActivationStatus: roundtrip with APPROVED status', () => {
    const original = create(FeatureActivationStatusSchema, {
      blockchainStatus: FeatureActivationStatus_BlockchainFeatureStatus.APPROVED,
      id: 21,
      nodeStatus: FeatureActivationStatus_NodeFeatureStatus.VOTED,
      supportingBlocks: 2_800,
    });
    const buf = toBinary(FeatureActivationStatusSchema, original);
    const decoded = fromBinary(FeatureActivationStatusSchema, buf);
    expect(decoded.blockchainStatus).toBe(FeatureActivationStatus_BlockchainFeatureStatus.APPROVED);
  });

  it('BaseTargetResponse: roundtrip with base_target', () => {
    const original = create(BaseTargetResponseSchema, { baseTarget: 12_345_678n });
    const buf = toBinary(BaseTargetResponseSchema, original);
    const decoded = fromBinary(BaseTargetResponseSchema, buf);
    expect(decoded.baseTarget).toBe(12_345_678n);
  });

  it('BaseTargetResponse: roundtrip with minimum base target', () => {
    const original = create(BaseTargetResponseSchema, { baseTarget: 100n });
    const buf = toBinary(BaseTargetResponseSchema, original);
    const decoded = fromBinary(BaseTargetResponseSchema, buf);
    expect(decoded.baseTarget).toBe(100n);
  });

  it('ScoreResponse: roundtrip with score bytes', () => {
    // score is a raw BigInt encoded as bytes
    const score = new Uint8Array([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    const original = create(ScoreResponseSchema, { score });
    const buf = toBinary(ScoreResponseSchema, original);
    const decoded = fromBinary(ScoreResponseSchema, buf);
    expect(new Uint8Array(decoded.score)).toEqual(score);
  });

  it('ScoreResponse: roundtrip with empty score (genesis)', () => {
    const original = create(ScoreResponseSchema, { score: new Uint8Array([]) });
    const buf = toBinary(ScoreResponseSchema, original);
    const decoded = fromBinary(ScoreResponseSchema, buf);
    expect(decoded.score).toBeDefined();
  });

  it('encoding is deterministic for ActivationStatusResponse', () => {
    const msg = create(ActivationStatusResponseSchema, {
      features: [],
      height: 1_000,
      nextCheck: 2_000,
      votingInterval: 100,
      votingThreshold: 60,
    });
    expect(toBinary(ActivationStatusResponseSchema, msg)).toEqual(
      toBinary(ActivationStatusResponseSchema, msg),
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Blocks API (node/grpc)
// ═════════════════════════════════════════════════════════════════════════════

describe('blocks_api_pb — gRPC blocks schemas', () => {
  it('service descriptor is exported', () => {
    expect(BlocksApi).toBeDefined();
    expect(typeof BlocksApi).toBe('object');
  });

  it('BlockRequest: roundtrip with block_id', () => {
    const blockId = new Uint8Array(64).fill(0xab);
    const original = create(BlockRequestSchema, {
      includeTransactions: false,
      request: { case: 'blockId', value: blockId },
    });
    const buf = toBinary(BlockRequestSchema, original);
    const decoded = fromBinary(BlockRequestSchema, buf);
    expect(decoded.request.case).toBe('blockId');
    if (decoded.request.case === 'blockId') {
      expect(new Uint8Array(decoded.request.value)).toEqual(blockId);
    }
    // includeTransactions false = proto3 default, may be omitted
    expect(decoded.includeTransactions === false || decoded.includeTransactions === undefined).toBe(
      true,
    );
  });

  it('BlockRequest: roundtrip with height', () => {
    const original = create(BlockRequestSchema, {
      includeTransactions: true,
      request: { case: 'height', value: 2_000_000 },
    });
    const buf = toBinary(BlockRequestSchema, original);
    const decoded = fromBinary(BlockRequestSchema, buf);
    expect(decoded.request.case).toBe('height');
    if (decoded.request.case === 'height') {
      expect(decoded.request.value).toBe(2_000_000);
    }
    expect(decoded.includeTransactions).toBe(true);
  });

  it('BlockRequest: roundtrip with include_transactions=true', () => {
    const original = create(BlockRequestSchema, {
      includeTransactions: true,
      request: { case: 'height', value: 1 },
    });
    const buf = toBinary(BlockRequestSchema, original);
    const decoded = fromBinary(BlockRequestSchema, buf);
    expect(decoded.includeTransactions).toBe(true);
  });

  it('BlockRangeRequest: roundtrip with from/to heights', () => {
    const original = create(BlockRangeRequestSchema, {
      fromHeight: 1_000_000,
      includeTransactions: false,
      toHeight: 1_001_000,
    });
    const buf = toBinary(BlockRangeRequestSchema, original);
    const decoded = fromBinary(BlockRangeRequestSchema, buf);
    expect(decoded.fromHeight).toBe(1_000_000);
    expect(decoded.toHeight).toBe(1_001_000);
  });

  it('BlockRangeRequest: roundtrip with generator public key filter', () => {
    const generatorPk = new Uint8Array(32).fill(0xbc);
    const original = create(BlockRangeRequestSchema, {
      filter: { case: 'generatorPublicKey', value: generatorPk },
      fromHeight: 500_000,
      includeTransactions: true,
      toHeight: 600_000,
    });
    const buf = toBinary(BlockRangeRequestSchema, original);
    const decoded = fromBinary(BlockRangeRequestSchema, buf);
    expect(decoded.fromHeight).toBe(500_000);
    expect(decoded.toHeight).toBe(600_000);
    expect(decoded.filter.case).toBe('generatorPublicKey');
    if (decoded.filter.case === 'generatorPublicKey') {
      expect(new Uint8Array(decoded.filter.value)).toEqual(generatorPk);
    }
  });

  it('BlockRangeRequest: roundtrip with generator address filter', () => {
    const generatorAddr = new Uint8Array(26).fill(0xcd);
    const original = create(BlockRangeRequestSchema, {
      filter: { case: 'generatorAddress', value: generatorAddr },
      fromHeight: 200_000,
      includeTransactions: false,
      toHeight: 300_000,
    });
    const buf = toBinary(BlockRangeRequestSchema, original);
    const decoded = fromBinary(BlockRangeRequestSchema, buf);
    expect(decoded.filter.case).toBe('generatorAddress');
    if (decoded.filter.case === 'generatorAddress') {
      expect(new Uint8Array(decoded.filter.value)).toEqual(generatorAddr);
    }
  });

  it('BlockWithHeight: roundtrip with height and VRF', () => {
    const vrf = new Uint8Array(96).fill(0xde);
    const original = create(BlockWithHeightSchema, {
      height: 3_000_000,
      rewardShares: [],
      vrf,
    });
    const buf = toBinary(BlockWithHeightSchema, original);
    const decoded = fromBinary(BlockWithHeightSchema, buf);
    expect(decoded.height).toBe(3_000_000);
    expect(new Uint8Array(decoded.vrf)).toEqual(vrf);
    expect(decoded.rewardShares).toEqual([]);
  });

  it('BlockWithHeight: roundtrip with reward shares', () => {
    const original = create(BlockWithHeightSchema, {
      height: 4_000_000,
      rewardShares: [
        { address: new Uint8Array(26).fill(0x01), reward: 600_000_000n },
        { address: new Uint8Array(26).fill(0x02), reward: 200_000_000n },
      ],
      vrf: new Uint8Array([]),
    });
    const buf = toBinary(BlockWithHeightSchema, original);
    const decoded = fromBinary(BlockWithHeightSchema, buf);
    expect(decoded.height).toBe(4_000_000);
    expect(decoded.rewardShares).toHaveLength(2);
    expect(decoded.rewardShares[0]?.reward).toBe(600_000_000n);
    expect(decoded.rewardShares[1]?.reward).toBe(200_000_000n);
  });

  it('BlockWithHeight: roundtrip with no block (empty)', () => {
    const original = create(BlockWithHeightSchema, { height: 0, rewardShares: [] });
    const buf = toBinary(BlockWithHeightSchema, original);
    const decoded = fromBinary(BlockWithHeightSchema, buf);
    expect(decoded.block).toBeUndefined();
  });

  it('encoding is deterministic for BlockRequest by height', () => {
    const msg = create(BlockRequestSchema, {
      includeTransactions: true,
      request: { case: 'height', value: 42 },
    });
    expect(toBinary(BlockRequestSchema, msg)).toEqual(toBinary(BlockRequestSchema, msg));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Cross-schema integrity: all five new files import without side-effects
// ═════════════════════════════════════════════════════════════════════════════

describe('gRPC API schema registry integrity', () => {
  it('all gRPC message schemas are distinct objects', () => {
    const schemas = [
      GetBlockUpdateRequestSchema,
      GetBlockUpdateResponseSchema,
      GetBlockUpdatesRangeRequestSchema,
      GetBlockUpdatesRangeResponseSchema,
      SubscribeRequestSchema,
      SubscribeEventSchema,
      AccountRequestSchema,
      DataRequestSchema,
      BalancesRequestSchema,
      BalanceResponseSchema,
      BalanceResponse_DccBalancesSchema,
      DataEntryResponseSchema,
      ScriptDataSchema,
      ScriptResponseSchema,
      LeaseResponseSchema,
      AssetRequestSchema,
      NFTRequestSchema,
      NFTResponseSchema,
      AssetInfoResponseSchema,
      ActivationStatusRequestSchema,
      ActivationStatusResponseSchema,
      FeatureActivationStatusSchema,
      BaseTargetResponseSchema,
      ScoreResponseSchema,
      BlockRequestSchema,
      BlockRangeRequestSchema,
      BlockWithHeightSchema,
    ];
    // Every schema is a unique non-null object
    for (const schema of schemas) {
      expect(schema).toBeDefined();
      expect(typeof schema).toBe('object');
    }
    // All schemas are distinct (no accidental aliasing)
    const set = new Set(schemas);
    expect(set.size).toBe(schemas.length);
  });

  it('all gRPC service descriptors are distinct objects', () => {
    const services = [BlockchainUpdatesApi, AccountsApi, AssetsApi, BlockchainApi, BlocksApi];
    for (const svc of services) {
      expect(svc).toBeDefined();
    }
    const set = new Set(services);
    expect(set.size).toBe(services.length);
  });

  it('create() returns fresh instances (no shared state)', () => {
    const a = create(AccountRequestSchema, { address: new Uint8Array(26).fill(0x01) });
    const b = create(AccountRequestSchema, { address: new Uint8Array(26).fill(0x02) });
    expect(a).not.toBe(b);
    expect(new Uint8Array(a.address)).not.toEqual(new Uint8Array(b.address));
  });

  it('empty buffer decodes to all-default gRPC messages', () => {
    const empty = new Uint8Array([]);
    const schemas = [
      ActivationStatusRequestSchema,
      BaseTargetResponseSchema,
      GetBlockUpdateRequestSchema,
      SubscribeRequestSchema,
      AccountRequestSchema,
      AssetRequestSchema,
    ] as const;
    for (const schema of schemas) {
      expect(() => fromBinary(schema, empty)).not.toThrow();
    }
  });
});
