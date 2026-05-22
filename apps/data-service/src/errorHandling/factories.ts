import {
  AppError,
  type DbError,
  type ErrorMetaInfo,
  type ErrorType,
  type InitError,
  type ParseError,
  type ResolverError,
  type Timeout,
  type ValidationError,
} from './AppError';

/**
 * Three-stage curried factory — used by `addMeta` for re-wrapping errors:
 *   toAppError(e.type)(meta)(e.error)
 */
export const toAppError =
  (type: ErrorType) =>
  (meta: ErrorMetaInfo) =>
  (err: Error): AppError =>
    AppError[type](err, meta);

export const toInitError = (meta: ErrorMetaInfo, err: Error): InitError => AppError.Init(err, meta);

export const toResolverError = (meta: ErrorMetaInfo, err: Error): ResolverError =>
  AppError.Resolver(err, meta);

export const toDbError = (meta: ErrorMetaInfo, err: Error): DbError => AppError.Db(err, meta);

export const toValidationError = (meta: ErrorMetaInfo, err: Error): ValidationError =>
  AppError.Validation(err, meta);

export const toParseError = (meta: ErrorMetaInfo, err: Error): ParseError =>
  AppError.Parse(err, meta);

export const toTimeout = (meta: ErrorMetaInfo, err: Error): Timeout => AppError.Timeout(err, meta);
