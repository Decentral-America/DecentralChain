DROP INDEX IF EXISTS dcc_data_block_uid_idx;
ALTER TABLE dcc_data DROP COLUMN IF EXISTS block_uid;
ALTER TABLE dcc_data DROP CONSTRAINT IF EXISTS dcc_data_pkey;
ALTER TABLE dcc_data ALTER COLUMN height DROP NOT NULL;
DELETE FROM dcc_data a USING dcc_data b WHERE a.quantity = b.quantity AND a.ctid < b.ctid;
ALTER TABLE dcc_data ADD CONSTRAINT waves_data_pkey PRIMARY KEY (quantity);
