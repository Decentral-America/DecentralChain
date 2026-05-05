import { Effect, Option, pipe } from 'effect';
import { type AppError } from '../../../errorHandling';
import { type SearchedItems } from '../../../types';
import { swapOptionEffect } from '../../../utils/fp';
import { MoneyFormat, type WithMoneyFormat } from '../../types';

export const getWithDecimalsProcessing =
  <GetRequest extends WithMoneyFormat, Response>(
    modifyDecimals: (items: Response[]) => Effect.Effect<Response[], AppError>,
    get: (r: GetRequest) => Effect.Effect<Option.Option<Response>, AppError>,
  ) =>
  (req: GetRequest): Effect.Effect<Option.Option<Response>, AppError> =>
    pipe(
      get(req),
      Effect.flatMap((m) => {
        if (req.moneyFormat === MoneyFormat.Long) return Effect.succeed(m);
        return swapOptionEffect(
          pipe(
            m,
            Option.map((item) =>
              pipe(
                modifyDecimals([item]),
                Effect.map((res) => res[0] as (typeof res)[0]),
              ),
            ),
          ),
        );
      }),
    );

export const mgetWithDecimalsProcessing =
  <MgetRequest extends WithMoneyFormat, Response>(
    modifyDecimals: (items: Response[]) => Effect.Effect<Response[], AppError>,
    mget: (r: MgetRequest) => Effect.Effect<Option.Option<Response>[], AppError>,
  ) =>
  (req: MgetRequest): Effect.Effect<Option.Option<Response>[], AppError> =>
    pipe(
      mget(req),
      Effect.flatMap((ms) => {
        if (req.moneyFormat === MoneyFormat.Long) return Effect.succeed(ms);
        const somes = ms.filter(Option.isSome).map((m) => m.value);
        return pipe(
          modifyDecimals(somes),
          Effect.map((res) => {
            let idx = 0;
            return ms.map((m) =>
              Option.isSome(m)
                ? Option.some(res[idx++] as NonNullable<(typeof res)[number]>)
                : Option.none(),
            );
          }),
        );
      }),
    );

export const searchWithDecimalsProcessing =
  <SearchRequest extends WithMoneyFormat, Response>(
    modifyDecimals: (items: Response[]) => Effect.Effect<Response[], AppError>,
    search: (r: SearchRequest) => Effect.Effect<SearchedItems<Response>, AppError>,
  ) =>
  (req: SearchRequest): Effect.Effect<SearchedItems<Response>, AppError> =>
    pipe(
      search(req),
      Effect.flatMap((res) => {
        if (req.moneyFormat === MoneyFormat.Long) return Effect.succeed(res);
        return pipe(
          modifyDecimals(res.items),
          Effect.map((items) => ({ ...res, items })),
        );
      }),
    );

export const withDecimalsProcessing = <
  GetRequest extends WithMoneyFormat,
  MgetRequest extends WithMoneyFormat,
  SearchRequest extends WithMoneyFormat,
  Response,
>(
  modifyDecimals: (items: Response[]) => Effect.Effect<Response[], AppError>,
  service: {
    get: (r: GetRequest) => Effect.Effect<Option.Option<Response>, AppError>;
    mget: (r: MgetRequest) => Effect.Effect<Option.Option<Response>[], AppError>;
    search: (r: SearchRequest) => Effect.Effect<SearchedItems<Response>, AppError>;
  },
): {
  get: (r: GetRequest) => Effect.Effect<Option.Option<Response>, AppError>;
  mget: (r: MgetRequest) => Effect.Effect<Option.Option<Response>[], AppError>;
  search: (r: SearchRequest) => Effect.Effect<SearchedItems<Response>, AppError>;
} => ({
  get: getWithDecimalsProcessing(modifyDecimals, service.get),
  mget: mgetWithDecimalsProcessing(modifyDecimals, service.mget),
  search: searchWithDecimalsProcessing(modifyDecimals, service.search),
});
