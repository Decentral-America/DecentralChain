import {
  deepAssign,
  entries,
  filter,
  head,
  indexBy,
  isObject,
  keys,
  map,
  pathSegment,
  pipe,
  prop,
  switchTransactionByType,
  toArray,
  uniq,
  values,
  wait,
} from '../../src/tools/utils';

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

describe('wait – async delay', () => {
  it('resolves after the specified time', async () => {
    const start = Date.now();
    await wait(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});

describe('prop – property accessor factory', () => {
  it('returns a function that extracts the named property', () => {
    const getName = prop<{ name: string; age: number }, 'name'>('name');
    expect(getName({ age: 30, name: 'Alice' })).toBe('Alice');
  });
});

describe('keys / entries / values – typed object utilities', () => {
  const obj = { a: 1, b: 2, c: 3 } as const;

  it('keys returns all object keys', () => {
    expect(keys(obj)).toEqual(['a', 'b', 'c']);
  });

  it('entries returns [key, value] pairs', () => {
    expect(entries(obj)).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]);
  });

  it('values returns all object values', () => {
    expect(values(obj)).toEqual([1, 2, 3]);
  });
});

describe('map – curried array map', () => {
  it('returns a function that maps over an array', () => {
    const double = map<number, number>((n) => n * 2);
    expect(double([1, 2, 3])).toEqual([2, 4, 6]);
  });

  it('passes index to the mapper', () => {
    const withIndex = map<string, string>((s, i) => `${i}:${s}`);
    expect(withIndex(['a', 'b'])).toEqual(['0:a', '1:b']);
  });
});

describe('filter – curried array filter', () => {
  it('returns a function that filters an array', () => {
    const evens = filter<number>((n) => n % 2 === 0);
    expect(evens([1, 2, 3, 4, 5])).toEqual([2, 4]);
  });

  it('passes index to the predicate', () => {
    const oddIndex = filter<string>((_s, i) => i % 2 !== 0);
    expect(oddIndex(['a', 'b', 'c', 'd'])).toEqual(['b', 'd']);
  });
});

describe('indexBy – index array into record', () => {
  it('creates a record keyed by the extractor', () => {
    const items = [
      { id: 1, name: 'one' },
      { id: 2, name: 'two' },
    ];
    const result = indexBy((item: (typeof items)[number]) => item.id, items);
    expect(result).toEqual({
      1: { id: 1, name: 'one' },
      2: { id: 2, name: 'two' },
    });
  });

  it('last item wins on key collision', () => {
    const items = [
      { k: 'a', v: 1 },
      { k: 'a', v: 2 },
    ];
    const result = indexBy((item: (typeof items)[number]) => item.k, items);
    expect(result.a?.v).toBe(2);
  });
});

describe('switchTransactionByType – dispatch by tx type', () => {
  it('calls the matching handler for the transaction type', () => {
    const sw = switchTransactionByType({
      3: (tx) => `issue:${String(tx.name)}`,
      4: (tx) => `transfer:${String(tx.amount)}`,
    });

    const issueTx = { name: 'MyToken', type: 3 as const } as never;
    expect(sw(issueTx)).toBe('issue:MyToken');
  });

  it('returns undefined for unhandled types', () => {
    const sw = switchTransactionByType({
      3: () => 'handled',
    });

    const leaseTx = { type: 8 as const } as never;
    expect(sw(leaseTx)).toBeUndefined();
  });
});

describe('pipe – function composition', () => {
  it('composes two functions left-to-right', () => {
    const addOne = (n: number) => n + 1;
    const double = (n: number) => n * 2;
    const composed = pipe(addOne, double);
    expect(composed(3)).toBe(8); // (3+1)*2
  });

  it('composes three functions left-to-right', () => {
    const numberToString = (n: number) => String(n);
    const exclaim = (s: string) => `${s}!`;
    const wrap = (s: string) => `[${s}]`;
    const composed = pipe(numberToString, exclaim, wrap);
    expect(composed(42)).toBe('[42!]');
  });
});
