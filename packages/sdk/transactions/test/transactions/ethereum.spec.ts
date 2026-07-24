import { dccAddress2eth } from '@decentralchain/node-api';
import { ethereumKeyPair } from '@decentralchain/ts-lib-crypto';
import { RLP } from '@ethereumjs/rlp';
import { ethereumTransfer } from '../../src';

describe('ethereumTransfer', () => {
  const { ethPrivateKey } = ethereumKeyPair();

  it('produces a well-formed signed transaction', () => {
    const recipient = '0x1111111111111111111111111111111111111111';
    const signed = ethereumTransfer({ amount: 100_000, chainId: 33, recipient }, ethPrivateKey);

    expect(signed.raw).toMatch(/^0x[0-9a-f]+$/);
    expect(signed.id).toMatch(/^0x[0-9a-f]{64}$/);
    expect(signed.from).toMatch(/^0x[0-9a-f]{40}$/);
    // fromAddress is the DCC envelope wrapping the exact same 20-byte hash as `from`.
    expect(dccAddress2eth(signed.fromAddress)).toBe(signed.from);
  });

  it('is deterministic for identical params (RFC6979 signing has no randomness)', () => {
    const params = {
      amount: 250_000,
      chainId: 33,
      nonce: 1700000000000,
      recipient: '0x2222222222222222222222222222222222222222',
    };
    const first = ethereumTransfer(params, ethPrivateKey);
    const second = ethereumTransfer(params, ethPrivateKey);
    expect(second.raw).toBe(first.raw);
    expect(second.id).toBe(first.id);
  });

  it('round-trips a recipient address with a leading zero byte without corruption', () => {
    // The one named RLP footgun this builder must avoid: `to` is a 20-byte
    // byte-string, not an integer. If it were ever encoded as an integer,
    // RLP would silently strip this leading 0x00 and the recipient would
    // decode back as a DIFFERENT, 19-byte-shifted address — a corrupted
    // transfer that looks successful. Assert the full round-trip instead
    // of trusting the implementation not to regress this.
    const recipient = '0x00aabbccddeeff00112233445566778899aabbcc';
    const signed = ethereumTransfer({ amount: 100_000, chainId: 33, recipient }, ethPrivateKey);

    const rawBytes = Uint8Array.from(Buffer.from(signed.raw.slice(2), 'hex'));
    const decoded = RLP.decode(rawBytes);
    expect(Array.isArray(decoded)).toBe(true);
    const to = (decoded as Uint8Array[])[3];

    expect(to).toHaveLength(20);
    expect(`0x${Buffer.from(to).toString('hex')}`).toBe(recipient);
  });
});
