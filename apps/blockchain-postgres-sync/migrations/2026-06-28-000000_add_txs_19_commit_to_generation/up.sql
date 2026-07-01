-- Add txs_19 table for CommitToGenerationTransaction (type 19)
-- Note: no FK to txs(uid) because txs has composite PK (uid, id, time_stamp).
-- Only block_uid references blocks_microblocks which has a single-column PK.

CREATE TABLE IF NOT EXISTS txs_19 (
    uid                     BIGINT        NOT NULL,
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
    block_uid               BIGINT        NOT NULL REFERENCES blocks_microblocks(uid) ON DELETE CASCADE,
    endorser_public_key     VARCHAR       NOT NULL,
    generation_period_start INTEGER       NOT NULL,
    PRIMARY KEY (uid)
);

CREATE INDEX IF NOT EXISTS txs_19_sender_idx ON txs_19(sender);
CREATE INDEX IF NOT EXISTS txs_19_generation_period_start_idx ON txs_19(generation_period_start);
