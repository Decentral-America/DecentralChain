import { BigNumber } from '@decentralchain/data-entities';
import { Effect, Option, pipe } from 'effect';
import { knex } from 'knex';
import { chain } from 'ramda';
import { type PgDriver } from '../../../../db/driver';
import { type DbError, type Timeout } from '../../../../errorHandling';
import { type RateMgetParams, type RateWithPairIds } from '../../../../types';
import { type AsyncMget } from '../../repo';
import makeSql from './sql';

const pg = knex({ client: 'pg' });

type CandleRate = {
  amount_asset_id: string;
  price_asset_id: string;
  matcher: string;
  weighted_average_price: BigNumber | null;
};

export default class RemoteRateRepo
  implements AsyncMget<RateMgetParams, RateWithPairIds, DbError | Timeout>
{
  private readonly dbDriver: PgDriver;

  constructor(dbDriver: PgDriver) {
    this.dbDriver = dbDriver;
  }

  mget(request: RateMgetParams): Effect.Effect<RateWithPairIds[], DbError | Timeout> {
    const pairsSqlParams = chain((it) => [it.amountAsset, it.priceAsset], request.pairs);

    const sql = pg.raw(makeSql(request.pairs.length), [
      Option.getOrElse(request.timestamp, () => new Date()),
      request.matcher,
      ...pairsSqlParams,
    ]);

    const dbEffect: Effect.Effect<CandleRate[], DbError | Timeout> =
      request.pairs.length === 0
        ? Effect.succeed([])
        : this.dbDriver.any<CandleRate>(sql.toString());

    return pipe(
      dbEffect,
      Effect.map((result) =>
        result.map((it) => ({
          amountAsset: it.amount_asset_id,
          priceAsset: it.price_asset_id,
          rate: it.weighted_average_price || new BigNumber(0),
        })),
      ),
    );
  }
}
