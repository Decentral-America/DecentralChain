/**
 * A collection of unique primitive values (strings, numbers, or symbols).
 * Uses a native Set internally for type-safe equality (no key coercion).
 */
export class UniqPrimitiveCollection<T extends string | number | symbol> {
  public get size(): number {
    return this._set.size;
  }
  private readonly _set: Set<T>;

  constructor(list?: T[]) {
    this._set = new Set(list);
  }

  public add(item: T): this {
    this._set.add(item);
    return this;
  }

  public has(key: T): boolean {
    return this._set.has(key);
  }

  public toArray(): T[] {
    return [...this._set];
  }
}
