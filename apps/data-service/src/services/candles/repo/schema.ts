import Joi from '../../../utils/validation/joi';
import { interval, CandleInterval } from '../../../types';

const CandleIntervals = [
  CandleInterval.Month1,
  CandleInterval.Week1,
  CandleInterval.Day1,
  CandleInterval.Hour12,
  CandleInterval.Hour6,
  CandleInterval.Hour4,
  CandleInterval.Hour3,
  CandleInterval.Hour2,
  CandleInterval.Hour1,
  CandleInterval.Minute30,
  CandleInterval.Minute15,
  CandleInterval.Minute5,
  CandleInterval.Minute1,
];

const customJoi = Joi.extend((joi) => ({
  base: joi.object(),
  language: {
    period: {
      allow: 'must be one of {{allowed}} interval',
      divisibleByLeftBound: 'must be divisible by left bound in {{bounds}}',
      interval: {
        valid: 'interval must be a valid interval value',
      },
      limit: '{{candlesCount}} of candles is more then allowed of {{limit}}',
      timeEnd: 'must be a valid time value',
      timeEndGt: 'time end must be greater then time start',
      timeStart: 'must be a valid time value',
    },
  },
  name: 'object',
  rules: [
    {
      name: 'period',
      params: {
        options: joi.object().keys({
          allow: joi.array().items(joi.string().noNullChars()),
          divisibleByLeftBound: joi.array().items(joi.string().noNullChars()),
          limit: joi.number().integer(),
        }),
      },
      validate(params, value, state, options) {
        if (joi.date().required().validate(value.timeStart).error) {
          return this.createError('object.period.timeStart', { value }, state, options);
        }

        if (joi.date().required().validate(value.timeEnd).error) {
          return this.createError('object.period.timeEnd', { value }, state, options);
        }

        if (value.timeEnd < value.timeStart) {
          return this.createError('object.period.timeEndGt', { value }, state, options);
        }

        if (
          joi
            .string()
            .period()
            .accept(['s', 'm', 'h', 'd', 'w', 'M', 'Y'])
            .divisibleBy(CandleInterval.Minute1)
            .min(CandleInterval.Minute1)
            .max(CandleInterval.Month1)
            .required()
            .validate(value.interval).error
        ) {
          return this.createError('object.period.interval.valid', { value }, state, options);
        }

        const valueInterval = interval(value.interval).getOrElse(null);

        if (params.options.divisibleByLeftBound) {
          for (const bound of params.options.divisibleByLeftBound) {
            const boundInterval = interval(bound).getOrElse(null);
            if (
              valueInterval.length >= boundInterval.length &&
              valueInterval.div(boundInterval) % 1 !== 0
            ) {
              return this.createError(
                'object.period.divisibleByLeftBound',
                { bounds: params.options.divisibleByLeftBound, value },
                state,
                options,
              );
            }
          }
        }

        if (params.options.limit) {
          const periodLength = value.timeEnd - value.timeStart;
          const expectedCandlesCount = Math.ceil(periodLength / valueInterval.length);
          if (expectedCandlesCount > params.options.limit) {
            return this.createError(
              'object.period.limit',
              {
                candlesCount: expectedCandlesCount,
                limit: params.options.limit,
                value,
              },
              state,
              options,
            );
          }
        }

        if (params.options.allow) {
          if (params.options.allow.indexOf(value.interval) === -1) {
            return this.createError(
              'object.period.allow',
              {
                allowed: params.options.allow,
                value,
              },
              state,
              options,
            );
          }
        }

        return value;
      },
    },
  ],
}));

const inputSearch = customJoi
  .object()
  .keys({
    amountAsset: Joi.string().assetId().required(),
    interval: Joi.string().noNullChars().required(),
    matcher: Joi.string().base58(),
    priceAsset: Joi.string().assetId().required(),
    timeEnd: Joi.date().required(),
    timeStart: Joi.date().required(),
  })
  .period({
    allow: CandleIntervals,
    limit: 1440,
  })
  .required();

const output = Joi.object().keys({
  amount_asset_id: Joi.string().assetId().required(),
  close: Joi.object().bignumber().required(),
  high: Joi.object().bignumber().required(),
  interval: Joi.string().valid(CandleIntervals).required(),
  low: Joi.object().bignumber().required(),
  max_height: Joi.number().integer().required(),
  open: Joi.object().bignumber().required(),
  price_asset_id: Joi.string().assetId().required(),
  quote_volume: Joi.object().bignumber().required(),
  time_start: Joi.date().required(),
  txs_count: Joi.number().required(),
  volume: Joi.object().bignumber().required(),
  weighted_average_price: Joi.object().bignumber().required(),
});

export { inputSearch, output };
