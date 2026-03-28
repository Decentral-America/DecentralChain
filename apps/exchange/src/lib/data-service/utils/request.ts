import { isEmpty } from 'ts-utils';
import { get, parse } from '../config';
import { normalizeUrl } from './utils';

export function request<T>(params: IRequestParams<T>): Promise<T> {
  let promise: Promise<T>;
  if (params.url) {
    params.fetchOptions = addDefaultRequestParams(params.url, params.fetchOptions);
    promise = fetch(
      normalizeUrl(params.url),
      params.fetchOptions ?? (Object.create(null) as RequestInit),
    ).then(async (response) => {
      const isJSON = response.headers
        .get('Content-Type')
        .toLowerCase()
        .includes('application/json');
      if (response.ok) {
        const data = await response.text();
        return isJSON ? parse(data) : data;
      } else {
        const error = tryParseError(await response.text());
        if (response.status >= 500 && response.status <= 599) {
          if (typeof error === 'object' && error.message) {
            return Promise.reject(error);
          } else {
            return Promise.reject(
              new Error(`An unexpected error has occurred: #${response.status}`),
            );
          }
        } else {
          return Promise.reject(error);
        }
      }
    });
  } else if (params.method) {
    promise = params.method();
  } else {
    throw new Error('Wrong request params!');
  }

  return promise;
}

function tryParseError(error: string): string | object {
  try {
    return JSON.parse(error);
  } catch {
    return error;
  }
}

function addDefaultRequestParams(
  url: string,
  options: IFetchOptions = Object.create(null),
): IFetchOptions {
  if (url.indexOf(get('node')) === 0 && isEmpty(options.credentials)) {
    options.credentials = 'include';
  }
  return options;
}

export interface IRequestParams<T> {
  url?: string;
  data?: object;
  method?: () => Promise<T>;
  fetchOptions?: IFetchOptions;
}

declare const fetch: (url: string, options?: IFetchOptions) => Promise<Response>;

export interface IFetchOptions {
  method?: 'POST' | 'GET';
  headers?: object;
  credentials?: string;
  body?: string;
}
