/**
 * Where accounts live in local storage, and whether this device holds any.
 *
 * The keys match the Angular wallet's so an existing installation is
 * recognised rather than silently treated as a fresh one.
 */

export const STORAGE_KEYS = {
  MULTI_ACCOUNT_DATA: 'multiAccountData',
  MULTI_ACCOUNT_HASH: 'multiAccountHash',
  MULTI_ACCOUNT_SETTINGS: 'multiAccountSettings',
  MULTI_ACCOUNT_USERS: 'multiAccountUsers',
  USER_LIST: 'userList', // Legacy support
} as const;

/** Reads a key, treating an unavailable store as simply empty. */
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Private-mode and blocked-storage browsers throw rather than return null.
    return null;
  }
}

/** Whether a parsed JSON value represents at least one account. */
function isPopulated(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.length > 0;
    if (parsed && typeof parsed === 'object') return Object.keys(parsed).length > 0;
    return false;
  } catch {
    return false;
  }
}

/**
 * Whether at least one wallet already exists on this device.
 *
 * Used to send someone to sign-in instead of wallet creation. Every read is
 * defensive: a corrupt or half-written entry reads as "no account", because
 * offering to create a wallet is recoverable while a landing page that throws
 * is not.
 */
export function hasStoredAccount(): boolean {
  if (isPopulated(read(STORAGE_KEYS.MULTI_ACCOUNT_USERS))) return true;
  // A wallet whose user list has not been written still leaves its payload.
  const data = read(STORAGE_KEYS.MULTI_ACCOUNT_DATA);
  if (data && data.length > 0) return true;
  return isPopulated(read(STORAGE_KEYS.USER_LIST));
}
