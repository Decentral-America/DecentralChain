import { HttpMethods, type ILibRequest } from './types';
import { createQS } from './utils';

export const createRequest = (methodUrl: string, params?: object): ILibRequest => {
  const URL_MAX_LENGTH = 2000;

  if (typeof methodUrl !== 'string' || methodUrl.trim().length === 0) {
    throw new Error('createRequest: methodUrl must be a non-empty string');
  }

  if (typeof params === 'undefined') {
    return { method: HttpMethods.Get, url: methodUrl };
  }
  const getUrl = `${methodUrl}${createQS(params)}`;
  return getUrl.length > URL_MAX_LENGTH
    ? {
        body: JSON.stringify(params),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        method: HttpMethods.Post,
        url: methodUrl,
      }
    : { method: HttpMethods.Get, url: getUrl };
};
