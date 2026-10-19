DROP INDEX IF EXISTS txs_19_time_stamp_uid_gist_idx;
DROP INDEX IF EXISTS txs_19_id_idx;
DROP INDEX IF EXISTS txs_19_block_uid_idx;
DROP INDEX IF EXISTS txs_19_height_idx;
DROP INDEX IF EXISTS txs_19_uid_time_stamp_unique_idx;
ALTER TABLE txs_19 DROP CONSTRAINT IF EXISTS fk_blocks_uid;
ALTER TABLE txs_19 NO INHERIT txs;
ALTER TABLE txs_19 ALTER COLUMN status DROP DEFAULT;
ALTER TABLE txs_19
    ADD CONSTRAINT txs_19_block_uid_fkey FOREIGN KEY (block_uid)
    REFERENCES blocks_microblocks(uid) ON DELETE CASCADE;
