/**
 * Every malformed shape must degrade to empty rather than throw. This layer is
 * purely additive: if it fails, every asset shows its monogram and the app is
 * still fully usable.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_MANIFEST, parseManifest } from '../manifest';

const ID = '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS';

describe('parseManifest', () => {
  it('reads a well-formed manifest', () => {
    const parsed = parseManifest({
      hot: { [ID]: 'data:image/webp;base64,AAAA' },
      sha: 'a1b2c3d',
    });
    expect(parsed.sha).toBe('a1b2c3d');
    expect(parsed.hot[ID]).toBe('data:image/webp;base64,AAAA');
  });

  it.each([
    ['null', null],
    ['a string', 'nope'],
    ['an array', []],
    ['a missing sha', { hot: {} }],
    ['a non-object hot', { hot: 'nope', sha: 'a1b2c3d' }],
    ['a numeric sha', { hot: {}, sha: 7 }],
  ])('degrades %s to the empty manifest', (_label, raw) => {
    expect(parseManifest(raw)).toEqual(EMPTY_MANIFEST);
  });

  it('drops hot entries whose asset id is invalid', () => {
    const parsed = parseManifest({
      hot: { '../../evil': 'data:image/webp;base64,AAAA', [ID]: 'data:image/webp;base64,BBBB' },
      sha: 'a1b2c3d',
    });
    expect(Object.keys(parsed.hot)).toEqual([ID]);
  });

  it('drops hot entries that are not data uris, so a url cannot be smuggled in', () => {
    const parsed = parseManifest({
      hot: { [ID]: 'https://evil.example/track.gif' },
      sha: 'a1b2c3d',
    });
    expect(parsed.hot).toEqual({});
  });

  /**
   * `useTokenLogo` reads `manifest.hot[assetId]` and falls through with `??`.
   * On a plain object literal that lookup inherits: `hot['toString']` is
   * `Function.prototype.toString`, which is not nullish, so `??` does not fall
   * through and the hook would hand a *function* to the `<img>`'s `src`.
   *
   * Unreachable today — no prototype member's name is 32-44 base58 characters
   * — but the hook delegates every id check to `logoUrlFor` and does nothing
   * itself, so it would not catch one that was. A null-prototype `hot` makes
   * the lookup return `undefined` for anything that was not put there.
   */
  it.each([
    'toString',
    'constructor',
    'valueOf',
    'hasOwnProperty',
    '__proto__',
  ])('returns undefined for the inherited key %s rather than a prototype member', (key) => {
    const parsed = parseManifest({ hot: { [ID]: 'data:image/webp;base64,AAAA' }, sha: 'a1b2c3d' });
    expect(parsed.hot[key]).toBeUndefined();
    expect(EMPTY_MANIFEST.hot[key]).toBeUndefined();
  });
});
