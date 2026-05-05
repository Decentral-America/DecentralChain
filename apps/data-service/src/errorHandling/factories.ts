import { type CurriedFunction2, type CurriedFunction3, curryN } from 'ramda';
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

export const toAppError: CurriedFunction3<ErrorType, ErrorMetaInfo, Error, AppError> = curryN(
  3,
  (type: ErrorType, meta: ErrorMetaInfo, err: Error) => AppError[type](err, meta),
);

export const toInitError: CurriedFunction2<ErrorMetaInfo, Error, InitError> = toAppError(
  'Init',
) as any;

export const toResolverError: CurriedFunction2<ErrorMetaInfo, Error, ResolverError> = toAppError(
  'Resolver',
) as any;

export const toDbError: CurriedFunction2<ErrorMetaInfo, Error, DbError> = toAppError('Db') as any;

export const toValidationError: CurriedFunction2<ErrorMetaInfo, Error, ValidationError> =
  toAppError('Validation') as any;

export const toParseError: CurriedFunction2<ErrorMetaInfo, Error, ParseError> = toAppError(
  'Parse',
) as any;

export const toTimeout: CurriedFunction2<ErrorMetaInfo, Error, Timeout> = toAppError(
  'Timeout',
) as any;
