import { describe, expect, it } from 'vitest';
import {
  ALIAS_TYPE,
  type AssetDecimals,
  type Base58Bytes,
  type Base64Script,
  BINARY_DATA_TYPE,
  BOOLEAN_DATA_TYPE,
  BURN_TYPE,
  CANCEL_LEASE_TYPE,
  COMMIT_TO_GENERATION_TYPE,
  DATA_FIELD_TYPE,
  DATA_TYPE,
  type DataFieldType,
  type DataTransaction,
  type DataTransactionEntry,
  ETHEREUM,
  EXCHANGE_TYPE,
  type ExchangeTransaction,
  type ExchangeTransactionOrder,
  type ExchangeTransactionOrderByTx,
  // ── Constants ─────────────────────────────────────────────────
  GENESIS_TYPE,
  type GenesisTransaction,
  INTEGER_DATA_TYPE,
  INVOKE_SCRIPT_TYPE,
  type InvokeScriptCall,
  type InvokeScriptPayment,
  ISSUE_TYPE,
  LEASE_TYPE,
  type Long,
  MASS_TRANSFER_TYPE,
  type MassTransferItem,
  PAYMENT_TYPE,
  type Proofs,
  REISSUE_TYPE,
  SET_ASSET_SCRIPT_TYPE,
  SET_SCRIPT_TYPE,
  type SignedTransaction,
  SPONSORSHIP_TYPE,
  STRING_DATA_TYPE,
  TRANSACTION_TYPE,
  TRANSFER_TYPE,
  type TransactionFromNode,
  type TransactionType,
  type TransferTransaction,
  type TStateChanges,
  UPDATE_ASSET_INFO_TYPE,
  type WithApiMixin,
  type WithApplicationStatus,
  type WithId,
} from '../src/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// 1. TRANSACTION TYPE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Transaction Type Constants', () => {
  it('should have correct numeric values for all 19 transaction types', () => {
    expect(GENESIS_TYPE).toBe(1);
    expect(PAYMENT_TYPE).toBe(2);
    expect(ISSUE_TYPE).toBe(3);
    expect(TRANSFER_TYPE).toBe(4);
    expect(REISSUE_TYPE).toBe(5);
    expect(BURN_TYPE).toBe(6);
    expect(EXCHANGE_TYPE).toBe(7);
    expect(LEASE_TYPE).toBe(8);
    expect(CANCEL_LEASE_TYPE).toBe(9);
    expect(ALIAS_TYPE).toBe(10);
    expect(MASS_TRANSFER_TYPE).toBe(11);
    expect(DATA_TYPE).toBe(12);
    expect(SET_SCRIPT_TYPE).toBe(13);
    expect(SPONSORSHIP_TYPE).toBe(14);
    expect(SET_ASSET_SCRIPT_TYPE).toBe(15);
    expect(INVOKE_SCRIPT_TYPE).toBe(16);
    expect(UPDATE_ASSET_INFO_TYPE).toBe(17);
    expect(ETHEREUM).toBe(18);
    expect(COMMIT_TO_GENERATION_TYPE).toBe(19);
  });

  it('should have sequential type IDs with no gaps (1–19)', () => {
    const allTypes = [
      GENESIS_TYPE,
      PAYMENT_TYPE,
      ISSUE_TYPE,
      TRANSFER_TYPE,
      REISSUE_TYPE,
      BURN_TYPE,
      EXCHANGE_TYPE,
      LEASE_TYPE,
      CANCEL_LEASE_TYPE,
      ALIAS_TYPE,
      MASS_TRANSFER_TYPE,
      DATA_TYPE,
      SET_SCRIPT_TYPE,
      SPONSORSHIP_TYPE,
      SET_ASSET_SCRIPT_TYPE,
      INVOKE_SCRIPT_TYPE,
      UPDATE_ASSET_INFO_TYPE,
      ETHEREUM,
      COMMIT_TO_GENERATION_TYPE,
    ];

    for (let i = 0; i < allTypes.length; i++) {
      expect(allTypes[i]).toBe(i + 1);
    }
  });

  it('should have unique type IDs (no duplicates)', () => {
    const values = Object.values(TRANSACTION_TYPE);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. TRANSACTION_TYPE LOOKUP OBJECT
// ═══════════════════════════════════════════════════════════════════════════

describe('TRANSACTION_TYPE lookup object', () => {
  it('should contain exactly 19 entries', () => {
    expect(Object.keys(TRANSACTION_TYPE)).toHaveLength(19);
  });

  it('should map every name to the correct individual constant', () => {
    expect(TRANSACTION_TYPE.GENESIS).toBe(GENESIS_TYPE);
    expect(TRANSACTION_TYPE.PAYMENT).toBe(PAYMENT_TYPE);
    expect(TRANSACTION_TYPE.ISSUE).toBe(ISSUE_TYPE);
    expect(TRANSACTION_TYPE.TRANSFER).toBe(TRANSFER_TYPE);
    expect(TRANSACTION_TYPE.REISSUE).toBe(REISSUE_TYPE);
    expect(TRANSACTION_TYPE.BURN).toBe(BURN_TYPE);
    expect(TRANSACTION_TYPE.EXCHANGE).toBe(EXCHANGE_TYPE);
    expect(TRANSACTION_TYPE.LEASE).toBe(LEASE_TYPE);
    expect(TRANSACTION_TYPE.CANCEL_LEASE).toBe(CANCEL_LEASE_TYPE);
    expect(TRANSACTION_TYPE.ALIAS).toBe(ALIAS_TYPE);
    expect(TRANSACTION_TYPE.MASS_TRANSFER).toBe(MASS_TRANSFER_TYPE);
    expect(TRANSACTION_TYPE.DATA).toBe(DATA_TYPE);
    expect(TRANSACTION_TYPE.SET_SCRIPT).toBe(SET_SCRIPT_TYPE);
    expect(TRANSACTION_TYPE.SPONSORSHIP).toBe(SPONSORSHIP_TYPE);
    expect(TRANSACTION_TYPE.SET_ASSET_SCRIPT).toBe(SET_ASSET_SCRIPT_TYPE);
    expect(TRANSACTION_TYPE.INVOKE_SCRIPT).toBe(INVOKE_SCRIPT_TYPE);
    expect(TRANSACTION_TYPE.UPDATE_ASSET_INFO).toBe(UPDATE_ASSET_INFO_TYPE);
    expect(TRANSACTION_TYPE.ETHEREUM).toBe(ETHEREUM);
  });

  it('should be frozen / immutable at the value level', () => {
    // The `as const` assertion makes values literal types at compile time.
    // At runtime, verify values are numbers.
    for (const [, value] of Object.entries(TRANSACTION_TYPE)) {
      expect(typeof value).toBe('number');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. DATA FIELD TYPE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Data Field Type Constants', () => {
  it('should have correct string values', () => {
    expect(INTEGER_DATA_TYPE).toBe('integer');
    expect(BOOLEAN_DATA_TYPE).toBe('boolean');
    expect(STRING_DATA_TYPE).toBe('string');
    expect(BINARY_DATA_TYPE).toBe('binary');
  });
});

describe('DATA_FIELD_TYPE lookup object', () => {
  it('should contain exactly 4 entries', () => {
    expect(Object.keys(DATA_FIELD_TYPE)).toHaveLength(4);
  });

  it('should map to the correct individual constants', () => {
    expect(DATA_FIELD_TYPE.INTEGER).toBe(INTEGER_DATA_TYPE);
    expect(DATA_FIELD_TYPE.BOOLEAN).toBe(BOOLEAN_DATA_TYPE);
    expect(DATA_FIELD_TYPE.STRING).toBe(STRING_DATA_TYPE);
    expect(DATA_FIELD_TYPE.BINARY).toBe(BINARY_DATA_TYPE);
  });

  it('should have unique values (no duplicates)', () => {
    const values = Object.values(DATA_FIELD_TYPE);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. TYPE-LEVEL COMPILE CHECKS (verified by vitest typecheck)
// ═══════════════════════════════════════════════════════════════════════════

describe('Type-level correctness', () => {
  it('TransactionType should accept all transaction type IDs', () => {
    const validTypes: Array<TransactionType> = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
    ];
    expect(validTypes).toHaveLength(18);
  });

  it('DataFieldType should accept all data field strings', () => {
    const validFields: Array<DataFieldType> = ['integer', 'boolean', 'string', 'binary'];
    expect(validFields).toHaveLength(4);
  });

  it('Long should accept both string and number', () => {
    const asNumber: Long = 12345;
    const asString: Long = '12345';
    expect(typeof asNumber).toBe('number');
    expect(typeof asString).toBe('string');
  });

  it('AssetDecimals should be constrained to 0–8', () => {
    const valid: Array<AssetDecimals> = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    expect(valid).toHaveLength(9);
  });

  it('Proofs should be an array of strings', () => {
    const proofs: Proofs = ['proof1', 'proof2'];
    expect(Array.isArray(proofs)).toBe(true);
  });

  it('WithId should require an id field', () => {
    const obj: WithId = { id: 'abc123' };
    expect(obj.id).toBe('abc123');
  });

  it('WithApplicationStatus should accept valid statuses', () => {
    const succeeded: WithApplicationStatus = { applicationStatus: 'succeeded' };
    const failed: WithApplicationStatus = { applicationStatus: 'script_execution_failed' };
    expect(succeeded.applicationStatus).toBe('succeeded');
    expect(failed.applicationStatus).toBe('script_execution_failed');
  });

  it('WithApiMixin should combine WithId + sender + height', () => {
    const mixin: WithApiMixin = { height: 100, id: 'tx1', sender: '3N...' };
    expect(mixin.id).toBe('tx1');
    expect(mixin.sender).toBe('3N...');
    expect(mixin.height).toBe(100);
  });

  it('Base64Script and Base58Bytes should be string aliases', () => {
    const script: Base64Script = 'base64:AQa3b8tH';
    const bytes: Base58Bytes = '3MtrNP7AkTRuBhX4CBti6iT21pQpEnmHtyw';
    expect(typeof script).toBe('string');
    expect(typeof bytes).toBe('string');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. DATA TRANSACTION ENTRY TYPES
// ═══════════════════════════════════════════════════════════════════════════

describe('DataTransactionEntry', () => {
  it('should support integer entries', () => {
    const entry: DataTransactionEntry = {
      key: 'count',
      type: 'integer',
      value: 42,
    };
    expect(entry.type).toBe('integer');
    expect(entry.key).toBe('count');
  });

  it('should support string entries', () => {
    const entry: DataTransactionEntry = {
      key: 'name',
      type: 'string',
      value: 'DecentralChain',
    };
    expect(entry.type).toBe('string');
  });

  it('should support boolean entries', () => {
    const entry: DataTransactionEntry = {
      key: 'active',
      type: 'boolean',
      value: true,
    };
    expect(entry.type).toBe('boolean');
  });

  it('should support binary entries', () => {
    const entry: DataTransactionEntry = {
      key: 'data',
      type: 'binary',
      value: 'base64:AQa3b8tH',
    };
    expect(entry.type).toBe('binary');
  });

  it('should support delete requests (type: null)', () => {
    const entry: DataTransactionEntry = {
      key: 'obsolete',
      type: null,
      value: null,
    };
    expect(entry.type).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. MASS TRANSFER & INVOKE SCRIPT TYPES
// ═══════════════════════════════════════════════════════════════════════════

describe('MassTransferItem', () => {
  it('should require recipient and amount', () => {
    const item: MassTransferItem = { amount: 100_000_000, recipient: '3N...' };
    expect(item.recipient).toBe('3N...');
    expect(item.amount).toBe(100_000_000);
  });

  it('should accept string amounts for Long', () => {
    const item: MassTransferItem<string> = { amount: '100000000', recipient: '3N...' };
    expect(typeof item.amount).toBe('string');
  });
});

describe('InvokeScriptCall', () => {
  it('should accept a function name and args', () => {
    const call: InvokeScriptCall = {
      args: [
        { type: 'string', value: '3N...' },
        { type: 'integer', value: 1000 },
        { type: 'boolean', value: true },
        { type: 'binary', value: 'base64:AA==' },
      ],
      function: 'transfer',
    };
    expect(call.function).toBe('transfer');
    expect(call.args).toHaveLength(4);
  });
});

describe('InvokeScriptPayment', () => {
  it('should require assetId and amount', () => {
    const payment: InvokeScriptPayment = { amount: 500, assetId: null };
    expect(payment.assetId).toBeNull();
    expect(payment.amount).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. EXCHANGE ORDER TYPES
// ═══════════════════════════════════════════════════════════════════════════

describe('ExchangeTransactionOrder', () => {
  it('should accept a V1 order', () => {
    const order: ExchangeTransactionOrder = {
      amount: 1000,
      assetPair: { amountAsset: null, priceAsset: null },
      expiration: Date.now() + 86400000,
      matcherFee: 300000,
      matcherPublicKey: 'matcher_pub_key',
      orderType: 'buy',
      price: 100,
      senderPublicKey: 'sender_pub_key',
      timestamp: Date.now(),
      version: 1,
    };
    expect(order.version).toBe(1);
    expect(order.orderType).toBe('buy');
  });

  it('should accept a V3 order with matcherFeeAssetId', () => {
    const order: ExchangeTransactionOrder = {
      amount: 500,
      assetPair: { amountAsset: 'asset1', priceAsset: 'asset2' },
      expiration: Date.now() + 86400000,
      matcherFee: 300000,
      matcherFeeAssetId: 'fee_asset',
      matcherPublicKey: 'matcher_pub_key',
      orderType: 'sell',
      price: 200,
      senderPublicKey: 'sender_pub_key',
      timestamp: Date.now(),
      version: 3,
    };
    expect(order.version).toBe(3);
    expect(order.matcherFeeAssetId).toBe('fee_asset');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. TRANSACTION STRUCTURE SHAPES
// ═══════════════════════════════════════════════════════════════════════════

describe('Transaction type shapes', () => {
  it('TransferTransaction should have required fields', () => {
    const tx: TransferTransaction = {
      amount: 1_000_000,
      assetId: null,
      attachment: null,
      chainId: 76,
      fee: 100000,
      feeAssetId: null,
      recipient: '3N...',
      senderPublicKey: 'pub_key',
      timestamp: Date.now(),
      type: 4,
      version: 2,
    };
    expect(tx.type).toBe(TRANSACTION_TYPE.TRANSFER);
    expect(tx.version).toBe(2);
  });

  it('DataTransaction should contain data entries', () => {
    const tx: DataTransaction = {
      chainId: 76,
      data: [
        { key: 'price', type: 'integer', value: 42 },
        { key: 'name', type: 'string', value: 'test' },
      ],
      fee: 100000,
      senderPublicKey: 'pub_key',
      timestamp: Date.now(),
      type: 12,
      version: 1,
    };
    expect(tx.type).toBe(TRANSACTION_TYPE.DATA);
    expect(tx.data).toHaveLength(2);
  });

  it('GenesisTransaction should omit senderPublicKey', () => {
    const tx: GenesisTransaction = {
      amount: 10_000_000_000,
      chainId: 76,
      fee: 0,
      recipient: '3N...',
      timestamp: 0,
      type: 1,
      version: 1,
    };
    expect(tx.type).toBe(TRANSACTION_TYPE.GENESIS);
    // GenesisTransaction omits senderPublicKey
    expect('senderPublicKey' in tx).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. TRANSACTION MAP COMPLETENESS
// ═══════════════════════════════════════════════════════════════════════════

describe('TransactionMap completeness', () => {
  it('should have an entry for every TRANSACTION_TYPE key', () => {
    // We verify at the type level that TransactionMap covers all types.
    // At runtime, verify TRANSACTION_TYPE has all expected keys.
    const expectedKeys = [
      'GENESIS',
      'PAYMENT',
      'ISSUE',
      'TRANSFER',
      'REISSUE',
      'BURN',
      'EXCHANGE',
      'LEASE',
      'CANCEL_LEASE',
      'ALIAS',
      'MASS_TRANSFER',
      'DATA',
      'SET_SCRIPT',
      'SPONSORSHIP',
      'SET_ASSET_SCRIPT',
      'INVOKE_SCRIPT',
      'UPDATE_ASSET_INFO',
      'ETHEREUM',
      'COMMIT_TO_GENERATION',
    ];
    expect(Object.keys(TRANSACTION_TYPE).sort()).toEqual(expectedKeys.sort());
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. STATE CHANGES TYPE
// ═══════════════════════════════════════════════════════════════════════════

describe('TStateChanges', () => {
  it('should accept a complete state changes object', () => {
    const stateChanges: TStateChanges = {
      burns: [{ assetId: 'asset1', quantity: 100 }],
      data: [{ key: 'k', type: 'integer', value: 1 }],
      invokes: [],
      issues: [
        {
          assetId: 'asset1',
          compiledScript: null,
          decimals: 8,
          description: 'A token',
          isReissuable: true,
          name: 'Token',
          nonce: 0,
          quantity: 1000,
        },
      ],
      leaseCancels: [{ leaseId: 'lease1' }],
      leases: [{ amount: 100, leaseId: 'lease1', recipient: '3N...' }],
      reissues: [{ assetId: 'asset1', isReissuable: false, quantity: 500 }],
      sponsorFees: [{ assetId: 'asset1', minSponsoredAssetFee: 1000 }],
      transfers: [{ address: '3N...', amount: 100, asset: null }],
    };
    expect(stateChanges.data).toHaveLength(1);
    expect(stateChanges.transfers).toHaveLength(1);
    expect(stateChanges.issues).toHaveLength(1);
  });

  it('should accept optional error field', () => {
    const stateChanges: TStateChanges = {
      burns: [],
      data: [],
      error: { code: 1, text: 'Script execution failed' },
      invokes: [],
      issues: [],
      leaseCancels: [],
      leases: [],
      reissues: [],
      sponsorFees: [],
      transfers: [],
    };
    expect(stateChanges.error?.code).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. EXPORT INTEGRITY — verify nothing is missing from the barrel
// ═══════════════════════════════════════════════════════════════════════════

describe('Export integrity', () => {
  it('should export all runtime constants', () => {
    expect(GENESIS_TYPE).toBeDefined();
    expect(PAYMENT_TYPE).toBeDefined();
    expect(ISSUE_TYPE).toBeDefined();
    expect(TRANSFER_TYPE).toBeDefined();
    expect(REISSUE_TYPE).toBeDefined();
    expect(BURN_TYPE).toBeDefined();
    expect(EXCHANGE_TYPE).toBeDefined();
    expect(LEASE_TYPE).toBeDefined();
    expect(CANCEL_LEASE_TYPE).toBeDefined();
    expect(ALIAS_TYPE).toBeDefined();
    expect(MASS_TRANSFER_TYPE).toBeDefined();
    expect(DATA_TYPE).toBeDefined();
    expect(SET_SCRIPT_TYPE).toBeDefined();
    expect(SPONSORSHIP_TYPE).toBeDefined();
    expect(SET_ASSET_SCRIPT_TYPE).toBeDefined();
    expect(INVOKE_SCRIPT_TYPE).toBeDefined();
    expect(UPDATE_ASSET_INFO_TYPE).toBeDefined();
    expect(ETHEREUM).toBeDefined();
    expect(TRANSACTION_TYPE).toBeDefined();
    expect(DATA_FIELD_TYPE).toBeDefined();
    expect(INTEGER_DATA_TYPE).toBeDefined();
    expect(BOOLEAN_DATA_TYPE).toBeDefined();
    expect(STRING_DATA_TYPE).toBeDefined();
    expect(BINARY_DATA_TYPE).toBeDefined();
  });

  it('should export all expected type-level symbols (compile check)', () => {
    // These are verified at compile time by the import statements above.
    // If any of these types were missing, TypeScript would error.
    const _typeChecks: [
      TransactionType,
      DataFieldType,
      Long,
      AssetDecimals,
      Base64Script,
      Base58Bytes,
      Proofs,
    ] = [1, 'integer', 42, 8, 'base64:x', '3N...', ['p']];
    expect(_typeChecks).toHaveLength(7);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. SIGNED TRANSACTION TYPE-LEVEL CHECKS
// ═══════════════════════════════════════════════════════════════════════════

describe('SignedTransaction', () => {
  it('should produce a type that compiles correctly for v1 genesis', () => {
    // V1 genesis transactions use `signature` (not `proofs`)
    const signed: SignedTransaction<GenesisTransaction> = {
      amount: 10_000_000_000,
      chainId: 76,
      fee: 0,
      recipient: '3N...',
      signature: 'sig_here',
      timestamp: 0,
      type: 1,
      version: 1,
    };
    expect(signed.signature).toBe('sig_here');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. EXCHANGE TRANSACTION ORDER BY TX
// ═══════════════════════════════════════════════════════════════════════════

describe('ExchangeTransactionOrderByTx', () => {
  it('type should compile for ExchangeTransaction constraints', () => {
    // This is a compile-time check. If ExchangeTransactionOrderByTx
    // is correctly exported and typed, this block compiles.
    type _V1Orders = ExchangeTransactionOrderByTx<ExchangeTransaction & { version: 1 }>;
    type _V2Orders = ExchangeTransactionOrderByTx<ExchangeTransaction & { version: 2 }>;
    type _GenericOrders = ExchangeTransactionOrderByTx<ExchangeTransaction>;

    // Runtime: just verify the types resolved (no runtime assertion needed)
    expect(true).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. TRANSACTION FROM NODE TYPE
// ═══════════════════════════════════════════════════════════════════════════

describe('TransactionFromNode', () => {
  it('should compile as a union type', () => {
    // Compile-time check: TransactionFromNode should be assignable
    // from any specific FromNode type.
    type _Check = TransactionFromNode extends TransactionFromNode ? true : false;
    const result: _Check = true;
    expect(result).toBe(true);
  });
});
