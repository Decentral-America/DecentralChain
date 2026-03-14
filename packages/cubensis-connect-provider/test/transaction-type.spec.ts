import { describe, expect, it } from 'vitest';
import {
  TRANSACTION_TYPE,
  type TransactionMap,
  type TransactionType,
} from '../src/transaction-type';

describe('transaction-type', () => {
  it('exports all expected transaction types', () => {
    expect(TRANSACTION_TYPE.GENESIS).toBe(1);
    expect(TRANSACTION_TYPE.PAYMENT).toBe(2);
    expect(TRANSACTION_TYPE.ISSUE).toBe(3);
    expect(TRANSACTION_TYPE.TRANSFER).toBe(4);
    expect(TRANSACTION_TYPE.REISSUE).toBe(5);
    expect(TRANSACTION_TYPE.BURN).toBe(6);
    expect(TRANSACTION_TYPE.EXCHANGE).toBe(7);
    expect(TRANSACTION_TYPE.LEASE).toBe(8);
    expect(TRANSACTION_TYPE.CANCEL_LEASE).toBe(9);
    expect(TRANSACTION_TYPE.ALIAS).toBe(10);
    expect(TRANSACTION_TYPE.MASS_TRANSFER).toBe(11);
    expect(TRANSACTION_TYPE.DATA).toBe(12);
    expect(TRANSACTION_TYPE.SET_SCRIPT).toBe(13);
    expect(TRANSACTION_TYPE.SPONSORSHIP).toBe(14);
    expect(TRANSACTION_TYPE.SET_ASSET_SCRIPT).toBe(15);
    expect(TRANSACTION_TYPE.INVOKE_SCRIPT).toBe(16);
    expect(TRANSACTION_TYPE.UPDATE_ASSET_INFO).toBe(17);
  });

  it('values are frozen and immutable', () => {
    expect(() => {
      // @ts-expect-error testing immutability
      TRANSACTION_TYPE.ISSUE = 999;
    }).toThrow();
  });

  it('satisfies TransactionType type constraint', () => {
    const txType: TransactionType = TRANSACTION_TYPE.TRANSFER;
    expect(txType).toBe(4);
  });

  it('TransactionMap type maps correctly', () => {
    // Compile-time check: ensure the type exists and is usable
    const _check: keyof TransactionMap = 3;
    expect(_check).toBe(3);
  });
});
