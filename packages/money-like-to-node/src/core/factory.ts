export const factory =
  <T, R extends object>(transform: {
    [Key in keyof R]: (data: T) => R[Key];
  }) =>
  (data: T): R => {
    const errors: { message: string; path: string }[] = [];
    const result = Object.entries(transform).reduce<R>(
      (acc, [name, transformer]) => {
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
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- Object.create(null) returns any
      Object.create(null),
    );

    if (errors.length) {
      throw new Error(`Errors: ${JSON.stringify(errors, null, 4)}`);
    }

    return result;
  };
