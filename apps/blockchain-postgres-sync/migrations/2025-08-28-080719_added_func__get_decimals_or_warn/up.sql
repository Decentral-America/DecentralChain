-- NOTE: The migration directory is named "get_decimals_or_warn" but this function raises
-- an exception (not a warning) when decimals are missing. The directory name reflects an
-- earlier design that was changed to hard-fail before the migration was committed. The
-- directory name is immutable (diesel tracks migrations by timestamp/name), so the mismatch
-- is preserved here for historical accuracy.
CREATE OR REPLACE FUNCTION get_decimals_or_exception(id text)
    RETURNS integer AS $$
DECLARE
    dec integer;
BEGIN
    SELECT decimals INTO dec
    FROM decimals
    WHERE asset_id = id;

    IF dec IS NULL THEN
        RAISE EXCEPTION 'Missing decimals for asset_id=%. Cannot calculate candle price.', id;
    END IF;

    RETURN dec;
END;
$$ LANGUAGE plpgsql;