-- Ethereum (type 18) transfers stored only the raw bytes, so wallets could not
-- find incoming Ethereum transfers by recipient. Store the decoded transfer.
ALTER TABLE txs_18 ADD COLUMN IF NOT EXISTS recipient_address VARCHAR;
ALTER TABLE txs_18 ADD COLUMN IF NOT EXISTS amount BIGINT;
ALTER TABLE txs_18 ADD COLUMN IF NOT EXISTS asset_id VARCHAR;
CREATE INDEX IF NOT EXISTS txs_18_recipient_address_uid_idx ON txs_18 (recipient_address, uid);
