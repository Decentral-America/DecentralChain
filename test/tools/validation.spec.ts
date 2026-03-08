import dccAddress2eth from '../../src/tools/adresses/dccAddress2eth';
import ethAddress2dcc from '../../src/tools/adresses/ethAddress2dcc';
import dccAsset2Eth from '../../src/tools/assets/dccAsset2eth';
import ethTxId2dcc from '../../src/tools/transactions/ethTxId2dcc';

describe('dccAddress2eth – input validation', () => {
  it('throws on empty string', () => {
    expect(() => dccAddress2eth('')).toThrow(/Invalid DCC address/);
  });

  it('throws on non-string input', () => {
    expect(() => dccAddress2eth(null as any)).toThrow(/Invalid DCC address/);
    expect(() => dccAddress2eth(undefined as any)).toThrow(/Invalid DCC address/);
    expect(() => dccAddress2eth(123 as any)).toThrow(/Invalid DCC address/);
  });

  it('throws on incorrectly-sized address', () => {
    // Base58 encoding of too-short data
    expect(() => dccAddress2eth('abc')).toThrow(/expected 26 decoded bytes/);
  });
});

describe('ethAddress2dcc – input validation', () => {
  it('throws on invalid Ethereum address', () => {
    expect(() => ethAddress2dcc('not-an-address', 67)).toThrow(/Invalid Ethereum address/);
  });

  it('throws on invalid chainId (> 255)', () => {
    expect(() => ethAddress2dcc('0x11242d6ec6B50713026a3757cAeb027294C2242a', 256)).toThrow(
      /Invalid chainId/,
    );
  });

  it('throws on negative chainId', () => {
    expect(() => ethAddress2dcc('0x11242d6ec6B50713026a3757cAeb027294C2242a', -1)).toThrow(
      /Invalid chainId/,
    );
  });

  it('throws on non-integer chainId', () => {
    expect(() => ethAddress2dcc('0x11242d6ec6B50713026a3757cAeb027294C2242a', 67.5)).toThrow(
      /Invalid chainId/,
    );
  });
});

describe('ethTxId2dcc – input validation', () => {
  it('throws on non-hex input', () => {
    expect(() => ethTxId2dcc('not-hex-zzzz')).toThrow(/Invalid Ethereum TX ID/);
  });

  it('throws on odd-length hex', () => {
    expect(() => ethTxId2dcc('0xabc')).toThrow(/even length/);
  });

  it('converts valid hex', () => {
    const result = ethTxId2dcc('0xabcd');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('dccAsset2Eth – input validation', () => {
  it('throws on empty string', () => {
    expect(() => dccAsset2Eth('')).toThrow(/Invalid DCC asset ID/);
  });

  it('throws on too-short decoded data', () => {
    // 'a' decodes to just a few bytes
    expect(() => dccAsset2Eth('a')).toThrow(/need at least 20/);
  });
});
