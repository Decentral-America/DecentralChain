/**
 * Amount normalization utilities.
 *
 * Converts between human-readable amounts (e.g., 1.5 tokens)
 * and raw integer amounts (e.g., 150000000 for 8 decimals).
 *
 * All on-chain math uses raw amounts. Normalization is display-only.
 */

/**
 * Convert a human-readable amount to raw integer units.
 *
 * @param amount - Human-readable amount (e.g., "1.5")
 * @param decimals - Token decimals (e.g., 8)
 * @returns Raw integer amount as bigint
 */
export function toRawAmount(amount: string | number, decimals: number): bigint {
  const str = typeof amount === 'number' ? amount.toString() : amount;

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

  const combined = intPart + fracPart;
  return BigInt(combined);
}

/**
 * Convert a raw integer amount to a human-readable string.
 *
 * @param rawAmount - Raw integer amount
 * @param decimals - Token decimals
 * @returns Human-readable string (e.g., "1.5")
 */
export function fromRawAmount(rawAmount: bigint, decimals: number): string {
  const str = rawAmount.toString();
  if (decimals === 0) return str;

  const padded = str.padStart(decimals + 1, '0');
  const intPart = padded.slice(0, padded.length - decimals);
  const fracPart = padded.slice(padded.length - decimals);

  // Remove trailing zeros from fractional part
  const trimmedFrac = fracPart.replace(/0+$/, '');
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
