import rawJoi from 'joi';

import { BigNumber } from '@decentralchain/data-entities';
import regex from '../regex';
import { interval } from '../../types';
import { div } from '../interval';
import Maybe from 'folktale/maybe';

const regexRule = (joi, name, regexes) => ({
  name,
  validate(_, value, state, options) {
    for (const { regex, errorCode } of regexes) {
      if (joi.string().regex(regex).validate(value).error) {
        return this.createError(errorCode, { value }, state, options);
      }
    }
    return value;
  },
});

export default rawJoi
  .extend((joi) => ({
    base: joi.string(),
    language: {
      assetId: 'must be a valid base58 string or "WAVES"',
      base58: 'must be a valid base58 string',
      base64Prefixed: 'must be a string of "base64:${base64EncodedString}"',
      eip712Signature: 'must be a hex-encoded string starting with `0x`',
      noNullChars: 'must not contain unicode null characters',
      pair: 'must be a valid pair string',
      period: {
        accept: 'must be in accepted',
        divisibleBy: 'must be divisible by divider',
        max: 'must be less then max',
        min: 'must be more then min',
        value: 'interval must be a valid interval value',
      },
      saneForDbLike: 'must not end with unescaped slash symbol',
    },
    name: 'string',
    rules: [
      regexRule(joi, 'base58', [{ errorCode: 'string.base58', regex: regex.base58 }]),
      regexRule(joi, 'assetId', [{ errorCode: 'string.assetId', regex: regex.assetId }]),
      regexRule(joi, 'noNullChars', [
        { errorCode: 'string.noNullChars', regex: regex.noNullChars },
      ]),
      regexRule(joi, 'period', [{ errorCode: 'string.period.value', regex: regex.interval }]),
      regexRule(joi, 'saneForDbLike', [
        { errorCode: 'string.saneForDbLike', regex: regex.saneForDbLike },
        { errorCode: 'string.noNullChars', regex: regex.noNullChars },
      ]),
      regexRule(joi, 'eip712Signature', [
        { errorCode: 'string.eip712Signature', regex: regex.eip712Signature },
      ]),
      {
        name: 'base64Prefixed',
        validate(_, value, state, options) {
          // the value should be "base64:${base4dEncodedString}"
          return Maybe.of(value)
            .filter((it) => typeof it === 'string')
            .map((it) => it.split(':'))
            .filter((it) => it.length === 2)
            .filter(
              ([prefix, val]) =>
                prefix === 'base64' &&
                !joi.string().base64({ paddingRequired: false }).validate(val).error,
            )
            .matchWith({
              Just: () => value,
              Nothing: () => this.createError('string.base64Prefixed', { value }, state, options),
            });
        },
      },
      {
        name: 'accept',
        params: {
          accept: joi.array(),
        },
        validate(params, value, state, options) {
          const i = interval(value);

          return i.matchWith({
            Error: ({ value: e }) =>
              this.createError('string.period.accept', { e, value }, state, options),
            Ok: ({ value: i }) => {
              if (params.accept.indexOf(i.unit) === -1) {
                return this.createError('string.period.accept', { value }, state, options);
              }

              return value;
            },
          });
        },
      },
      {
        name: 'divisibleBy',
        params: {
          divisibleBy: joi.string().regex(regex.interval),
        },
        validate(params, value, state, options) {
          const i = interval(value);
          const divisibleByInterval = interval(params.divisibleBy);

          return i.matchWith({
            Error: ({ value: e }) =>
              this.createError('string.period.interval', { e, value }, state, options),
            Ok: ({ value: i }) =>
              divisibleByInterval.matchWith({
                Error: ({ value: e }) =>
                  this.createError('string.period.divisibleBy', { e, value }, state, options),
                Ok: ({ value: d }) => {
                  if (div(i, d) % 1 !== 0) {
                    return this.createError('string.period.divisibleBy', { value }, state, options);
                  }

                  return value;
                },
              }),
          });
        },
      },
      {
        name: 'min',
        params: {
          min: joi.string().regex(regex.interval),
        },
        validate(params, value, state, options) {
          const i = interval(value);
          const minInterval = interval(params.min);

          return i.matchWith({
            Error: ({ value: e }) =>
              this.createError('string.period.interval', { e, value }, state, options),
            Ok: ({ value: i }) =>
              minInterval.matchWith({
                Error: ({ value: e }) =>
                  this.createError('string.period.minInterval', { e, value }, state, options),
                Ok: ({ value: d }) => {
                  if (d.length > i.length) {
                    return this.createError('string.period.minInterval', { value }, state, options);
                  }
                  return value;
                },
              }),
          });
        },
      },
      {
        name: 'max',
        params: {
          max: joi.string().regex(regex.interval),
        },
        validate(params, value, state, options) {
          const i = interval(value);
          const maxInterval = interval(params.max);

          return i.matchWith({
            Error: ({ value: e }) =>
              this.createError('string.period.interval', { e, value }, state, options),
            Ok: ({ value: i }) =>
              maxInterval.matchWith({
                Error: ({ value: e }) =>
                  this.createError('string.period.maxInterval', { e, value }, state, options),
                Ok: ({ value: d }) => {
                  if (d.length < i.length) {
                    return this.createError('string.period.maxInterval', { value }, state, options);
                  }
                  return value;
                },
              }),
          });
        },
      },
    ],
  }))
  .extend((joi) => ({
    base: joi.object(),
    language: {
      bignumber: {
        int64: 'The number {{value}} is outside int64 range',
        nan: 'is Not a Number',
      },
    },
    name: 'object',
    rules: [
      {
        name: 'bignumber',
        validate(_, value, state, options) {
          if (!(value instanceof BigNumber)) {
            return this.createError('object.type', { type: BigNumber }, state, options);
          }
          return value;
        },
      },
      {
        name: 'notNan',
        validate(_, value, state, options) {
          if (!(value instanceof BigNumber) || value.isNaN()) {
            return this.createError('object.bignumber.nan', { value: NaN }, state, options);
          }
          return value;
        },
      },
      {
        name: 'int64',
        validate(_, value, state, options) {
          const BOUNDS = {
            LOWER: new BigNumber('-9223372036854775808'),
            UPPER: new BigNumber('9223372036854775807'),
          };

          if (
            !(value instanceof BigNumber) ||
            value.isLessThan(BOUNDS.LOWER) ||
            value.isGreaterThan(BOUNDS.UPPER)
          ) {
            return this.createError(
              'object.bignumber.int64',
              { value: value.toString() },
              state,
              options,
            );
          }
          return value;
        },
      },
    ],
  }))
  .extend((joi) => ({
    base: joi.string().base64({ paddingRequired: false }),
    language: {
      wrong: 'must be a valid cursor string',
    },
    name: 'cursor',
    rules: [
      {
        name: 'valid',
        params: {
          deserialize: joi.func().arity(1).required(),
        },
        validate(params, value, state, options) {
          return params.deserialize(value).matchWith({
            Error: () => this.createError('cursor.wrong', { v: value }, state, options),
            Ok: () => value,
          });
        },
      },
    ],
  }));
