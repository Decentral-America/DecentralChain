/**
 * Asset IDs are interpolated into a CDN path. An unvalidated ID escapes it —
 * `../../` walks out of the repo — so validation here is a security boundary,
 * not a formatting nicety.
 */
import { describe, expect, it } from 'vitest';
import { isValidAssetId, logoUrlFor, manifestUrl } from '../url';

const REPO = 'Decentral-America/token-logos';
const SHA = 'a1b2c3d';
const ID = '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS';

describe('isValidAssetId', () => {
  it('accepts a real base58 asset id', () => {
    expect(isValidAssetId(ID)).toBe(true);
  });

  it.each([
    ['path traversal', '../../etc/passwd'],
    ['a slash', 'abc/def'],
    ['empty', ''],
    ['too short', 'abc'],
    ['the digit zero', '0'.repeat(32)],
    ['capital O', 'O'.repeat(32)],
    ['capital I', 'I'.repeat(32)],
    ['lowercase l', 'l'.repeat(32)],
    ['a query string', `${ID}?x=1`],
  ])('rejects %s', (_label, bad) => {
    expect(isValidAssetId(bad)).toBe(false);
  });
});

describe('manifestUrl', () => {
  it('pins the manifest to @latest so merges go live without a redeploy', () => {
    expect(manifestUrl(REPO)).toBe(
      'https://cdn.jsdelivr.net/gh/Decentral-America/token-logos@latest/manifest.json',
    );
  });
});

describe('logoUrlFor', () => {
  it('pins a tail logo to the commit sha so it caches immutably', () => {
    expect(logoUrlFor(REPO, SHA, ID)).toBe(
      `https://cdn.jsdelivr.net/gh/Decentral-America/token-logos@${SHA}/assets/${ID}/128.webp`,
    );
  });

  it('returns null for an invalid asset id rather than building a traversal url', () => {
    expect(logoUrlFor(REPO, SHA, '../../evil')).toBeNull();
  });

  it('returns null when the sha is missing, since an unpinned url is not cacheable', () => {
    expect(logoUrlFor(REPO, '', ID)).toBeNull();
  });
});
