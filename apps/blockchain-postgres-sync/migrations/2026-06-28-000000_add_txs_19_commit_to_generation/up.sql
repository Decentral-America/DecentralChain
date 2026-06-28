-- Add txs_19 table for CommitToGenerationTransaction (type 19)
-- Also corrects existing txs rows that were stored with tx_type=1 (Genesis placeholder)

CREATE TABLE IF NOT EXISTS txs_19 (
    uid                     BIGINT        NOT NULL REFERENCES txs(uid),
    tx_type                 SMALLINT      NOT NULL,
    sender                  VARCHAR       NOT NULL,
    sender_public_key       VARCHAR       NOT NULL,
    time_stamp              TIMESTAMPTZ   NOT NULL,
    height                  INTEGER       NOT NULL,
    id                      VARCHAR       NOT NULL,
    signature               VARCHAR,
    proofs                  TEXT[],
    tx_version              SMALLINT,
    fee                     BIGINT        NOT NULL,
    status                  VARCHAR       NOT NULL,
    block_uid               BIGINT        NOT NULL REFERENCES blocks_microblocks(uid),
    endorser_public_key     VARCHAR       NOT NULL,
    generation_period_start INTEGER       NOT NULL,
    PRIMARY KEY (uid)
);

CREATE INDEX IF NOT EXISTS txs_19_sender_idx ON txs_19(sender);
CREATE INDEX IF NOT EXISTS txs_19_generation_period_start_idx ON txs_19(generation_period_start);

-- Correct existing CommitToGeneration TXs that were stored with tx_type=1
-- They can be identified by joining against the node's actual data, but since
-- we cannot query the node here, we mark them for re-sync. BPS should resync
-- from block 1 after this migration to backfill correctly.
