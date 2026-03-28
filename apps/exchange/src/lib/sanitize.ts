/**
 * Input Sanitization Utilities
 *
 * Provides comprehensive sanitization for user inputs to prevent XSS attacks,
 * injection vulnerabilities, and other security issues.
 *
 * Zero external dependencies - uses native browser APIs and string operations.
 */

/**
 * HTML Entity Map for escaping dangerous characters
 */
const HTML_ENTITIES: Record<string, string> = {
  "'": '&#x27;',
  '"': '&quot;',
  '/': '&#x2F;',
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

/**
 * Dangerous HTML tags that should be removed entirely
 */
const DANGEROUS_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'link',
  'style',
  'meta',
  'base',
  'form',
];

/**
 * Dangerous HTML attributes that can execute JavaScript
 */
const DANGEROUS_ATTRIBUTES = [
  'onclick',
  'onload',
  'onerror',
  'onmouseover',
  'onmouseout',
  'onmousemove',
  'onmouseenter',
  'onmouseleave',
  'onfocus',
  'onblur',
  'onchange',
  'onsubmit',
  'onkeydown',
  'onkeyup',
  'onkeypress',
];

/**
 * Dangerous URL protocols that can execute code
 */
const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];

/**
 * Sanitize plain text by escaping HTML entities
 * Use this for any user input that will be displayed in HTML but shouldn't contain HTML
 */
export const sanitizeText = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  return input.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
};

/**
 * Sanitize HTML content by removing dangerous tags and attributes
 * Use this when you need to allow some HTML formatting but want to prevent XSS
 */
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return '';

  let sanitized = html;

  // Remove dangerous tags with their content
  DANGEROUS_TAGS.forEach((tag) => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');

    // Also remove self-closing dangerous tags
    const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  });

  // Remove dangerous attributes
  DANGEROUS_ATTRIBUTES.forEach((attr) => {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // Remove javascript: and data: URLs from href and src attributes
  DANGEROUS_PROTOCOLS.forEach((protocol) => {
    const hrefRegex = new RegExp(`(href|src)\\s*=\\s*["']${protocol}[^"']*["']`, 'gi');
    sanitized = sanitized.replace(hrefRegex, '$1=""');
  });

  return sanitized;
};

/**
 * Sanitize and validate URL
 * Returns empty string if URL is invalid or uses dangerous protocol
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';

  // Trim whitespace
  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }

    // Return normalized URL
    return parsed.href;
  } catch {
    // If URL parsing fails, it's not a valid URL
    return '';
  }
};

/**
 * Sanitize filename to prevent path traversal attacks
 * Removes directory separators and dangerous characters
 */
export const sanitizeFilename = (filename: string): string => {
  if (!filename || typeof filename !== 'string') return '';

  return (
    filename
      // Remove path separators
      .replace(/[/\\]/g, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Trim whitespace and dots (prevents hidden files on Unix)
      .replace(/^[\s.]+|[\s.]+$/g, '')
      // Limit length to 255 characters (filesystem limit)
      .slice(0, 255)
  );
};

/**
 * Sanitize email address
 * Returns empty string if email format is invalid
 */
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';

  const trimmed = email.trim().toLowerCase();

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return '';
  }

  // Remove dangerous characters
  return trimmed.replace(/[<>"']/g, '');
};

/**
 * Sanitize numeric input
 * Returns number or default value if invalid
 */
export const sanitizeNumber = (input: string | number, defaultValue: number = 0): number => {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : defaultValue;
  }

  if (typeof input === 'string') {
    const parsed = parseFloat(input);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  return defaultValue;
};

/**
 * Sanitize integer input
 * Returns integer or default value if invalid
 */
export const sanitizeInteger = (input: string | number, defaultValue: number = 0): number => {
  if (typeof input === 'number') {
    return Number.isInteger(input) ? input : defaultValue;
  }

  if (typeof input === 'string') {
    const parsed = parseInt(input, 10);
    return Number.isInteger(parsed) ? parsed : defaultValue;
  }

  return defaultValue;
};

/**
 * Sanitize boolean input
 * Accepts various truthy/falsy string representations
 */
export const sanitizeBoolean = (
  input: string | boolean | number,
  defaultValue: boolean = false,
): boolean => {
  if (typeof input === 'boolean') return input;

  if (typeof input === 'string') {
    const lower = input.toLowerCase().trim();
    if (['true', '1', 'yes', 'on'].includes(lower)) return true;
    if (['false', '0', 'no', 'off'].includes(lower)) return false;
  }

  if (typeof input === 'number') {
    return input !== 0;
  }

  return defaultValue;
};

/**
 * Sanitize cryptocurrency address
 * Validates format and removes dangerous characters
 */
export const sanitizeAddress = (address: string): string => {
  if (!address || typeof address !== 'string') return '';

  // Trim whitespace
  const trimmed = address.trim();

  // DCC/DCC addresses are typically 35 characters starting with '3'
  // Also support alias format (alias:chain:name)
  const addressRegex = /^(3[a-zA-Z0-9]{34}|alias:[a-zA-Z]:[a-zA-Z0-9._-]+)$/;

  if (!addressRegex.test(trimmed)) {
    return '';
  }

  return trimmed;
};

/**
 * Sanitize asset ID (transaction hash, asset ID, etc.)
 * Validates base58 format used by DCC blockchain
 */
export const sanitizeAssetId = (assetId: string): string => {
  if (!assetId || typeof assetId !== 'string') return '';

  const trimmed = assetId.trim();

  // Base58 characters only, 43-44 characters typical
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{43,44}$/;

  if (!base58Regex.test(trimmed)) {
    return '';
  }

  return trimmed;
};

/**
 * Sanitize search query
 * Removes special characters that could be used for injection
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') return '';

  return (
    query
      .trim()
      // Remove SQL injection characters
      .replace(/['";]/g, '')
      // Remove regex special characters
      .replace(/[.*+?^${}()|[\]\\]/g, '')
      // Limit length to prevent DoS
      .slice(0, 200)
  );
};

/**
 * Combined sanitizer object for convenient access
 */
/**
 * Sanitize and validate a transaction amount string.
 * SECURITY: Prevents negative, zero, NaN, and Infinity amounts in financial transactions.
 * Returns the sanitized string or null if invalid.
 */
export const sanitizeTransactionAmount = (amount: string): string | null => {
  if (!amount || typeof amount !== 'string') return null;

  const trimmed = amount.trim();
  const num = Number(trimmed);

  if (Number.isNaN(num) || !Number.isFinite(num) || num <= 0) {
    return null;
  }

  return trimmed;
};

export const sanitize = {
  address: sanitizeAddress,
  assetId: sanitizeAssetId,
  boolean: sanitizeBoolean,
  email: sanitizeEmail,
  filename: sanitizeFilename,
  html: sanitizeHtml,
  integer: sanitizeInteger,
  number: sanitizeNumber,
  searchQuery: sanitizeSearchQuery,
  text: sanitizeText,
  transactionAmount: sanitizeTransactionAmount,
  url: sanitizeUrl,
};

/**
 * Default export
 */
