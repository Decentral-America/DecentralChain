-- dcc_data held one row per distinct DCC quantity (primary key on quantity,
-- insert-or-ignore), so equal quantities at different heights were dropped, and
-- no rollback ever removed a row. Key it by height and tie each row to its key
-- block so a rollback removes it.
ALTER TABLE dcc_data DROP CONSTRAINT IF EXISTS waves_data_pkey;
DELETE FROM dcc_data WHERE height IS NULL;
DELETE FROM dcc_data a USING dcc_data b WHERE a.height = b.height AND a.ctid < b.ctid;
ALTER TABLE dcc_data ALTER COLUMN height SET NOT NULL;
ALTER TABLE dcc_data ADD CONSTRAINT dcc_data_pkey PRIMARY KEY (height);
ALTER TABLE dcc_data
    ADD COLUMN IF NOT EXISTS block_uid BIGINT REFERENCES blocks_microblocks (uid) ON DELETE CASCADE;
UPDATE dcc_data d
SET block_uid = b.uid
FROM blocks_microblocks b
WHERE b.height = d.height AND b.time_stamp IS NOT NULL AND d.block_uid IS NULL;
CREATE INDEX IF NOT EXISTS dcc_data_block_uid_idx ON dcc_data (block_uid);
