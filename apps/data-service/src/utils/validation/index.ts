import { Either, ParseResult, pipe, Schema } from 'effect';

export * from './schema';

/**
 * Validates `value` against `schema` without coercion.
 * Returns `Either.right(value)` on success or `Either.left(errorFactory(...))` on failure.
 */
export const validate = <ErrorType, T>(
  schema: any,
  errorFactory: (message: string, value: unknown) => ErrorType,
  value: unknown,
): Either.Either<T, ErrorType> =>
  pipe(
    Schema.validateEither(schema)(value),
    Either.mapLeft((parseError) =>
      errorFactory(ParseResult.TreeFormatter.formatErrorSync(parseError), value),
    ),
  ) as Either.Either<T, ErrorType>;
