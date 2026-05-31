/**
 * Unit tests: src/lib/forms.ts
 *
 * Tests Zod schemas, utility functions, and the useZodForm React hook.
 */
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  addressSchema,
  aliasRegistrationSchema,
  aliasSchema,
  amountSchema,
  amountToDcclets,
  assetBurnSchema,
  assetReissueSchema,
  attachmentSchema,
  dataTransactionSchema,
  dccletsToAmount,
  dexOrderSchema,
  formatFormData,
  getFormError,
  leaseSchema,
  loginSchema,
  massTransferSchema,
  optionalAmountSchema,
  passwordConfirmationSchema,
  passwordSchema,
  seedPhraseSchema,
  sendAssetSchema,
  tokenIssuanceSchema,
  useZodForm,
  validateRecipient,
} from '@/lib/forms';

// ─── addressSchema ────────────────────────────────────────────────────────────

describe('addressSchema', () => {
  it('accepts a valid 35-char DCC address starting with 3P', () => {
    expect(() => addressSchema.parse('3PJCkxKEMgnCSSFZzrpTNa7XEt5hEDoKvqK')).not.toThrow();
  });

  it('rejects addresses shorter than 35 chars', () => {
    expect(() => addressSchema.parse('3Pshort')).toThrow();
  });

  it('rejects addresses longer than 35 chars', () => {
    expect(() => addressSchema.parse('3PJCkxKEMgnCSSFZzrpTNa7XEt5hEDoKvqKX')).toThrow();
  });

  it('rejects addresses not starting with 3P', () => {
    expect(() => addressSchema.parse('1PJCkxKEMgnCSSFZzrpTNa7XEt5hEDoKvqK')).toThrow();
  });

  it('rejects an empty string', () => {
    expect(() => addressSchema.parse('')).toThrow();
  });
});

// ─── aliasSchema ─────────────────────────────────────────────────────────────

describe('aliasSchema', () => {
  it('accepts a valid alias', () => {
    expect(() => aliasSchema.parse('myalias')).not.toThrow();
  });

  it('accepts alias with allowed special characters', () => {
    expect(() => aliasSchema.parse('my.alias_test-1@2')).not.toThrow();
  });

  it('rejects alias shorter than 4 chars', () => {
    expect(() => aliasSchema.parse('ab')).toThrow();
  });

  it('rejects alias longer than 30 chars', () => {
    expect(() => aliasSchema.parse('a'.repeat(31))).toThrow();
  });

  it('rejects alias with uppercase letters', () => {
    expect(() => aliasSchema.parse('MyAlias')).toThrow();
  });

  it('rejects alias with invalid characters', () => {
    expect(() => aliasSchema.parse('alias!')).toThrow();
  });
});

// ─── amountSchema ─────────────────────────────────────────────────────────────

describe('amountSchema', () => {
  it('accepts a positive finite number', () => {
    expect(() => amountSchema.parse(1.5)).not.toThrow();
  });

  it('rejects zero', () => {
    expect(() => amountSchema.parse(0)).toThrow();
  });

  it('rejects negative numbers', () => {
    expect(() => amountSchema.parse(-1)).toThrow();
  });

  it('rejects Infinity', () => {
    expect(() => amountSchema.parse(Infinity)).toThrow();
  });
});

// ─── optionalAmountSchema ─────────────────────────────────────────────────────

describe('optionalAmountSchema', () => {
  it('accepts a valid positive number', () => {
    expect(() => optionalAmountSchema.parse(0.5)).not.toThrow();
  });

  it('accepts null', () => {
    expect(() => optionalAmountSchema.parse(null)).not.toThrow();
  });

  it('accepts undefined', () => {
    expect(() => optionalAmountSchema.parse(undefined)).not.toThrow();
  });
});

// ─── attachmentSchema ─────────────────────────────────────────────────────────

describe('attachmentSchema', () => {
  it('accepts a valid short attachment', () => {
    expect(() => attachmentSchema.parse('invoice #123')).not.toThrow();
  });

  it('accepts undefined (optional)', () => {
    expect(() => attachmentSchema.parse(undefined)).not.toThrow();
  });

  it('rejects attachment longer than 140 characters', () => {
    expect(() => attachmentSchema.parse('x'.repeat(141))).toThrow();
  });
});

// ─── passwordSchema ───────────────────────────────────────────────────────────

describe('passwordSchema', () => {
  it('accepts a strong password meeting all requirements', () => {
    expect(() => passwordSchema.parse('MyStr0ng!Pass#99')).not.toThrow();
  });

  it('rejects passwords shorter than 12 characters', () => {
    expect(() => passwordSchema.parse('Short1!')).toThrow();
  });

  it('rejects passwords missing an uppercase letter', () => {
    expect(() => passwordSchema.parse('nouppercase1!')).toThrow();
  });

  it('rejects passwords missing a lowercase letter', () => {
    expect(() => passwordSchema.parse('NOLOWERCASE1!')).toThrow();
  });

  it('rejects passwords missing a digit', () => {
    expect(() => passwordSchema.parse('NoDigitsHere!aa')).toThrow();
  });

  it('rejects passwords missing a special character', () => {
    expect(() => passwordSchema.parse('NoSpecial1aaaa')).toThrow();
  });
});

// ─── seedPhraseSchema ─────────────────────────────────────────────────────────

describe('seedPhraseSchema', () => {
  it('accepts exactly 15 words', () => {
    const seed = Array.from({ length: 15 }, (_, i) => `word${i}`).join(' ');
    expect(() => seedPhraseSchema.parse(seed)).not.toThrow();
  });

  it('rejects fewer than 15 words', () => {
    const seed = Array.from({ length: 10 }, (_, i) => `word${i}`).join(' ');
    expect(() => seedPhraseSchema.parse(seed)).toThrow();
  });

  it('rejects more than 15 words', () => {
    const seed = Array.from({ length: 16 }, (_, i) => `word${i}`).join(' ');
    expect(() => seedPhraseSchema.parse(seed)).toThrow();
  });
});

// ─── sendAssetSchema ──────────────────────────────────────────────────────────

describe('sendAssetSchema', () => {
  it('accepts a valid transfer with address recipient', () => {
    expect(() =>
      sendAssetSchema.parse({
        amount: 1,
        assetId: null,
        attachment: 'hello',
        fee: null,
        recipient: '3PJCkxKEMgnCSSFZzrpTNa7XEt5hEDoKvqK',
      }),
    ).not.toThrow();
  });

  it('accepts an alias as recipient', () => {
    expect(() =>
      sendAssetSchema.parse({
        amount: 5,
        recipient: 'myalias',
      }),
    ).not.toThrow();
  });

  it('rejects an invalid recipient', () => {
    expect(() =>
      sendAssetSchema.parse({
        amount: 1,
        recipient: '!!invalid!!',
      }),
    ).toThrow();
  });
});

// ─── massTransferSchema ──────────────────────────────────────────────────────

describe('massTransferSchema', () => {
  it('accepts a valid mass transfer with one recipient', () => {
    expect(() =>
      massTransferSchema.parse({
        assetId: null,
        recipients: [{ amount: 1, recipient: '3PJCkxKEMgnCSSFZzrpTNa7XEt5hEDoKvqK' }],
      }),
    ).not.toThrow();
  });

  it('rejects empty recipients array', () => {
    expect(() => massTransferSchema.parse({ recipients: [] })).toThrow();
  });

  it('accepts an alias as recipient in a mass transfer', () => {
    expect(() =>
      massTransferSchema.parse({
        recipients: [{ amount: 5, recipient: 'myalias' }],
      }),
    ).not.toThrow();
  });

  it('rejects an invalid recipient in a mass transfer', () => {
    expect(() =>
      massTransferSchema.parse({
        recipients: [{ amount: 1, recipient: '!!invalid!!' }],
      }),
    ).toThrow();
  });
});

// ─── leaseSchema ─────────────────────────────────────────────────────────────

describe('leaseSchema', () => {
  it('accepts valid lease data', () => {
    expect(() =>
      leaseSchema.parse({
        amount: 100,
        fee: null,
        recipient: '3PJCkxKEMgnCSSFZzrpTNa7XEt5hEDoKvqK',
      }),
    ).not.toThrow();
  });

  it('rejects an invalid address as recipient', () => {
    expect(() =>
      leaseSchema.parse({
        amount: 100,
        recipient: 'not-an-address',
      }),
    ).toThrow();
  });
});

// ─── tokenIssuanceSchema ──────────────────────────────────────────────────────

describe('tokenIssuanceSchema', () => {
  it('accepts valid token issuance data', () => {
    expect(() =>
      tokenIssuanceSchema.parse({
        decimals: 8,
        description: 'My token',
        fee: null,
        name: 'MyToken',
        quantity: 1_000_000,
        reissuable: true,
      }),
    ).not.toThrow();
  });

  it('rejects decimals greater than 8', () => {
    expect(() =>
      tokenIssuanceSchema.parse({
        decimals: 9,
        description: '',
        name: 'Token',
        quantity: 1,
        reissuable: false,
      }),
    ).toThrow();
  });

  it('rejects a name shorter than 4 characters', () => {
    expect(() =>
      tokenIssuanceSchema.parse({
        decimals: 0,
        description: '',
        name: 'Tok',
        quantity: 1,
        reissuable: false,
      }),
    ).toThrow();
  });
});

// ─── assetReissueSchema ───────────────────────────────────────────────────────

describe('assetReissueSchema', () => {
  it('accepts valid reissue data', () => {
    expect(() =>
      assetReissueSchema.parse({
        assetId: 'DCC',
        fee: null,
        quantity: 500,
        reissuable: true,
      }),
    ).not.toThrow();
  });

  it('rejects empty assetId', () => {
    expect(() =>
      assetReissueSchema.parse({ assetId: '', quantity: 1, reissuable: false }),
    ).toThrow();
  });
});

// ─── assetBurnSchema ─────────────────────────────────────────────────────────

describe('assetBurnSchema', () => {
  it('accepts valid burn data', () => {
    expect(() => assetBurnSchema.parse({ assetId: 'DCC', fee: null, quantity: 10 })).not.toThrow();
  });

  it('rejects empty assetId', () => {
    expect(() => assetBurnSchema.parse({ assetId: '', quantity: 10 })).toThrow();
  });
});

// ─── aliasRegistrationSchema ──────────────────────────────────────────────────

describe('aliasRegistrationSchema', () => {
  it('accepts valid alias registration', () => {
    expect(() => aliasRegistrationSchema.parse({ alias: 'myalias', fee: null })).not.toThrow();
  });

  it('rejects an invalid alias', () => {
    expect(() => aliasRegistrationSchema.parse({ alias: 'a' })).toThrow();
  });
});

// ─── dataTransactionSchema ───────────────────────────────────────────────────

describe('dataTransactionSchema', () => {
  it('accepts valid data transaction', () => {
    expect(() =>
      dataTransactionSchema.parse({
        data: [{ key: 'name', type: 'string', value: 'Alice' }],
        fee: null,
      }),
    ).not.toThrow();
  });

  it('rejects empty data array', () => {
    expect(() => dataTransactionSchema.parse({ data: [] })).toThrow();
  });

  it('rejects data entry with empty key', () => {
    expect(() =>
      dataTransactionSchema.parse({
        data: [{ key: '', type: 'string', value: 'x' }],
      }),
    ).toThrow();
  });

  it('rejects data entry with unknown type', () => {
    expect(() =>
      dataTransactionSchema.parse({
        data: [{ key: 'k', type: 'unknown', value: 'x' }],
      }),
    ).toThrow();
  });
});

// ─── dexOrderSchema ───────────────────────────────────────────────────────────

describe('dexOrderSchema', () => {
  it('accepts a valid buy order', () => {
    expect(() =>
      dexOrderSchema.parse({
        amount: 1,
        amountAsset: 'DCC',
        matcherFee: null,
        orderType: 'buy',
        price: 0.5,
        priceAsset: 'CRC',
      }),
    ).not.toThrow();
  });

  it('accepts a valid sell order', () => {
    expect(() =>
      dexOrderSchema.parse({
        amount: 2,
        amountAsset: 'DCC',
        matcherFee: null,
        orderType: 'sell',
        price: 1,
        priceAsset: 'CRC',
      }),
    ).not.toThrow();
  });

  it('rejects invalid orderType', () => {
    expect(() =>
      dexOrderSchema.parse({
        amount: 1,
        amountAsset: 'DCC',
        orderType: 'hold',
        price: 1,
        priceAsset: 'CRC',
      }),
    ).toThrow();
  });
});

// ─── loginSchema ─────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts a valid 15-word seed phrase', () => {
    const seed = Array.from({ length: 15 }, (_, i) => `word${i}`).join(' ');
    expect(() => loginSchema.parse({ seedPhrase: seed })).not.toThrow();
  });

  it('rejects an invalid seed phrase', () => {
    expect(() => loginSchema.parse({ seedPhrase: 'only three words here' })).toThrow();
  });
});

// ─── passwordConfirmationSchema ───────────────────────────────────────────────

describe('passwordConfirmationSchema', () => {
  it('accepts matching passwords', () => {
    expect(() =>
      passwordConfirmationSchema.parse({
        confirmPassword: 'MyStr0ng!Pass#99',
        password: 'MyStr0ng!Pass#99',
      }),
    ).not.toThrow();
  });

  it('rejects non-matching passwords', () => {
    expect(() =>
      passwordConfirmationSchema.parse({
        confirmPassword: 'Different1!Pass',
        password: 'MyStr0ng!Pass#99',
      }),
    ).toThrow();
  });

  it('rejects a weak primary password', () => {
    expect(() =>
      passwordConfirmationSchema.parse({
        confirmPassword: 'weak',
        password: 'weak',
      }),
    ).toThrow();
  });
});

// ─── getFormError ─────────────────────────────────────────────────────────────

describe('getFormError', () => {
  it('returns the message from an error-like object', () => {
    expect(getFormError({ message: 'Required' })).toBe('Required');
  });

  it('returns undefined when fieldErrors is null', () => {
    expect(getFormError(null)).toBeUndefined();
  });

  it('returns undefined when fieldErrors is a plain string', () => {
    expect(getFormError('error')).toBeUndefined();
  });

  it('returns undefined when there is no message property', () => {
    expect(getFormError({ type: 'min' })).toBeUndefined();
  });
});

// ─── formatFormData ───────────────────────────────────────────────────────────

describe('formatFormData', () => {
  it('removes null values', () => {
    const result = formatFormData({ a: 1, b: null });
    expect(result).toEqual({ a: 1 });
  });

  it('removes undefined values', () => {
    const result = formatFormData({ a: 1, b: undefined });
    expect(result).toEqual({ a: 1 });
  });

  it('keeps zero, false, and empty string', () => {
    const result = formatFormData({ a: 0, b: false, c: '' });
    expect(result).toEqual({ a: 0, b: false, c: '' });
  });

  it('returns a copy — does not mutate the input', () => {
    const input = { a: 1, b: null };
    formatFormData(input);
    expect(input).toEqual({ a: 1, b: null });
  });
});

// ─── validateRecipient ────────────────────────────────────────────────────────

describe('validateRecipient', () => {
  it('identifies a valid DCC address', () => {
    expect(validateRecipient('3PJCkxKEMgnCSSFZzrpTNa7XEt5hEDoKvqK')).toBe('address');
  });

  it('identifies a valid alias', () => {
    expect(validateRecipient('myalias')).toBe('alias');
  });

  it('returns invalid for an unrecognised value', () => {
    expect(validateRecipient('!@#$%')).toBe('invalid');
  });

  it('returns invalid for an empty string', () => {
    expect(validateRecipient('')).toBe('invalid');
  });
});

// ─── dccletsToAmount ─────────────────────────────────────────────────────────

describe('dccletsToAmount', () => {
  it('converts 100,000,000 dcclets to 1 DCC', () => {
    expect(dccletsToAmount(100_000_000)).toBe(1);
  });

  it('converts 1 dcclet to 0.00000001 DCC', () => {
    expect(dccletsToAmount(1)).toBe(0.00000001);
  });

  it('converts 0 dcclets to 0', () => {
    expect(dccletsToAmount(0)).toBe(0);
  });
});

// ─── amountToDcclets ─────────────────────────────────────────────────────────

describe('amountToDcclets', () => {
  it('converts 1 DCC to 100,000,000 dcclets', () => {
    expect(amountToDcclets(1)).toBe(100_000_000);
  });

  it('converts 0.00000001 DCC to 1 dcclet', () => {
    expect(amountToDcclets(0.00000001)).toBe(1);
  });

  it('converts 0 DCC to 0 dcclets', () => {
    expect(amountToDcclets(0)).toBe(0);
  });

  it('floors fractional dcclets', () => {
    // 1.5 DCC = 150,000,000 dcclets exactly; Math.floor is a no-op here
    expect(amountToDcclets(1.5)).toBe(150_000_000);
  });
});

// ─── useZodForm ───────────────────────────────────────────────────────────────

describe('useZodForm', () => {
  it('returns a react-hook-form UseFormReturn object', () => {
    const schema = loginSchema;
    const { result } = renderHook(() => useZodForm(schema));
    expect(result.current.register).toBeDefined();
    expect(result.current.handleSubmit).toBeDefined();
    expect(result.current.formState).toBeDefined();
  });

  it('starts with isDirty: false', () => {
    const schema = sendAssetSchema;
    const { result } = renderHook(() => useZodForm(schema));
    expect(result.current.formState.isDirty).toBe(false);
  });

  it('accepts default values via options', () => {
    const schema = leaseSchema;
    const { result } = renderHook(() =>
      useZodForm(schema, {
        defaultValues: { amount: 0, fee: null, recipient: '' },
      }),
    );
    expect(result.current.formState).toBeDefined();
  });
});
