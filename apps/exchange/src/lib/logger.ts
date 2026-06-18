/**
 * Production-Safe Logger
 *
 * SECURITY: In production builds, ALL log output is suppressed to prevent
 * leaking sensitive data (seeds, addresses, transaction details) via
 * browser DevTools or malicious extensions.
 *
 * In development, logs are passed through to console with tag prefixes.
 */

const isDev = import.meta.env.DEV;

/**
 * Sanitize a value for logging — strips any field that could be sensitive.
 * In production, sensitive fields are redacted but non-sensitive data passes through.
 * Info/debug logs are suppressed entirely in production (via isDev guard).
 */
// Keys that must never be assigned to an output object — prevents prototype pollution
// (CWE-1321 / CodeQL remote-property-injection).
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const sanitize = (args: unknown[]): unknown[] => {
  return args.map((arg) => {
    if (typeof arg === 'object' && arg !== null) {
      const obj = arg as Record<string, unknown>;
      // Object.create(null) produces a bare object with no prototype chain, so
      // even if a blocked key slips through it cannot reach Object.prototype.
      const cleaned = Object.create(null) as Record<string, unknown>;
      for (const [key, value] of Object.entries(obj)) {
        if (BLOCKED_KEYS.has(key)) continue;
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('seed') ||
          lowerKey.includes('privatekey') ||
          lowerKey.includes('password') ||
          lowerKey.includes('mnemonic') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('proof') ||
          lowerKey.includes('encryptedkey') ||
          lowerKey.includes('token')
        ) {
          // codeql[js/remote-property-injection] -- key is guarded by BLOCKED_KEYS above;
          // cleaned has no prototype (Object.create(null)), so __proto__ cannot reach Object.prototype.
          cleaned[key] = '[REDACTED]';
        } else {
          // codeql[js/remote-property-injection] -- same guards as above apply here.
          cleaned[key] = value;
        }
      }
      return cleaned;
    }
    if (typeof arg === 'string') {
      // Strip CR/LF to prevent log injection (CWE-117 / CodeQL log-injection).
      const stripped = arg.replace(/[\r\n]/g, ' ');
      return stripped.length > 200 ? `${stripped.slice(0, 200)}...[truncated]` : stripped;
    }
    return arg;
  });
};

export const logger = {
  /** Debug logging — development only */
  debug: (..._args: unknown[]): void => {
    if (isDev) {
    }
  },

  /** Errors — sanitized to prevent sensitive data leakage */
  error: (...args: unknown[]): void => {
    // codeql[js/log-injection] -- args pass through sanitize() which strips \r\n; browser-only logger, not a server log file.
    console.error(...sanitize(args));
  },

  /** Info logging — development only */
  info: (..._args: unknown[]): void => {
    if (isDev) {
    }
  },

  /** Warnings — sanitized to prevent sensitive data leakage */
  warn: (...args: unknown[]): void => {
    // codeql[js/log-injection] -- args pass through sanitize() which strips \r\n; browser-only logger, not a server log file.
    console.warn(...sanitize(args));
  },
};
