import { T, pipeP } from '../utils';
import { TFunction, ILibOptions, ILibRequest, TResponse } from '../types';

type TCreateMethodParams = {
  validate: TFunction<any>;
  generateRequest: TFunction<TFunction<ILibRequest>>;
  libOptions: ILibOptions;
  addPaginationToArgs?: TFunction<any>;
};

const createMethod = <T>({
  validate = T,
  generateRequest,
  libOptions,
  addPaginationToArgs,
}: TCreateMethodParams): TFunction<TResponse<T>> => {
  function method(...args) {
    return pipeP(
      validate,
      generateRequest(libOptions.rootUrl),
      ({ url, ...options }) => {
        if (typeof libOptions.fetch !== 'function') {
          return Promise.reject(
            new Error('Configuration error: fetch option must be a function')
          );
        }
        return libOptions.fetch(url, options);
      },
      (text: string) => {
        if (typeof libOptions.parse !== 'function') {
          return Promise.reject(
            new Error('Configuration error: parse option must be a function')
          );
        }
        return libOptions.parse(text);
      },
      rawData => {
        if (typeof libOptions.transform !== 'function') {
          return Promise.reject(
            new Error(
              'Configuration error: transform option must be a function'
            )
          );
        }
        return pipeP(
          libOptions.transform,
          addPagination({ method, args, addPaginationToArgs, rawData })
        )(rawData);
      }
    )(...args);
  }
  return method;
};

const addPagination = ({
  method,
  args,
  addPaginationToArgs,
  rawData,
}) => data => {
  if (!data || !addPaginationToArgs || !rawData || !rawData.lastCursor) {
    return { data };
  }
  return {
    data,
    fetchMore: count =>
      method(addPaginationToArgs({ args, cursor: rawData.lastCursor, count })),
  };
};

export { createMethod };
