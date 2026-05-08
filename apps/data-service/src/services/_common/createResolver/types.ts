import { type Effect, type Either, type Option } from 'effect';
import {
  type DbError,
  type ResolverError,
  type Timeout,
  type ValidationError,
} from '../../../errorHandling';
import { type SearchedItems } from '../../../types';

export type EmitEvent = (name: string) => <A>(object: A) => void;

export type ValidateSync<Error, Value> = (value: Value) => Either.Either<Value, Error>;

type CommonResolverDependencies<ReqRaw, ReqTransformed, ResRaw> = {
  transformInput: (r: ReqRaw) => Either.Either<ReqTransformed, ValidationError>;
  validateResult: ValidateSync<ResolverError, ResRaw>;
  emitEvent: EmitEvent;
};

export type GetResolverDependencies<ReqRaw, ReqTransformed, ResRaw, ResTransformed> =
  CommonResolverDependencies<ReqRaw, ReqTransformed, ResRaw> & {
    getData: (r: ReqTransformed) => Effect.Effect<Option.Option<ResRaw>, DbError | Timeout>;
    transformResult: (
      result: Option.Option<ResRaw>,
      request: ReqRaw,
    ) => Option.Option<ResTransformed>;
  };

export type MgetResolverDependencies<ReqRaw, ReqTransformed, ResRaw, ResTransformed> =
  CommonResolverDependencies<ReqRaw, ReqTransformed, ResRaw> & {
    getData: (r: ReqTransformed) => Effect.Effect<Option.Option<ResRaw>[], DbError | Timeout>;
    transformResult: (
      result: Option.Option<ResRaw>[],
      request: ReqRaw,
    ) => Option.Option<ResTransformed>[];
  };

export type SearchResolverDependencies<ReqRaw, ReqTransformed, ResRaw, ResTransformed> =
  CommonResolverDependencies<ReqRaw, ReqTransformed, ResRaw> & {
    getData: (r: ReqTransformed) => Effect.Effect<ResRaw[], DbError | Timeout>;
    transformResult: (results: ResRaw[], request: ReqRaw) => SearchedItems<ResTransformed>;
  };
