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

export function formatAmount(
  amount: number | bigint | string | null | undefined,
  decimals: number = 8,
): string {
  if (!amount && amount !== 0) return '0';
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
