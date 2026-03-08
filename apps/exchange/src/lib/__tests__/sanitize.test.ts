/**
 * Security Test Suite: sanitize
 *
 * Tests input sanitization utilities that prevent XSS attacks,
 * injection vulnerabilities, and path traversal.
 */
import { describe, expect, it } from 'vitest';
import {
  sanitizeAddress,
  sanitizeFilename,
  sanitizeHtml,
  sanitizeText,
  sanitizeTransactionAmount,
  sanitizeUrl,
} from '@/lib/sanitize';

describe('sanitizeText', () => {
  it('escapes HTML entities', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).not.toContain('<script>');
    expect(sanitizeText('<script>alert("xss")</script>')).toContain('&lt;script&gt;');
  });

  it('escapes ampersands', () => {
    expect(sanitizeText('a & b')).toBe('a &amp; b');
  });

  it('escapes quotes', () => {
    expect(sanitizeText('"hello"')).toContain('&quot;');
    expect(sanitizeText("'hello'")).toContain('&#x27;');
  });

  it('returns empty string for falsy input', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText(null as unknown as string)).toBe('');
    expect(sanitizeText(undefined as unknown as string)).toBe('');
  });

  it('handles normal text without modification (no special chars)', () => {
    expect(sanitizeText('hello world 123')).toBe('hello world 123');
  });
});

describe('sanitizeHtml', () => {
  it('removes script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script');
    expect(result).toContain('<p>Hello</p>');
  });

  it('removes iframe tags', () => {
    const input = '<div>Safe</div><iframe src="evil.com"></iframe>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<iframe');
  });

  it('removes event handler attributes', () => {
    const input = '<img src="pic.jpg" onerror="alert(1)" />';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onerror');
  });

  it('removes javascript: URLs from href', () => {
    const input = '<a href="javascript:alert(1)">Click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
  });

  it('returns empty for falsy input', () => {
    expect(sanitizeHtml('')).toBe('');
  });
});

describe('sanitizeUrl', () => {
  it('allows https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
  });

  it('allows http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('rejects javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('rejects data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('rejects file: protocol', () => {
    expect(sanitizeUrl('file:///etc/passwd')).toBe('');
  });

  it('returns empty for invalid URLs', () => {
    expect(sanitizeUrl('not a url')).toBe('');
  });

  it('returns empty for empty input', () => {
    expect(sanitizeUrl('')).toBe('');
  });
});

describe('sanitizeFilename', () => {
  it('removes path separators', () => {
    expect(sanitizeFilename('../../../etc/passwd')).not.toContain('/');
    expect(sanitizeFilename('..\\..\\windows\\system32')).not.toContain('\\');
  });

  it('removes null bytes', () => {
    expect(sanitizeFilename('file\0name.txt')).toBe('filename.txt');
  });

  it('removes leading dots (hidden files)', () => {
    expect(sanitizeFilename('.htaccess')).toBe('htaccess');
  });

  it('limits length to 255', () => {
    const longName = `${'a'.repeat(300)}.txt`;
    expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(255);
  });

  it('returns empty for empty input', () => {
    expect(sanitizeFilename('')).toBe('');
  });
});

describe('sanitizeTransactionAmount', () => {
  it('accepts valid positive amounts', () => {
    expect(sanitizeTransactionAmount('100.5')).toBe('100.5');
  });

  it('rejects negative amounts', () => {
    expect(sanitizeTransactionAmount('-100')).toBeNull();
  });

  it('rejects zero amounts', () => {
    expect(sanitizeTransactionAmount('0')).toBeNull();
  });

  it('rejects non-numeric strings', () => {
    expect(sanitizeTransactionAmount('not a number')).toBeNull();
  });

  it('rejects Infinity', () => {
    expect(sanitizeTransactionAmount('Infinity')).toBeNull();
  });

  it('handles very large numbers', () => {
    expect(sanitizeTransactionAmount('999999999999')).toBe('999999999999');
  });
});

describe('sanitizeAddress', () => {
  it('accepts valid base58 addresses', () => {
    // Typical DCC address (35 chars, base58)
    const addr = '3P8pGyzZL9AUuFs9YRYPDV3vm73T48ptZxs';
    expect(sanitizeAddress(addr)).toBe(addr);
  });

  it('rejects addresses with special characters', () => {
    expect(sanitizeAddress('<script>alert(1)</script>')).toBe('');
  });

  it('returns empty for empty input', () => {
    expect(sanitizeAddress('')).toBe('');
  });
});
