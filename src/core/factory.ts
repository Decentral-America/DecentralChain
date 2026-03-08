/**
 * Build an object of type `R` from input `T` by applying a per-key transform.
 *
 * Many transaction types in `@decentralchain/ts-types` are unions of versioned
 * variants (e.g. `AliasTransaction = V1 | V2 | V3`). When `R` is such a union,
 * TypeScript distributes the mapped-type constraint across members — demanding
 * that e.g. `version` returns literal `1` for V1, `2` for V2, etc. — which no
 * single transform object can satisfy.
 *
 * To preserve type safety while supporting union output types, the transform
 * parameter accepts `Record<string, (data: T) => unknown>`. The return type
 * `(data: T) => R` ensures downstream consumers still get full type checking.
 */
export const factory =
  <T, R extends object>(transform: Record<string, (data: T) => unknown>) =>
  (data: T): R => {
    const errors: { message: string; path: string }[] = [];
    const result = Object.entries(transform).reduce<R>((acc, [name, transformer]) => {
      try {
        const value = (transformer as (data: T) => unknown)(data);
        return Object.assign(acc, { [name]: value }) as R;
      } catch (e: unknown) {
        errors.push({
          path: name,
          message: e instanceof Error ? e.message : String(e),
        });
        return acc;
      }
    }, Object.create(null));

    if (errors.length) {
      throw new Error(`Errors: ${JSON.stringify(errors, null, 4)}`);
    }

    return result;
  };
