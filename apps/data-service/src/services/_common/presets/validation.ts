import { type Task } from 'folktale/concurrency/task';
import { type Result } from 'folktale/result';
import { type SchemaLike } from 'joi';
import { AppError, type ResolverError, type ValidationError } from '../../../errorHandling';
import { resultToTask } from '../../../utils/fp';
import { validate } from '../../../utils/validation';

export const validateInput =
  <T>(schema: SchemaLike, name: string) =>
  (value: T): Task<ValidationError, T> =>
    resultToTask(
      validate(
        schema,
        (error, value) =>
          AppError.Validation('Input validation failed', {
            error,
            resolver: name,
            value,
          }),
        value,
      ),
    );

export const validateResult =
  <T>(schema: SchemaLike, name: string) =>
  (value: T): Result<ResolverError, T> =>
    validate(
      schema,
      (error, value) =>
        AppError.Resolver('Result validation failed', {
          error,
          resolver: name,
          value,
        }),
      value,
    );
