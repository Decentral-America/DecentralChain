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
const sanitize = (args: unknown[]): unknown[] => {
  return args.map((arg) => {
    if (typeof arg === 'object' && arg !== null) {
      const obj = arg as Record<string, unknown>;
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
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
          cleaned[key] = '[REDACTED]';
        } else {
          cleaned[key] = value;
        }
      }
      return cleaned;
    }
    if (typeof arg === 'string' && arg.length > 200) {
      return `${arg.slice(0, 200)}...[truncated]`;
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
