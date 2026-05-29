-- Rename waves-branded database objects to dcc.
-- PostgreSQL ALTER TABLE RENAME propagates to dependent views by OID,
-- so the `assets` view referencing `waves_data` is automatically updated.

-- 1. Rename the column in the pairs table
ALTER TABLE pairs RENAME COLUMN volume_waves TO volume_dcc;

-- 2. Rename the waves_data table to dcc_data
ALTER TABLE waves_data RENAME TO dcc_data;

-- 3. Rename the index (cosmetic — the old name still works, but consistency matters)
ALTER INDEX IF EXISTS waves_data_height_desc_quantity_idx
    RENAME TO dcc_data_height_desc_quantity_idx;
