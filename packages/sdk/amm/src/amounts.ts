/**
 * Amount normalization utilities.
 *
 * Converts between human-readable amounts (e.g., 1.5 tokens)
 * and raw integer amounts (e.g., 150000000 for 8 decimals).
 *
 * All on-chain math uses raw amounts. Normalization is display-only.
 */

/**
 * Rewrites a decimal written in exponent notation ("1.5e-7", "1e+21") as a
 * plain decimal string ("0.00000015", "1000000000000000000000"). Exact: it only
 * moves the decimal point of the digits JavaScript printed.
 */
function toPlainDecimal(value: string): string {
  const match = /^(-?)(\d+)(?:\.(\d+))?e([+-]?\d+)$/i.exec(value.trim());
  if (!match) return value.trim();
  const [, sign = '', intDigits = '', fracDigits = '', exponent = '0'] = match;
  const digits = intDigits + fracDigits;
  const point = intDigits.length + Number(exponent);
  if (point <= 0) return `${sign}0.${'0'.repeat(-point)}${digits}`;
  if (point >= digits.length) return `${sign}${digits}${'0'.repeat(point - digits.length)}`;
  return `${sign}${digits.slice(0, point)}.${digits.slice(point)}`;
}

/** Linear-time replacement for `str.replace(/0+$/, '')` (CodeQL js/polynomial-redos). */
function trimTrailingZeros(digits: string): string {
  let end = digits.length;
  while (end > 0 && digits.charCodeAt(end - 1) === 48 /* '0' */) end -= 1;
  return digits.slice(0, end);
}

/**
 * Convert a human-readable amount to raw integer units.
 *
 * @param amount - Human-readable amount (e.g., "1.5", 1.5, 1e-7)
 * @param decimals - Token decimals (e.g., 8)
 * @returns Raw integer amount as bigint (excess decimals are truncated)
 * @throws RangeError when `amount` is a non-finite number
 */
export function toRawAmount(amount: string | number, decimals: number): bigint {
  if (typeof amount === 'number' && !Number.isFinite(amount)) {
    throw new RangeError(`toRawAmount: amount must be a finite number, got ${amount}`);
  }
  const str = toPlainDecimal(typeof amount === 'number' ? String(amount) : amount);

  // Split at decimal point
  const parts = str.split('.');
  const intPart = parts[0] || '0';
  let fracPart = parts[1] || '';

  // Pad or truncate fractional part to decimals places
  if (fracPart.length > decimals) {
    fracPart = fracPart.slice(0, decimals);
  } else {
    fracPart = fracPart.padEnd(decimals, '0');
  }

  return BigInt(intPart + fracPart);
}

/**
 * Convert a raw integer amount to a human-readable string.
 *
 * @param rawAmount - Raw integer amount (may be negative)
 * @param decimals - Token decimals
 * @returns Human-readable string (e.g., "1.5", "-0.00000005")
 */
export function fromRawAmount(rawAmount: bigint, decimals: number): string {
  if (rawAmount < 0n) return `-${fromRawAmount(-rawAmount, decimals)}`;
  const str = rawAmount.toString();
  if (decimals === 0) return str;

  const padded = str.padStart(decimals + 1, '0');
  const intPart = padded.slice(0, padded.length - decimals);
  const trimmedFrac = trimTrailingZeros(padded.slice(padded.length - decimals));
  if (trimmedFrac === '') return intPart;
  return `${intPart}.${trimmedFrac}`;
}

/**
 * Format a raw amount for display with a fixed number of decimal places.
 */
export function formatAmount(
  rawAmount: bigint,
  decimals: number,
  displayDecimals: number = 4,
): string {
  const full = fromRawAmount(rawAmount, decimals);
  const parts = full.split('.');
  const intPart = parts[0] || '';
  if (!parts[1]) return intPart;
  return `${intPart}.${parts[1].slice(0, displayDecimals)}`;
}
