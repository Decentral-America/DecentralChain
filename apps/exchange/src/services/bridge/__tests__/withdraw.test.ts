// @vitest-environment node
//
// PublicKey validation only; no DOM. See pda.test.ts for why jsdom is avoided
// for anything touching @solana/web3.js curve maths.
import { describe, expect, it } from 'vitest';
import { DCC_BRIDGE_CONTRACT, WITHDRAW_TX_FEE } from '@/config/bridge';
import { type BridgeToken } from '@/services/bridge/types';
import {
  buildBurnToken,
  canPayTxFee,
  isValidSolanaAddress,
  withdrawBreakdown,
} from '@/services/bridge/withdraw';

const USDC: BridgeToken = {
  assetId: 'HZk1UYcFXacX5CmDMbmnQm1PYVUsgqLrHwHqNBWMbwXe',
  dccDecimals: 6,
  divisor: 1,
  enabled: true,
  name: 'USDC',
  solDecimals: 6,
  splMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  totalBurned: '0',
  totalMinted: '0',
};

const RECIPIENT = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

describe('isValidSolanaAddress', () => {
  it('accepts real base58 pubkeys', () => {
    expect(isValidSolanaAddress(RECIPIENT)).toBe(true);
    expect(isValidSolanaAddress('So11111111111111111111111111111111111111112')).toBe(true);
  });

  it('rejects a DecentralChain address', () => {
    // 26 bytes, not 32 — an easy paste to make on a page showing both chains,
    // and the burn is irreversible.
    expect(isValidSolanaAddress('3Dfw9hasyUyeRBr8H7NJhcWZLRbVfHzt64D')).toBe(false);
  });

  it('rejects malformed input', () => {
    for (const bad of ['', 'not-base58!', '0x1234', 'abc']) {
      expect(isValidSolanaAddress(bad)).toBe(false);
    }
  });
});

describe('buildBurnToken', () => {
  it('targets the bridge contract with the documented arguments', () => {
    const invocation = buildBurnToken({
      amountRaw: 1_000_000n,
      solanaRecipient: RECIPIENT,
      token: USDC,
    });

    expect(invocation.dApp).toBe(DCC_BRIDGE_CONTRACT);
    expect(invocation.call.function).toBe('burnToken');
    expect(invocation.call.args).toEqual([
      { type: 'string', value: RECIPIENT },
      { type: 'string', value: USDC.splMint },
    ]);
  });

  it('attaches the wrapped asset as payment, not the mint', () => {
    // The payment carries the DecentralChain assetId; the Solana mint is an
    // argument. Swapping them builds a transaction that cannot settle.
    const invocation = buildBurnToken({
      amountRaw: 1_000_000n,
      solanaRecipient: RECIPIENT,
      token: USDC,
    });

    expect(invocation.payment).toEqual([{ amount: 1_000_000, assetId: USDC.assetId }]);
    expect(invocation.payment[0]?.assetId).not.toBe(USDC.splMint);
  });

  it('sends the payment amount as a JSON number, not a string', () => {
    // The node rejects a string with:
    //   {"error":1,"message":"failed to parse json message",
    //    "validationErrors":{"obj.payment[0].amount":["error.expected.jsnumber"]}}
    // The SDK types this field as `LONG = string | number`, so a string
    // compiles cleanly and fails only at broadcast — which surfaced to the
    // user as "Broadcast failed: Unknown error". Verified against
    // mainnet-node: numeric amounts parse, string amounts do not.
    const invocation = buildBurnToken({
      amountRaw: 999_000n,
      solanaRecipient: RECIPIENT,
      token: USDC,
    });

    expect(typeof invocation.payment[0]?.amount).toBe('number');
    expect(JSON.parse(JSON.stringify(invocation)).payment[0].amount).toBe(999_000);
  });

  it('refuses an amount too large to survive JSON exactly', () => {
    // Beyond Number.MAX_SAFE_INTEGER the conversion would round, and a
    // rounded amount is a wrong amount of money. ~90 million DCC at 8
    // decimals, so far above any real withdrawal — but silent is the problem,
    // not likelihood.
    expect(() =>
      buildBurnToken({
        amountRaw: BigInt(Number.MAX_SAFE_INTEGER) + 1n,
        solanaRecipient: RECIPIENT,
        token: USDC,
      }),
    ).toThrow(/rounded in transit/);
  });

  it('sets the 0.009 DCC fee', () => {
    expect(buildBurnToken({ amountRaw: 1n, solanaRecipient: RECIPIENT, token: USDC }).fee).toBe(
      900_000,
    );
  });

  it('refuses a recipient that is not a Solana address', () => {
    expect(() =>
      buildBurnToken({
        amountRaw: 1_000_000n,
        solanaRecipient: '3Dfw9hasyUyeRBr8H7NJhcWZLRbVfHzt64D',
        token: USDC,
      }),
    ).toThrow(/not a valid Solana address/);
  });

  it('refuses a non-positive amount', () => {
    for (const amount of [0n, -1n]) {
      expect(() =>
        buildBurnToken({ amountRaw: amount, solanaRecipient: RECIPIENT, token: USDC }),
      ).toThrow(/greater than zero/);
    }
  });
});

describe('withdrawBreakdown', () => {
  it('takes 0.25% and leaves the rest', () => {
    const result = withdrawBreakdown(1_000_000n);

    expect(result.bridgeFeeRaw).toBe(2_500n);
    expect(result.receivedRaw).toBe(997_500n);
    expect(result.burnedRaw).toBe(1_000_000n);
  });

  it('always balances', () => {
    for (const amount of [1n, 999n, 1_000_000n, 123_456_789n, 10n ** 18n]) {
      const { bridgeFeeRaw, receivedRaw } = withdrawBreakdown(amount);
      expect(receivedRaw + bridgeFeeRaw).toBe(amount);
    }
  });

  it('rounds the fee down rather than overcharging', () => {
    // 399 raw × 0.25% = 0.9975, which truncates to 0. The user keeps the
    // fraction; the alternative would charge a fee larger than the amount owed.
    expect(withdrawBreakdown(399n).bridgeFeeRaw).toBe(0n);
    expect(withdrawBreakdown(400n).bridgeFeeRaw).toBe(1n);
  });

  it('reports the transaction fee independently of the amount', () => {
    expect(withdrawBreakdown(1n).txFee).toBe(WITHDRAW_TX_FEE);
    expect(withdrawBreakdown(10n ** 12n).txFee).toBe(WITHDRAW_TX_FEE);
  });
});

describe('canPayTxFee', () => {
  it('requires at least the fee', () => {
    // A user with wrapped assets but no DCC cannot broadcast at all, and the
    // node's rejection says nothing about the fee balance.
    expect(canPayTxFee(900_000n)).toBe(true);
    expect(canPayTxFee(899_999n)).toBe(false);
    expect(canPayTxFee(0n)).toBe(false);
  });
});
