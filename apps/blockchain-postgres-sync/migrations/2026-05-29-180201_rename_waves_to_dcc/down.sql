-- Revert: restore waves-branded database object names.

ALTER INDEX IF EXISTS dcc_data_height_desc_quantity_idx
    RENAME TO waves_data_height_desc_quantity_idx;

ALTER TABLE dcc_data RENAME TO waves_data;

ALTER TABLE pairs RENAME COLUMN volume_dcc TO volume_waves;
