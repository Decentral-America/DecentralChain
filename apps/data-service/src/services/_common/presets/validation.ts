import { type Effect, type Either } from 'effect';
import { AppError, type ResolverError, type ValidationError } from '../../../errorHandling';
import { eitherToEffect } from '../../../utils/fp';
import { validate } from '../../../utils/validation';

export const validateInput =
  <T>(schema: any, name: string) =>
  (value: T): Effect.Effect<T, ValidationError> =>
    eitherToEffect(
      validate(
        schema,
        (message) =>
          AppError.Validation(`Input validation failed: ${message}`, {
            error: new Error(message),
            resolver: name,
            value,
          }),
        value,
      ),
    );

export const validateResult =
  <T>(schema: any, name: string) =>
  (value: T): Either.Either<T, ResolverError> =>
    validate(
      schema,
      (message) =>
        AppError.Resolver(`Result validation failed: ${message}`, {
          error: new Error(message),
          resolver: name,
          value,
        }),
      value,
    );
