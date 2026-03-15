/**
 * Secure In-Memory Transfer
 *
 * One-time, short-lived in-memory store for passing sensitive data
 * between components without exposing it in browser history, URL state,
 * React Router state, or any persistent storage.
 *
 * SECURITY GUARANTEES:
 * - Data is stored ONLY in a module-scoped variable (JS heap)
 * - Data is cleared after first read (one-time retrieval)
 * - Data auto-expires after 30 seconds if not read
 * - No persistence to localStorage, sessionStorage, or history state
 * - Not accessible via browser DevTools Application tab
 */

let _pendingSeed: string | null = null;
let _expireTimer: ReturnType<typeof setTimeout> | null = null;

const AUTO_EXPIRE_MS = 30_000; // 30 seconds

/**
 * Store a seed phrase for one-time transfer between components.
 * Automatically expires after 30 seconds if not consumed.
 */
export const setSeedTransfer = (seed: string): void => {
  // Clear any previous pending transfer
  clearSeedTransfer();

  _pendingSeed = seed;

  // Auto-expire after 30 seconds
  _expireTimer = setTimeout(() => {
    _pendingSeed = null;
    _expireTimer = null;
  }, AUTO_EXPIRE_MS);
};

/**
 * Consume the pending seed phrase. Returns the seed and clears it immediately.
 * This is a ONE-TIME read — subsequent calls return null.
 */
export const consumeSeedTransfer = (): string | null => {
  const seed = _pendingSeed;
  clearSeedTransfer();
  return seed;
};

/**
 * Clear any pending seed transfer.
 */
export const clearSeedTransfer = (): void => {
  _pendingSeed = null;
  if (_expireTimer) {
    clearTimeout(_expireTimer);
    _expireTimer = null;
  }
};
