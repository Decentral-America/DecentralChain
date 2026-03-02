import { uniq, deepAssign, toArray, head, isObject, pathSegment } from '../../src/tools/utils';

describe('pathSegment – URL path traversal prevention', () => {
  it('encodes forward slashes to prevent path traversal', () => {
    const result = pathSegment('foo/../../admin');
    expect(result).not.toContain('/');
    expect(result).toBe('foo%2F..%2F..%2Fadmin');
  });

  it('encodes query and fragment delimiters', () => {
    expect(pathSegment('id?key=val')).toBe('id%3Fkey%3Dval');
    expect(pathSegment('id#frag')).toBe('id%23frag');
  });

  it('passes through safe base58 characters unchanged', () => {
    const base58Addr = '3P274YB5qsa3e3WSzXJGStpRFod5';
    expect(pathSegment(base58Addr)).toBe(base58Addr);
  });

  it('converts numbers to strings', () => {
    expect(pathSegment(42)).toBe('42');
  });
});

describe('uniq – deduplication with null preservation', () => {
  it('removes duplicate strings', () => {
    expect(uniq(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('preserves null values (native DCC token asset ID)', () => {
    const result = uniq(['abc', null, 'def', null]);
    expect(result).toContain(null);
    // Only one null
    expect(result.filter((x) => x === null)).toHaveLength(1);
  });

  it('handles empty array', () => {
    expect(uniq([])).toEqual([]);
  });

  it('handles array with only nulls', () => {
    const result = uniq([null, null]);
    expect(result).toEqual([null]);
  });

  it('handles array with no nulls', () => {
    const result = uniq(['a', 'b', 'b']);
    expect(result).toEqual(['a', 'b']);
    expect(result).not.toContain(null);
  });
});

describe('toArray', () => {
  it('wraps a single value in an array', () => {
    expect(toArray(5)).toEqual([5]);
  });

  it('returns an array as-is', () => {
    const arr = [1, 2, 3];
    expect(toArray(arr)).toBe(arr);
  });
});

describe('head', () => {
  it('returns the first element', () => {
    expect(head([10, 20, 30])).toBe(10);
  });

  it('returns undefined for empty arrays', () => {
    expect(head([])).toBeUndefined();
  });
});

describe('isObject', () => {
  it('returns true for plain objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
  });

  it('returns false for arrays', () => {
    expect(isObject([])).toBe(false);
  });

  it('returns false for null', () => {
    expect(isObject(null)).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isObject(42)).toBe(false);
    expect(isObject('string')).toBe(false);
  });
});

describe('deepAssign – merge behaviour', () => {
  it('merges nested objects', () => {
    const a = { x: { a: 1 } };
    const b = { x: { b: 2 } };
    const result = deepAssign({ ...a }, { ...b });
    expect(result.x).toEqual({ a: 1, b: 2 });
  });

  it('deduplicates arrays', () => {
    const result = deepAssign({ tags: ['a', 'b'] }, { tags: ['b', 'c'] });
    expect(result.tags).toEqual(['a', 'b', 'c']);
  });

  it('overwrites scalar values', () => {
    const result = deepAssign({ a: 1 }, { a: 2 });
    expect(result.a).toBe(2);
  });
});
