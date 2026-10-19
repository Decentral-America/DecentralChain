-- txs_19 (CommitToGeneration) was created outside the txs inheritance tree.
-- Squash and rollback update/delete through the txs parent, so txs_19 rows were
-- skipped, and its ON DELETE CASCADE foreign key then removed them together with
-- the squashed microblock. Make it a child of txs like txs_1..txs_18 and use the
-- same non-cascading foreign key, so a missed re-point fails loudly instead of
-- deleting data.
ALTER TABLE txs_19 DROP CONSTRAINT IF EXISTS txs_19_block_uid_fkey;
ALTER TABLE txs_19 ALTER COLUMN status SET DEFAULT 'succeeded';
ALTER TABLE txs_19 INHERIT txs;
ALTER TABLE txs_19
    ADD CONSTRAINT fk_blocks_uid FOREIGN KEY (block_uid) REFERENCES blocks_microblocks(uid);

CREATE UNIQUE INDEX IF NOT EXISTS txs_19_uid_time_stamp_unique_idx ON txs_19 (uid, time_stamp);
CREATE INDEX IF NOT EXISTS txs_19_height_idx ON txs_19 USING btree (height);
CREATE INDEX IF NOT EXISTS txs_19_block_uid_idx ON txs_19 (block_uid);
CREATE INDEX IF NOT EXISTS txs_19_id_idx ON txs_19 USING hash (id);
CREATE INDEX IF NOT EXISTS txs_19_time_stamp_uid_gist_idx ON txs_19 USING gist (time_stamp, uid);
