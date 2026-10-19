function formatDateTime(date: Date): string {
  // Use UTC methods so server (UTC) and browser (any timezone) produce identical
  // output — preventing React hydration error #418 from timezone differences.
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
}

/** Parses an integer amount to BigInt without going through a float; null if not a whole number. */
function toBigIntExact(amount: number | bigint | string): bigint | null {
  if (typeof amount === 'bigint') return amount;
  if (typeof amount === 'number') return Number.isSafeInteger(amount) ? BigInt(amount) : null;
  return /^-?\d+$/.test(amount.trim()) ? BigInt(amount.trim()) : null;
}

/**
 * Formats an integer amount of base units with `decimals` decimal places, exactly
 * (BigInt arithmetic, no float rounding above 2^53). Null when the input is not a
 * whole number or decimals is not a small non-negative integer.
 */
export function formatUnitsExact(
  amount: number | bigint | string,
  decimals: number,
): string | null {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 100) return null;
  const value = toBigIntExact(amount);
  if (value === null) return null;
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const scale = 10n ** BigInt(decimals);
  // Fixed locale so server and client output match (no hydration mismatch).
  const whole = (abs / scale).toLocaleString('en-US');
  const frac = (abs % scale).toString().padStart(decimals, '0').replace(/0+$/, '');
  const text = frac ? `${whole}.${frac}` : whole;
  return negative && abs !== 0n ? `-${text}` : text;
}

export function formatAmount(
  amount: number | bigint | string | null | undefined,
  decimals: number = 8,
): string {
  if (!amount && amount !== 0) return '0';
  const exact = formatUnitsExact(amount, decimals);
  if (exact !== null) return exact;
  // Non-integer or unparseable input: keep the previous float formatting.
  const value = Number(amount) / 10 ** decimals;
  // Use a fixed locale so server and client produce identical output,
  // preventing React hydration error #418 (text content mismatch).
  return value.toLocaleString('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}

export function truncate(str: string | null | undefined, n: number = 10): string {
  if (!str) return '';
  if (str.length <= n * 2) return str;
  return `${str.slice(0, n)}...${str.slice(-n)}`;
}

export function fromUnix(ms: number | string | null | undefined): string {
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0) {
    return 'N/A';
  }
  try {
    return formatDateTime(new Date(ms));
  } catch (_error) {
    return 'Invalid Date';
  }
}

export function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).then(
    () => true,
    () => false,
  );
}

export function timeAgo(timestamp: number | null | undefined): string {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp) || timestamp <= 0) {
    return 'N/A';
  }
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 0) return 'in the future';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
