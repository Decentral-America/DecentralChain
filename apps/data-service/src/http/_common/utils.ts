import { type IncomingHttpHeaders } from 'node:http';
import { Either } from 'effect';
import { type Context } from 'koa';
import { ParseError } from '../../errorHandling';
import { type WithMatcher } from '../../services/_common';
import { MoneyFormat } from '../../services/types';
import { stringify } from '../../utils/json';
import { LSNFormat } from '../types';
import { type HttpResponse } from './types';

export const defaultStringify = stringify(LSNFormat.String);

export const setHttpResponse = (ctx: Context) => (httpResponse: HttpResponse) => {
  ctx.body = httpResponse.body;
  ctx.status = httpResponse.status;

  if (httpResponse.headers) {
    ctx.set(httpResponse.headers);
  }
};

export const LSN_FORMAT_KEY = 'large-significand-format';
export const DEFAULT_LSN_FORMAT = LSNFormat.Number;

export const MONEY_FORMAT_KEY = 'money-format';
export const DEFAULT_MONEY_FORMAT = MoneyFormat.Float;

export const parseLSNFormat = (
  httpHeaders: IncomingHttpHeaders,
): Either.Either<LSNFormat, ParseError> => {
  const acceptHeader = httpHeaders.accept;

  if (typeof acceptHeader === 'string' && acceptHeader.includes(LSN_FORMAT_KEY)) {
    // lsn format param assuredly is string
    const lsnFormatParam = acceptHeader
      .split(';')
      .map((param) => param.trim())
      .find((param) => param.startsWith(LSN_FORMAT_KEY)) as string;
    const lsnFormat = lsnFormatParam.substr(
      LSN_FORMAT_KEY.length + 1, // + 1 cause the equal sign
    ) as LSNFormat;

    if (![LSNFormat.Number, LSNFormat.String].includes(lsnFormat)) {
      return Either.left(new ParseError(new Error('Invalid Large significand format')));
    } else {
      return Either.right(lsnFormat);
    }
  } else {
    return Either.right(DEFAULT_LSN_FORMAT);
  }
};

export const contentTypeWithLSN = (
  lsnFormat: LSNFormat,
  contentType: string = 'application/json; charset=utf-8',
) =>
  `${contentType}${
    lsnFormat === LSNFormat.String ? `; ${LSN_FORMAT_KEY}=${LSNFormat.String}` : ''
  }`;

export const parseMoneyFormat = (
  httpHeaders: IncomingHttpHeaders,
): Either.Either<MoneyFormat, ParseError> => {
  const acceptHeader = httpHeaders.accept;

  if (typeof acceptHeader === 'string' && acceptHeader.includes(MONEY_FORMAT_KEY)) {
    // money format param assuredly is string
    const moneyFormatParam = acceptHeader
      .split(';')
      .map((param) => param.trim())
      .find((param) => param.startsWith(MONEY_FORMAT_KEY)) as string;

    const moneyFormat = moneyFormatParam.substr(
      MONEY_FORMAT_KEY.length + 1, // + 1 cause the equal sign
    ) as MoneyFormat;

    if (![MoneyFormat.Float, MoneyFormat.Long].includes(moneyFormat)) {
      return Either.left(new ParseError(new Error('Invalid Money Format')));
    } else {
      return Either.right(moneyFormat);
    }
  } else {
    return Either.right(DEFAULT_MONEY_FORMAT);
  }
};

export const contentTypeWithMoneyFormat = (
  moneyFormat: MoneyFormat,
  contentType: string = 'application/json; charset=utf-8',
) =>
  `${contentType}${
    moneyFormat === MoneyFormat.Long ? `; ${MONEY_FORMAT_KEY}=${MoneyFormat.Long}` : ''
  }`;

export const withMatcher = (req: any): req is WithMatcher =>
  'matcher' in req && typeof req.matcher === 'string';
