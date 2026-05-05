import { curryN } from 'ramda';
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

type CurryFn2<A, B, R> = ((a: A) => (b: B) => R) & ((a: A, b: B) => R);
type CurryFn3<A, B, C, R> = ((a: A) => (b: B) => (c: C) => R) &
  ((a: A, b: B) => (c: C) => R) &
  ((a: A, b: B, c: C) => R);

export const toAppError: CurryFn3<ErrorType, ErrorMetaInfo, Error, AppError> = curryN(
  3,
  (type: ErrorType, meta: ErrorMetaInfo, err: Error) => AppError[type](err, meta),
) as CurryFn3<ErrorType, ErrorMetaInfo, Error, AppError>;

export const toInitError: CurryFn2<ErrorMetaInfo, Error, InitError> = toAppError('Init') as any;

export const toResolverError: CurryFn2<ErrorMetaInfo, Error, ResolverError> = toAppError(
  'Resolver',
) as any;

export const toDbError: CurryFn2<ErrorMetaInfo, Error, DbError> = toAppError('Db') as any;

export const toValidationError: CurryFn2<ErrorMetaInfo, Error, ValidationError> = toAppError(
  'Validation',
) as any;

export const toParseError: CurryFn2<ErrorMetaInfo, Error, ParseError> = toAppError('Parse') as any;

export const toTimeout: CurryFn2<ErrorMetaInfo, Error, Timeout> = toAppError('Timeout') as any;
