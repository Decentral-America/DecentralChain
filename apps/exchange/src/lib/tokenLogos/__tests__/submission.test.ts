import { describe, expect, it } from 'vitest';
import { logoIssueUrl } from '../submission';

/** True if `value` contains a UTF-16 surrogate that isn't part of a valid pair. */
function hasLoneSurrogate(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        i++; // valid pair, skip its low surrogate
      } else {
        return true; // unpaired high surrogate
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true; // unpaired low surrogate
    }
  }
  return false;
}

const REPO = 'Decentral-America/token-logos';
const SUB = {
  assetId: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
  issuer: '3PQ6wCS3zAkDEJtvGntQZbjuLw24kxTqndr',
  name: 'Wizard Coin',
  symbol: 'WIZ',
};

describe('logoIssueUrl', () => {
  it('targets the logo repository issue form', () => {
    expect(logoIssueUrl(REPO, SUB)).toContain(
      'https://github.com/Decentral-America/token-logos/issues/new',
    );
  });

  it('carries every field the intake action needs to open the pull request', () => {
    const body = new URL(logoIssueUrl(REPO, SUB) as string).searchParams.get('body') ?? '';
    expect(body).toContain(SUB.assetId);
    expect(body).toContain(SUB.name);
    expect(body).toContain(SUB.symbol);
    expect(body).toContain(SUB.issuer);
  });

  it('labels the issue so the intake action can find it', () => {
    const url = new URL(logoIssueUrl(REPO, SUB) as string);
    expect(url.searchParams.get('labels')).toBe('logo-submission');
  });

  it('encodes a name containing characters that would break the query string', () => {
    const url = logoIssueUrl(REPO, { ...SUB, name: 'A&B #1 = "best"' }) as string;
    expect(() => new URL(url)).not.toThrow();
    expect(new URL(url).searchParams.get('title')).toContain('A&B #1 = "best"');
  });

  it('stays inside the practical url ceiling', () => {
    expect((logoIssueUrl(REPO, SUB) as string).length).toBeLessThan(2000);
  });

  it('returns null for an invalid asset id', () => {
    expect(logoIssueUrl(REPO, { ...SUB, assetId: '../../evil' })).toBeNull();
  });

  it('caps an oversized multi-byte name so the url still fits inside the practical ceiling', () => {
    // Each CJK character percent-encodes to 9 characters (3 UTF-8 bytes, %XX each), so an
    // untruncated 500-character name alone would blow well past the 2000-character ceiling.
    const url = logoIssueUrl(REPO, { ...SUB, name: '中'.repeat(500) });
    expect(url).not.toBeNull();
    expect((url as string).length).toBeLessThan(2000);
  });

  it('returns null when a field the builder does not truncate keeps the url over the ceiling', () => {
    expect(logoIssueUrl(REPO, { ...SUB, issuer: 'X'.repeat(3000) })).toBeNull();
  });

  it('truncates by code point, never splitting a surrogate pair mid-emoji', () => {
    // 15 ASCII chars + one 👍 = 17 UTF-16 code units, straddling the 16-code-unit
    // boundary a naive .slice(0, 16) would cut through, leaving a lone high
    // surrogate that URLSearchParams silently replaces with U+FFFD.
    const url = logoIssueUrl(REPO, { ...SUB, name: `${'A'.repeat(15)}👍` }) as string;
    const title = new URL(url).searchParams.get('title') ?? '';
    expect(title).not.toContain('�');
    expect(hasLoneSurrogate(title)).toBe(false);
  });
});
