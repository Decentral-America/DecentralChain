import * as knex from 'knex';

const pg = knex({ client: 'pg' });

const selectExchanges = pg({ t: 'txs_7' })
  .select({
    amount: 't.amount',
    amount_asset_id: 't.amount_asset_id',
    price: pg.raw(`
      CASE WHEN t.tx_version > 2
        THEN t.price::numeric
          * 10^(select decimals from decimals where asset_id = t.price_asset_id)
          * 10^(select -decimals from decimals where asset_id = t.amount_asset_id)
        ELSE t.price::numeric
      END
    `),
    price_asset_id: 't.price_asset_id',
    sender: 't.sender',
    time_stamp: 't.time_stamp',
    uid: 't.uid',
  })
  .whereRaw(`time_stamp >= now() - interval '1 day'`)
  .orderBy('t.uid', 'desc')
  .orderByRaw(`time_stamp <-> now() - interval '1 day'`);

const selectPairsCTE = pg
  .with('pairs_cte', (qb) => {
    qb.select({
      amount_asset_id: 'amount_asset_id',
      first_price: pg.raw('(array_agg(e.price ORDER BY e.uid)::numeric[])[1]'),
      high: pg.raw('max(e.price)'),
      last_price: pg.raw('(array_agg(e.price ORDER BY e.uid DESC)::numeric[])[1]'),
      low: pg.raw('min(e.price)'),
      matcher_address: 'sender',
      price_asset_id: 'price_asset_id',
      quote_volume: pg.raw('sum(e.amount::numeric * e.price::numeric)'),
      txs_count: pg.raw('count(e.price)'),
      volume: pg.raw('sum(e.amount)'),
      volume_waves: pg.raw(
        `case when amount_asset_id='WAVES' then sum(e.amount) when price_asset_id='WAVES' then sum(e.amount::numeric * e.price::numeric) end`,
      ),
      weighted_average_price: pg.raw(
        'floor(sum(e.amount::numeric * e.price::numeric)/ sum(e.amount))',
      ),
    })
      .from(selectExchanges.clone().as('e'))
      .groupBy(['amount_asset_id', 'price_asset_id', 'sender']);
  })
  .from({ p: 'pairs_cte' })
  .columns(
    'p.amount_asset_id',
    'p.price_asset_id',
    'p.first_price',
    'p.last_price',
    'p.volume',
    {
      volume_waves: pg.raw(
        'COALESCE(p.volume_waves, floor(p.quote_volume / p1.weighted_average_price), p.quote_volume * p2.weighted_average_price)',
      ),
    },
    'p.quote_volume',
    'p.high',
    'p.low',
    'p.weighted_average_price',
    'p.txs_count',
    'p.matcher_address',
  )
  .leftJoin({ p1: 'pairs_cte' }, function () {
    this.on(pg.raw(`p1.amount_asset_id='WAVES'`))
      .andOn('p1.price_asset_id', 'p.price_asset_id')
      .andOn('p1.matcher_address', 'p.matcher_address');
  })
  .leftJoin({ p2: 'pairs_cte' }, function () {
    this.on('p2.amount_asset_id', 'p.price_asset_id')
      .andOn(pg.raw(`p2.price_asset_id='WAVES'`))
      .andOn('p2.matcher_address', 'p.matcher_address');
  });

export const fillTable = (pairsTableName: string): string =>
  pg.into(pairsTableName).insert(selectPairsCTE).toString();
