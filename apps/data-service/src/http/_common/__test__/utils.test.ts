import { Either } from 'effect';
import { AppError } from '../../../errorHandling';
import { MoneyFormat } from '../../../services/types';
import { LSNFormat } from '../../types';
import { HttpResponse } from '../types';
import {
  contentTypeWithLSN,
  contentTypeWithMoneyFormat,
  DEFAULT_LSN_FORMAT,
  DEFAULT_MONEY_FORMAT,
  defaultStringify,
  LSN_FORMAT_KEY,
  MONEY_FORMAT_KEY,
  parseLSNFormat,
  parseMoneyFormat,
  toResponse,
} from '../utils';

const ok = <T>(v: T) => Either.right(v);
const err = <E>(v: E) => Either.left(v);

describe('toResponse', () => {
  it('should set body', () => {
    const body = defaultStringify({ response: 'response' });
    const r = toResponse(HttpResponse.Ok(body));
    expect(r.status).toBe(200);
    expect(r.body).toBeDefined();
  });

  it('should set status', () => {
    expect(toResponse(HttpResponse.BadRequest()).status).toBe(400);
  });

  it('should set headers', () => {
    const r = toResponse(HttpResponse.Ok(undefined, { 'X-Custom': 'value' }));
    expect(r.headers.get('x-custom')).toBe('value');
  });
});

describe('contentTypeWithLSN', () => {
  it('should return Content-Type with Number LSN Format', () => {
    expect(contentTypeWithLSN(LSNFormat.Number)).toBe('application/json; charset=utf-8');
  });

  it('should return Content-Type with String LSN Format', () => {
    expect(contentTypeWithLSN(LSNFormat.String)).toBe(
      `application/json; charset=utf-8; ${LSN_FORMAT_KEY}=${LSNFormat.String}`,
    );
  });
});

describe('contentTypeWithMoneyFormat', () => {
  it('should return Content-Type with Float Money Format', () => {
    expect(contentTypeWithMoneyFormat(MoneyFormat.Float)).toBe('application/json; charset=utf-8');
  });

  it('should return Content-Type with Long Money Format', () => {
    expect(contentTypeWithMoneyFormat(MoneyFormat.Long)).toBe(
      `application/json; charset=utf-8; ${MONEY_FORMAT_KEY}=${MoneyFormat.Long}`,
    );
  });
});

describe('contentTypeWithLSNWithMoneyFormat', () => {
  it('should return Content-Type with Number LSN Format and Float Money Format', () => {
    expect(
      contentTypeWithMoneyFormat(MoneyFormat.Float, contentTypeWithLSN(LSNFormat.Number)),
    ).toBe('application/json; charset=utf-8');
  });

  it('should return Content-Type with Number LSN Format and Long Money Format', () => {
    expect(contentTypeWithMoneyFormat(MoneyFormat.Long, contentTypeWithLSN(LSNFormat.Number))).toBe(
      `application/json; charset=utf-8; ${MONEY_FORMAT_KEY}=${MoneyFormat.Long}`,
    );
  });

  it('should return Content-Type with String LSN Format and Float Money Format', () => {
    expect(
      contentTypeWithMoneyFormat(MoneyFormat.Float, contentTypeWithLSN(LSNFormat.String)),
    ).toBe(`application/json; charset=utf-8; ${LSN_FORMAT_KEY}=${LSNFormat.String}`);
  });

  it('should return Content-Type with String LSN Format and Long Money Format', () => {
    expect(contentTypeWithMoneyFormat(MoneyFormat.Long, contentTypeWithLSN(LSNFormat.String))).toBe(
      `application/json; charset=utf-8; ${LSN_FORMAT_KEY}=${LSNFormat.String}; ${MONEY_FORMAT_KEY}=${MoneyFormat.Long}`,
    );
  });
});

describe('parseMoney', () => {
  it('should return default money format, when money is not presented in headers', () => {
    expect(parseMoneyFormat({})).toEqual(ok(DEFAULT_MONEY_FORMAT));
  });

  it('should parse money-format from headers', () => {
    expect(
      parseMoneyFormat({
        accept: `${MONEY_FORMAT_KEY}=${MoneyFormat.Float}`,
      }),
    ).toEqual(ok(MoneyFormat.Float));

    expect(
      parseMoneyFormat({
        accept: `${MONEY_FORMAT_KEY}=${MoneyFormat.Long}`,
      }),
    ).toEqual(ok(MoneyFormat.Long));
  });

  it('should return error on invalid decimals-header in headers', () => {
    expect(
      parseMoneyFormat({
        accept: `${MONEY_FORMAT_KEY}=wrong`,
      }),
    ).toEqual(err(AppError.Parse('Invalid Money Format')));
  });
});

describe('parseLSN', () => {
  it('should return default lsn format, when lsn is not presented in headers', () => {
    expect(parseLSNFormat({})).toEqual(ok(DEFAULT_LSN_FORMAT));
  });

  it('should parse lsn-format from headers', () => {
    expect(
      parseLSNFormat({
        accept: `${LSN_FORMAT_KEY}=${LSNFormat.Number}`,
      }),
    ).toEqual(ok(LSNFormat.Number));

    expect(
      parseLSNFormat({
        accept: `${LSN_FORMAT_KEY}=${LSNFormat.String}`,
      }),
    ).toEqual(ok(LSNFormat.String));
  });

  it('should return error on invalid decimals-format in headers', () => {
    expect(
      parseLSNFormat({
        accept: `${LSN_FORMAT_KEY}=bad lsn`,
      }),
    ).toEqual(err(AppError.Parse('Invalid Large significand format')));
  });
});

describe('parseLSN and parseMoneyFormat simultaneously', () => {
  it('should parse lsn-format and money-format from headers', () => {
    const acceptHeaderValue = `${LSN_FORMAT_KEY}=${LSNFormat.Number}; ${MONEY_FORMAT_KEY}=${MoneyFormat.Long}`;
    expect(
      parseLSNFormat({
        accept: acceptHeaderValue,
      }),
    ).toEqual(ok(LSNFormat.Number));

    expect(
      parseMoneyFormat({
        accept: acceptHeaderValue,
      }),
    ).toEqual(ok(MoneyFormat.Long));
  });
});
