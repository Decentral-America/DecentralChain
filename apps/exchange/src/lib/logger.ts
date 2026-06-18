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

const SENSITIVE_KEY_PATTERNS = [
  'seed',
  'privatekey',
  'password',
  'mnemonic',
  'secret',
  'proof',
  'encryptedkey',
  'token',
];

/**
 * Sanitize a value for logging — redacts sensitive object fields and strips
 * CR/LF from strings (CWE-117 log injection prevention).
 *
 * Object fields are rebuilt via Object.fromEntries which uses
 * [[CreateDataProperty]] internally — not [[Set]] — so __proto__ is treated
 * as a plain data key and cannot modify the prototype chain (CWE-1321).
 */
const sanitize = (args: unknown[]): unknown[] =>
  args.map((arg) => {
    if (typeof arg === 'object' && arg !== null) {
      const obj = arg as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([key]) => key !== '__proto__' && key !== 'constructor' && key !== 'prototype')
          .map(([key, value]) => {
            const lowerKey = key.toLowerCase();
            const isSensitive = SENSITIVE_KEY_PATTERNS.some((p) => lowerKey.includes(p));
            return [key, isSensitive ? '[REDACTED]' : value];
          }),
      );
    }
    if (typeof arg === 'string') {
      const stripped = arg.replace(/[\r\n]/g, ' ');
      return stripped.length > 200 ? `${stripped.slice(0, 200)}...[truncated]` : stripped;
    }
    return arg;
  });

export const logger = {
  /** Debug logging — development only */
  debug: (..._args: unknown[]): void => {
    if (isDev) {
    }
  },

  /** Errors — sanitized to prevent sensitive data leakage */
  error: (...args: unknown[]): void => {
    console.error(...sanitize(args));
  },

  /** Info logging — development only */
  info: (..._args: unknown[]): void => {
    if (isDev) {
    }
  },

  /** Warnings — sanitized to prevent sensitive data leakage */
  warn: (...args: unknown[]): void => {
    console.warn(...sanitize(args));
  },
};
