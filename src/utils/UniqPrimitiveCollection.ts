/**
 * A collection of unique primitive values (strings, numbers, or symbols).
 * Used for efficient origin and channel ID filtering.
 */
export class UniqPrimitiveCollection<T extends string | number | symbol> {
  public size = 0;
  private readonly hash: Record<string | number | symbol, boolean> = Object.create(null) as Record<
    string | number | symbol,
    boolean
  >;

  constructor(list?: T[]) {
    if (list) {
      list.forEach((item) => this.add(item));
    }
  }

  public add(item: T): this {
    this.hash[item] = true;
    this.size = Object.keys(this.hash).length;
    return this;
  }

  public has(key: T): boolean {
    return key in this.hash;
  }

  public toArray(): T[] {
    return Object.keys(this.hash) as T[];
  }
}
