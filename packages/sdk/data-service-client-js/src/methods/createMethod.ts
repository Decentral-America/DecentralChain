import { type ILibOptions, type ILibRequest, type TFunction, type TResponse } from '../types';
import { pipeP } from '../utils';

interface TCreateMethodParams {
  validate: TFunction<unknown>;
  generateRequest: TFunction<TFunction<ILibRequest>>;
  libOptions: ILibOptions;
  addPaginationToArgs?: TFunction<unknown>;
}

const createMethod = <T>({
  validate,
  generateRequest,
  libOptions,
  addPaginationToArgs,
}: TCreateMethodParams): TFunction<TResponse<T>> => {
  function method(...args: unknown[]) {
    return pipeP(
      validate,
      generateRequest(libOptions.rootUrl),
      ({ url, ...options }) => {
        if (typeof libOptions.fetch !== 'function') {
          return Promise.reject(new Error('Configuration error: fetch option must be a function'));
        }
        return libOptions.fetch(url, options);
      },
      (text: string) => {
        if (typeof libOptions.parse !== 'function') {
          return Promise.reject(new Error('Configuration error: parse option must be a function'));
        }
        return libOptions.parse(text);
      },
      (rawData) => {
        if (typeof libOptions.transform !== 'function') {
          return Promise.reject(
            new Error('Configuration error: transform option must be a function'),
          );
        }
        return pipeP(
          libOptions.transform,
          addPagination({ addPaginationToArgs, args, method, rawData }),
        )(rawData);
      },
    )(...args);
  }
  return method as TFunction<TResponse<T>>;
};

interface PaginationContext {
  method: TFunction<unknown>;
  args: unknown[];
  addPaginationToArgs?: TFunction<unknown> | undefined;
  rawData: { lastCursor?: unknown; [key: string]: unknown };
}

const addPagination =
  ({ method, args, addPaginationToArgs, rawData }: PaginationContext) =>
  (data: unknown) => {
    if (!data || !addPaginationToArgs || !rawData?.lastCursor) {
      return { data };
    }
    return {
      data,
      fetchMore: (count: number) =>
        method(addPaginationToArgs({ args, count, cursor: rawData.lastCursor })),
    };
  };

export { createMethod };
