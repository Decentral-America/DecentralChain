CREATE OR REPLACE VIEW assets(
    asset_id, ticker, asset_name, description, sender, issue_height, issue_timestamp,
    total_quantity, decimals, reissuable, has_script, min_sponsored_asset_fee
) AS
SELECT au.asset_id, t.ticker, au.name AS asset_name, au.description, ao.issuer AS sender,
    ao.issue_height, ao.issue_time_stamp AS issue_timestamp, au.volume AS total_quantity,
    au.decimals, au.reissuable,
    CASE WHEN au.script IS NOT NULL THEN true ELSE false END AS has_script,
    au.sponsorship AS min_sponsored_asset_fee
FROM asset_updates au
    LEFT JOIN (SELECT tickers.asset_id, tickers.ticker FROM tickers) t ON au.asset_id::text = t.asset_id
    LEFT JOIN asset_origins ao ON au.asset_id::text = ao.asset_id::text
WHERE au.superseded_by = '9223372036854775806'::bigint
UNION ALL
SELECT 'DCC'::character varying, 'DCC'::text, 'DecentralCoin'::character varying,
       ''::character varying, ''::character varying, 0,
       '2016-04-11 21:00:00+00'::timestamp with time zone,
       ((SELECT dcc_data.quantity FROM dcc_data ORDER BY dcc_data.height DESC NULLS LAST LIMIT 1))::bigint::numeric,
       8, false, false, NULL::bigint;
