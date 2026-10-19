-- The DCC pseudo-asset reported the Waves genesis date (2016-04-11). Use this
-- chain's genesis block time instead (earliest key block at height 1).
CREATE OR REPLACE VIEW assets(
    asset_id,
    ticker,
    asset_name,
    description,
    sender,
    issue_height,
    issue_timestamp,
    total_quantity,
    decimals,
    reissuable,
    has_script,
    min_sponsored_asset_fee
) AS
SELECT au.asset_id,
    t.ticker,
    au.name             AS asset_name,
    au.description,
    ao.issuer           AS sender,
    ao.issue_height,
    ao.issue_time_stamp AS issue_timestamp,
    au.volume           AS total_quantity,
    au.decimals,
    au.reissuable,
    CASE
        WHEN au.script IS NOT NULL THEN true
        ELSE false
    END                 AS has_script,
    au.sponsorship      AS min_sponsored_asset_fee
FROM asset_updates au
    LEFT JOIN (SELECT tickers.asset_id, tickers.ticker FROM tickers) t ON au.asset_id::text = t.asset_id
    LEFT JOIN asset_origins ao ON au.asset_id::text = ao.asset_id::text
WHERE au.superseded_by = '9223372036854775806'::bigint
UNION ALL
SELECT 'DCC'::character varying                         AS asset_id,
       'DCC'::text                                      AS ticker,
       'DecentralCoin'::character varying                AS asset_name,
       ''::character varying                              AS description,
       ''::character varying                              AS sender,
       0                                                  AS issue_height,
       COALESCE(
           (SELECT bm.time_stamp
            FROM blocks_microblocks bm
            WHERE bm.height = 1 AND bm.time_stamp IS NOT NULL
            ORDER BY bm.uid
            LIMIT 1),
           '1970-01-01 00:00:00+00'::timestamp with time zone
       )                                                  AS issue_timestamp,
       ((SELECT dcc_data.quantity
         FROM dcc_data
         ORDER BY dcc_data.height DESC NULLS LAST
         LIMIT 1))::bigint::numeric                       AS total_quantity,
       8                                                  AS decimals,
       false                                              AS reissuable,
       false                                              AS has_script,
       NULL::bigint                                       AS min_sponsored_asset_fee;
