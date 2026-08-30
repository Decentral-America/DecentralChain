/**
 * Amount conversion across the bridge.
 *
 * Two independent things go wrong here, and neither announces itself:
 *
 * 1. Wrapped decimals need not match Solana decimals. SOL and JitoSOL are 9 on
 *    Solana and 8 on DecentralChain; everything else is 1:1. Assuming they
 *    match displays balances wrong by 10×.
 * 2. Crossing that gap truncates. 1.123456789 SOL is 9 significant decimals;
 *    the wrapped asset holds 8. The ninth digit is not rounded, it is dropped,
 *    and the user is not refunded for it.
 *
 * `GET /tokens` supplies `solDecimals`, `dccDecimals` and `divisor` per asset,
 * so none of this is derived here — but it does have to be applied per asset
 * rather than once for all of them.
 *
 * Raw amounts are integers in base units, held as `bigint`. Floating point has
 * no business anywhere near a balance.
 */
import { type BridgeToken } from './types';

/**
 * Parses a human-entered decimal string into raw base units.
 *
 * Rejects rather than rounds when the input carries more precision than the
 * asset has. A silent round here is a silent loss of the user's money.
 *
 * @throws when the input is not a plain non-negative decimal, or is too precise
 */
export const humanToRaw = (human: string, decimals: number): bigint => {
  const trimmed = human.trim();

  // Accepts "1", "1.", "1.5" and ".5" — a bare leading dot is a normal thing
  // to type into an amount field. Rejects signs, exponents and separators.
  if (!/^(\d+\.?\d*|\.\d+)$/.test(trimmed)) {
    throw new Error(`Not a valid amount: "${human}"`);
  }

  const [whole = '0', fraction = ''] = trimmed.split('.');

  if (fraction.length > decimals) {
    throw new Error(
      `"${human}" has ${fraction.length} decimal places but this asset holds ${decimals}. ` +
        'Rounding here would silently lose the difference.',
    );
  }

  return BigInt(whole + fraction.padEnd(decimals, '0'));
};

/** Formats raw base units for display, without trailing-zero noise. */
export const rawToHuman = (raw: bigint | string, decimals: number): string => {
  const value = typeof raw === 'string' ? BigInt(raw) : raw;
  const negative = value < 0n;
  const digits = (negative ? -value : value).toString().padStart(decimals + 1, '0');

  const whole = digits.slice(0, digits.length - decimals);
  const fraction = decimals === 0 ? '' : digits.slice(digits.length - decimals).replace(/0+$/, '');

  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
};

export interface CrossChainAmount {
  /** Raw units credited on DecentralChain. */
  dccRaw: bigint;
  /**
   * Raw Solana units that fall below the wrapped asset's precision and are
   * lost in the conversion. Zero for every asset with `divisor === 1`.
   */
  dustRaw: bigint;
  /** Raw Solana units the user actually locks. */
  solanaRaw: bigint;
}

/**
 * Converts a deposit amount from Solana units to what will be minted.
 *
 * Reports the truncated remainder rather than hiding it. For a `divisor` of 1
 * — every asset except SOL and JitoSOL — the dust is always zero and the two
 * raw values are equal.
 */
export const solanaToDcc = (solanaRaw: bigint, token: BridgeToken): CrossChainAmount => {
  const divisor = BigInt(token.divisor);

  return {
    dccRaw: solanaRaw / divisor,
    dustRaw: solanaRaw % divisor,
    solanaRaw,
  };
};

/**
 * Converts a withdrawal amount from wrapped units back to Solana units.
 *
 * Exact in this direction: multiplying by the divisor cannot lose precision,
 * because the wrapped asset is the coarser of the two.
 */
export const dccToSolana = (dccRaw: bigint, token: BridgeToken): bigint =>
  dccRaw * BigInt(token.divisor);

/** True when this asset's two representations differ, so conversion can truncate. */
export const hasDecimalGap = (token: BridgeToken): boolean => token.divisor !== 1;
