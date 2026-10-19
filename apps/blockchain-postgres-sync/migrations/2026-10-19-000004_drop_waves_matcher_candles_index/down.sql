CREATE INDEX IF NOT EXISTS candles_assets_id_idx
    ON candles USING btree (amount_asset_id, price_asset_id)
    WHERE ((("interval")::text = '1d'::text) AND ((matcher_address)::text = '3PEjHv3JGjcWNpYEEkif2w8NXV4kbhnoGgu'::text));
