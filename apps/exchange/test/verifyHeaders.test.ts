/**
 * The exchange ships on Cloudflare Pages, so `public/_headers` (copied verbatim
 * into dist/) is the only security-header policy that reaches users — the
 * nginx configs in this app are never in that path. These tests hold that file,
 * and the checker the deploy runs against the real dist/_headers, to the policy.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkBundleOrigins,
  checkHeaders,
  parseCsp,
  parseHeadersFile,
  requiredOriginsFor,
  scanBundleOrigins,
  sourceAllows,
  withNoindexHeader,
} from '../scripts/verifyHeaders.js';

const HEADERS = readFileSync(path.resolve(import.meta.dirname, '../public/_headers'), 'utf8');
const PRE_FIX = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Cache-Control: no-cache, no-store, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;

describe('public/_headers', () => {
  it('passes every check for a mainnet build', () => {
    expect(
      checkHeaders(HEADERS, { network: 'mainnet', requiredOrigins: requiredOriginsFor('mainnet') }),
    ).toEqual([]);
  });

  it('passes every check for a testnet build once the noindex header is added', () => {
    expect(
      checkHeaders(withNoindexHeader(HEADERS), {
        network: 'testnet',
        requiredOrigins: requiredOriginsFor('testnet'),
      }),
    ).toEqual([]);
  });

  it('requires the noindex rule on testnet builds', () => {
    expect(checkHeaders(HEADERS, { network: 'testnet' })).toContain(
      'testnet build must send X-Robots-Tag: noindex',
    );
  });
});

describe('checkHeaders', () => {
  it('rejects the file that shipped before the fix', () => {
    const problems = checkHeaders(PRE_FIX, { network: 'mainnet' });
    expect(problems).toContain('/* has no Content-Security-Policy');
    expect(problems).toContain('/* X-Frame-Options must be DENY');
    expect(problems).toContain('HSTS max-age 0 is below one year');
    expect(problems).toContain(
      '/* must not set Cache-Control: Cloudflare merges it into /assets/* and breaks immutable caching',
    );
  });

  it("rejects script-src 'unsafe-inline' and a missing frame-ancestors", () => {
    const file = `/*\n  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'\n`;
    const problems = checkHeaders(file, { network: 'mainnet' });
    expect(problems).toContain("CSP script-src must not allow 'unsafe-inline'");
    expect(problems).toContain('CSP frame-ancestors is "", expected "\'none\'"');
  });

  it('rejects a connect-src that does not cover a configured service', () => {
    const file = `/*\n  Content-Security-Policy: connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'\n`;
    expect(
      checkHeaders(file, {
        network: 'mainnet',
        requiredOrigins: ['https://testnet-matcher.decentralchain.io'],
      }),
    ).toContain('CSP connect-src does not allow https://testnet-matcher.decentralchain.io');
  });
});

describe('withNoindexHeader', () => {
  it('adds the header inside the single /* rule, not as a second /* rule', () => {
    const out = withNoindexHeader(HEADERS);
    expect(out.split('\n').filter((line) => line.trim() === '/*')).toHaveLength(1);
    const rules = parseHeadersFile(out);
    expect(rules.find((rule) => rule.pattern === '/*')?.headers).toContainEqual({
      name: 'x-robots-tag',
      value: 'noindex, nofollow',
    });
    expect(rules.find((rule) => rule.pattern === '/assets/*')?.headers).toEqual([
      { name: 'cache-control', value: 'public, max-age=31536000, immutable' },
    ]);
  });

  it('refuses a _headers file with no /* rule', () => {
    expect(() => withNoindexHeader('/assets/*\n  A: b\n')).toThrow('no /* rule');
  });
});

describe('parsing helpers', () => {
  it('parses patterns, headers and detach lines', () => {
    const rules = parseHeadersFile('# c\n/a/*\n  X-One: 1\n  ! X-Two\n');
    expect(rules).toEqual([
      {
        headers: [
          { name: 'x-one', value: '1' },
          { name: 'x-two', value: null },
        ],
        pattern: '/a/*',
      },
    ]);
  });

  it('splits CSP directives', () => {
    expect(
      parseCsp("default-src 'self'; connect-src 'self' https://a.b").get('connect-src'),
    ).toEqual(["'self'", 'https://a.b']);
  });

  it('matches wildcard and exact sources by scheme and host', () => {
    expect(
      sourceAllows('https://*.decentralchain.io', 'https://testnet-node.decentralchain.io'),
    ).toBe(true);
    expect(sourceAllows('wss://*.decentralchain.io', 'wss://testnet-ws.decentralchain.io/ws')).toBe(
      true,
    );
    expect(sourceAllows('https://*.decentralchain.io', 'https://decentralchain.io.evil.test')).toBe(
      false,
    );
    expect(sourceAllows('https://*.decentralchain.io', 'wss://testnet-ws.decentralchain.io')).toBe(
      false,
    );
  });
});

describe('bundle origins', () => {
  const csp = HEADERS;
  const distWith = (files: Record<string, string>): string => {
    const dir = mkdtempSync(path.join(tmpdir(), 'verify-headers-'));
    mkdirSync(path.join(dir, 'assets'));
    for (const [name, body] of Object.entries(files)) writeFileSync(path.join(dir, name), body);
    return dir;
  };

  it('finds absolute http(s)/ws(s) origins in js, html and css but not in source maps', () => {
    const dir = distWith({
      'assets/a.js':
        'fetch(`https://testnet-node.decentralchain.io/blocks`);new WebSocket("wss://x.decentralchain.io/ws")',
      'assets/a.js.map': '"https://only-in-a-map.example"',
      'assets/b.css': 'a{background:url(https://cdn.jsdelivr.net/x.png)}',
      'index.html': '<a href="https://github.com/x">x</a>',
    });
    expect(scanBundleOrigins(dir)).toEqual([
      'https://cdn.jsdelivr.net',
      'https://github.com',
      'https://testnet-node.decentralchain.io',
      'wss://x.decentralchain.io',
    ]);
  });

  it('reports the host of a URL with credentials, not the credentials', () => {
    const dir = distWith({ 'assets/a.js': '"https://abc123@o1.ingest.de.sentry.io/42"' });
    expect(scanBundleOrigins(dir)).toEqual(['https://o1.ingest.de.sentry.io']);
  });

  it('accepts origins that connect-src covers and documented non-fetch references', () => {
    expect(
      checkBundleOrigins(csp, [
        'https://testnet-node.decentralchain.io',
        'wss://testnet-ws.decentralchain.io',
        'https://o1.ingest.de.sentry.io',
        'http://www.w3.org',
        'https://github.com',
      ]),
    ).toEqual([]);
  });

  it('fails on an origin the CSP would block', () => {
    expect(checkBundleOrigins(csp, ['https://tracker.example.com'])).toEqual([
      'bundle references https://tracker.example.com, which is not in CSP connect-src or frame-src',
    ]);
  });

  it('fails a built dist whose bundle calls an origin missing from the _headers CSP', () => {
    const dir = distWith({ 'assets/a.js': 'fetch("https://new-backend.example.org/api")' });
    writeFileSync(path.join(dir, '_headers'), HEADERS);
    expect(
      checkHeaders(HEADERS, {
        bundleOrigins: scanBundleOrigins(dir),
        network: 'mainnet',
      }),
    ).toContain(
      'bundle references https://new-backend.example.org, which is not in CSP connect-src or frame-src',
    );
  });
});
