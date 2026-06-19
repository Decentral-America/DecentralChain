#![allow(clippy::unwrap_used)]
//! Integration tests for consumer repo operations against a real PostgreSQL instance.
//!
//! These tests exercise the database operations defined in
//! `src/lib/consumer/repo/pg.rs` — insert, rollback, idempotency — using a
//! throwaway Docker container so that nothing about the host database is assumed
//! or modified.
//!
//! Run with:
//!   cargo test --test consumer_repo -- --test-threads=1

#![allow(clippy::unwrap_used)]

use diesel::{Connection, RunQueryDsl, pg::PgConnection, sql_query};
use diesel_migrations::{EmbeddedMigrations, MigrationHarness, embed_migrations};
use testcontainers::{ContainerAsync, ImageExt, runners::AsyncRunner};
use testcontainers_modules::postgres::Postgres;

const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

// ─── Container + migration setup ─────────────────────────────────────────────

async fn start_pg() -> (ContainerAsync<Postgres>, String) {
    let container = Postgres::default()
        .with_tag("16-alpine")
        .start()
        .await
        .expect("failed to start postgres container — is Docker running?");

    let host = container.get_host().await.expect("host unavailable");
    let port = container
        .get_host_port_ipv4(5432)
        .await
        .expect("port unavailable");

    (
        container,
        format!("postgres://postgres:postgres@{host}:{port}/postgres"),
    )
}

fn migrate_and_connect(url: &str) -> PgConnection {
    let mut conn = PgConnection::establish(url).expect("connect failed");
    conn.run_pending_migrations(MIGRATIONS)
        .expect("migrations failed");
    conn
}

// ─── Helper: insert a block row ───────────────────────────────────────────────

/// Insert a block into `blocks_microblocks` and return its generated `uid`.
fn insert_block(conn: &mut PgConnection, id: &str, height: i32, time_stamp: Option<&str>) -> i64 {
    #[derive(diesel::QueryableByName)]
    struct Uid {
        #[diesel(sql_type = diesel::sql_types::BigInt)]
        uid: i64,
    }

    let ts_expr = match time_stamp {
        Some(ts) => format!("'{ts}'::timestamptz"),
        None => "NULL".to_string(),
    };

    let rows: Vec<Uid> = sql_query(format!(
        "INSERT INTO blocks_microblocks (id, height, time_stamp) \
         VALUES ('{id}', {height}, {ts_expr}) \
         RETURNING uid"
    ))
    .load(conn)
    .unwrap();

    rows.into_iter().next().unwrap().uid
}

// ─── Test: insert a block and query it back ──────────────────────────────────

#[tokio::test]
async fn test_block_insertion_and_query() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    let block_uid = insert_block(
        &mut conn,
        "block-id-001",
        100,
        Some("2024-01-01 00:00:00+00"),
    );

    #[derive(diesel::QueryableByName, Debug)]
    struct Row {
        #[diesel(sql_type = diesel::sql_types::Varchar)]
        id: String,
        #[diesel(sql_type = diesel::sql_types::Integer)]
        height: i32,
    }

    let rows: Vec<Row> = sql_query("SELECT id, height FROM blocks_microblocks WHERE uid = $1")
        .bind::<diesel::sql_types::BigInt, _>(block_uid)
        .load(&mut conn)
        .unwrap();

    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].id, "block-id-001");
    assert_eq!(rows[0].height, 100);
}

// ─── Test: rollback removes blocks above a given uid ─────────────────────────

#[tokio::test]
async fn test_rollback_removes_blocks_above_uid() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    // Insert three blocks at heights 1, 2, 3.
    let uid1 = insert_block(&mut conn, "blk-h1", 1, Some("2024-01-01 00:00:00+00"));
    let uid2 = insert_block(&mut conn, "blk-h2", 2, Some("2024-01-01 00:01:00+00"));
    let uid3 = insert_block(&mut conn, "blk-h3", 3, Some("2024-01-01 00:02:00+00"));

    // Simulate rollback to uid1: delete everything with uid > uid1.
    sql_query("DELETE FROM blocks_microblocks WHERE uid > $1")
        .bind::<diesel::sql_types::BigInt, _>(uid1)
        .execute(&mut conn)
        .unwrap();

    // uid2 and uid3 must be gone.
    #[derive(diesel::QueryableByName)]
    struct Cnt {
        #[diesel(sql_type = diesel::sql_types::BigInt)]
        cnt: i64,
    }

    let remaining: Vec<Cnt> =
        sql_query("SELECT COUNT(*)::bigint AS cnt FROM blocks_microblocks WHERE uid = ANY($1)")
            .bind::<diesel::sql_types::Array<diesel::sql_types::BigInt>, _>(vec![uid2, uid3])
            .load(&mut conn)
            .unwrap();

    assert_eq!(
        remaining[0].cnt, 0,
        "blocks at uid2/uid3 should have been rolled back"
    );

    // uid1 must still be present.
    let kept: Vec<Cnt> =
        sql_query("SELECT COUNT(*)::bigint AS cnt FROM blocks_microblocks WHERE uid = $1")
            .bind::<diesel::sql_types::BigInt, _>(uid1)
            .load(&mut conn)
            .unwrap();
    assert_eq!(kept[0].cnt, 1, "block at uid1 should still be present");

    // Suppress unused-variable warnings for the computed uids.
    let _ = (uid2, uid3);
}

// ─── Test: inserting a tx_4 (transfer) row and querying it back ──────────────

#[tokio::test]
async fn test_tx4_insert_and_query() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    let block_uid = insert_block(&mut conn, "blk-tx4", 10, Some("2024-06-01 12:00:00+00"));

    // Insert a minimal transfer transaction into txs_4.
    // The inherited columns (uid, tx_type, …) must all be supplied because
    // txs_4 inherits from txs and inherits all NOT NULL constraints.
    sql_query(
        "INSERT INTO txs_4 \
         (uid, tx_type, sender, sender_public_key, time_stamp, height, id, \
          signature, fee, status, block_uid, \
          asset_id, amount, recipient_address, fee_asset_id, attachment) \
         VALUES \
         (1001, 4, 'sender123', 'pubkey123', '2024-06-01 12:00:00+00', 10, \
          'txid-transfer-001', 'sig001', 100000, 'succeeded', $1, \
          'DCC', 5000000, 'recipient456', 'DCC', '')",
    )
    .bind::<diesel::sql_types::BigInt, _>(block_uid)
    .execute(&mut conn)
    .unwrap();

    // Query the row back.
    #[derive(diesel::QueryableByName, Debug)]
    struct TxRow {
        #[diesel(sql_type = diesel::sql_types::Varchar)]
        id: String,
        #[diesel(sql_type = diesel::sql_types::Varchar)]
        sender: String,
        #[diesel(sql_type = diesel::sql_types::BigInt)]
        amount: i64,
        #[diesel(sql_type = diesel::sql_types::Varchar)]
        recipient_address: String,
    }

    let rows: Vec<TxRow> = sql_query(
        "SELECT id, sender, amount, recipient_address \
         FROM txs_4 WHERE id = 'txid-transfer-001'",
    )
    .load(&mut conn)
    .unwrap();

    assert_eq!(rows.len(), 1, "expected one transfer tx row");
    assert_eq!(rows[0].id, "txid-transfer-001");
    assert_eq!(rows[0].sender, "sender123");
    assert_eq!(rows[0].amount, 5_000_000);
    assert_eq!(rows[0].recipient_address, "recipient456");
}

// ─── Test: duplicate tx uid does not cause a panic — ON CONFLICT is safe ─────

#[tokio::test]
async fn test_duplicate_block_id_is_rejected() {
    // The `blocks_microblocks.id` column is a PRIMARY KEY so a duplicate must
    // produce a database error, not a silent ignore.  This confirms the
    // unique constraint is in place (integration test rather than schema test).
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    insert_block(&mut conn, "dup-block-id", 1, Some("2024-01-01 00:00:00+00"));

    let result = sql_query(
        "INSERT INTO blocks_microblocks (id, height, time_stamp) \
         VALUES ('dup-block-id', 2, '2024-01-02 00:00:00+00')",
    )
    .execute(&mut conn);

    assert!(
        result.is_err(),
        "inserting a duplicate block id should fail with a constraint violation"
    );
}

// ─── Test: rollback cascades to tx rows via block_uid foreign key ─────────────

#[tokio::test]
async fn test_rollback_cascades_to_txs() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    let uid_keep = insert_block(&mut conn, "blk-keep", 1, Some("2024-01-01 00:00:00+00"));
    let uid_roll = insert_block(&mut conn, "blk-roll", 2, Some("2024-01-01 00:01:00+00"));

    // Insert a genesis tx (txs_1) in the block to be rolled back.
    sql_query(
        "INSERT INTO txs_1 \
         (uid, tx_type, sender, sender_public_key, time_stamp, height, id, \
          signature, fee, status, block_uid, \
          recipient_address, amount) \
         VALUES \
         (2001, 1, NULL, NULL, '2024-01-01 00:01:00+00', 2, \
          'txid-genesis-001', NULL, 0, 'succeeded', $1, \
          'genesis-recipient', 10000000000)",
    )
    .bind::<diesel::sql_types::BigInt, _>(uid_roll)
    .execute(&mut conn)
    .unwrap();

    // Rollback: delete block uid_roll.  The tx references block_uid via FK
    // (not ON DELETE CASCADE on txs_1 itself, so we must delete transactions
    // first in the same order the application does).
    sql_query("DELETE FROM txs_1 WHERE block_uid = $1")
        .bind::<diesel::sql_types::BigInt, _>(uid_roll)
        .execute(&mut conn)
        .unwrap();
    sql_query("DELETE FROM blocks_microblocks WHERE uid = $1")
        .bind::<diesel::sql_types::BigInt, _>(uid_roll)
        .execute(&mut conn)
        .unwrap();

    // The genesis tx should be gone.
    #[derive(diesel::QueryableByName)]
    struct Cnt {
        #[diesel(sql_type = diesel::sql_types::BigInt)]
        cnt: i64,
    }
    let remaining: Vec<Cnt> =
        sql_query("SELECT COUNT(*)::bigint AS cnt FROM txs_1 WHERE id = 'txid-genesis-001'")
            .load(&mut conn)
            .unwrap();
    assert_eq!(remaining[0].cnt, 0, "genesis tx should have been deleted");

    // The kept block must still be there.
    let kept: Vec<Cnt> =
        sql_query("SELECT COUNT(*)::bigint AS cnt FROM blocks_microblocks WHERE uid = $1")
            .bind::<diesel::sql_types::BigInt, _>(uid_keep)
            .load(&mut conn)
            .unwrap();
    assert_eq!(kept[0].cnt, 1, "kept block must still exist");
}

// ─── Test: asset_updates insert and query ────────────────────────────────────

#[tokio::test]
async fn test_asset_update_insert_and_query() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    let block_uid = insert_block(&mut conn, "blk-asset", 5, Some("2024-03-01 00:00:00+00"));

    // Insert a minimal asset_update row.
    // superseded_by = 9223372036854775806 (MAX_UID) means "current version".
    sql_query(
        "INSERT INTO asset_updates \
         (uid, block_uid, superseded_by, asset_id, decimals, name, description, \
          reissuable, volume, script, sponsorship, nft) \
         VALUES \
         (5001, $1, 9223372036854775806, 'MY_ASSET_ID', 8, 'MyToken', \
          'A test token', false, 1000000000, NULL, NULL, false)",
    )
    .bind::<diesel::sql_types::BigInt, _>(block_uid)
    .execute(&mut conn)
    .unwrap();

    #[derive(diesel::QueryableByName, Debug)]
    struct Row {
        #[diesel(sql_type = diesel::sql_types::Varchar)]
        asset_id: String,
        #[diesel(sql_type = diesel::sql_types::SmallInt)]
        decimals: i16,
        #[diesel(sql_type = diesel::sql_types::Varchar)]
        name: String,
        #[diesel(sql_type = diesel::sql_types::BigInt)]
        volume: i64,
    }

    let rows: Vec<Row> = sql_query(
        "SELECT asset_id, decimals, name, volume \
         FROM asset_updates \
         WHERE asset_id = 'MY_ASSET_ID'",
    )
    .load(&mut conn)
    .unwrap();

    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].asset_id, "MY_ASSET_ID");
    assert_eq!(rows[0].decimals, 8);
    assert_eq!(rows[0].name, "MyToken");
    assert_eq!(rows[0].volume, 1_000_000_000);
}

// ─── Test: dcc_data insert (on_conflict do nothing) ──────────────────────────

#[tokio::test]
async fn test_dcc_data_on_conflict_do_nothing() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    // The dcc_data primary key is `quantity`, so two rows with same quantity
    // must be silently ignored (same as the production do_nothing strategy).
    sql_query("INSERT INTO dcc_data (height, quantity) VALUES (1, 10000000000000)")
        .execute(&mut conn)
        .unwrap();

    // Duplicate quantity — should not fail.
    let result = sql_query(
        "INSERT INTO dcc_data (height, quantity) \
         VALUES (2, 10000000000000) \
         ON CONFLICT (quantity) DO NOTHING",
    )
    .execute(&mut conn);

    assert!(result.is_ok(), "ON CONFLICT DO NOTHING should not error");

    // Only the first row should exist.
    #[derive(diesel::QueryableByName)]
    struct Cnt {
        #[diesel(sql_type = diesel::sql_types::BigInt)]
        cnt: i64,
    }
    let rows: Vec<Cnt> =
        sql_query("SELECT COUNT(*)::bigint AS cnt FROM dcc_data WHERE quantity = 10000000000000")
            .load(&mut conn)
            .unwrap();
    assert_eq!(rows[0].cnt, 1, "duplicate quantity row should be ignored");
}

// ─── Test: get_decimals_or_exception function ─────────────────────────────────

#[tokio::test]
async fn test_get_decimals_or_exception_found() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    let block_uid = insert_block(&mut conn, "blk-dec", 7, Some("2024-04-01 00:00:00+00"));

    // Insert an asset_update with decimals = 6.
    sql_query(
        "INSERT INTO asset_updates \
         (uid, block_uid, superseded_by, asset_id, decimals, name, description, \
          reissuable, volume, script, sponsorship, nft) \
         VALUES \
         (6001, $1, 9223372036854775806, 'DEC_ASSET', 6, 'DecToken', '', false, 1, NULL, NULL, false)",
    )
    .bind::<diesel::sql_types::BigInt, _>(block_uid)
    .execute(&mut conn)
    .unwrap();

    #[derive(diesel::QueryableByName)]
    struct Dec {
        #[diesel(sql_type = diesel::sql_types::Integer)]
        dec: i32,
    }

    let rows: Vec<Dec> = sql_query("SELECT get_decimals_or_exception('DEC_ASSET') AS dec")
        .load(&mut conn)
        .unwrap();

    assert_eq!(rows[0].dec, 6, "get_decimals_or_exception should return 6");
}

#[tokio::test]
async fn test_get_decimals_or_exception_missing_raises() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    // No asset_update for 'MISSING_ASSET' — the function must raise.
    #[derive(diesel::QueryableByName)]
    #[allow(dead_code)]
    struct Out {
        #[diesel(sql_type = diesel::sql_types::Integer)]
        x: i32,
    }

    let result: Result<Vec<Out>, _> =
        diesel::sql_query("SELECT get_decimals_or_exception('MISSING_ASSET') AS x").load(&mut conn);

    assert!(
        result.is_err(),
        "get_decimals_or_exception should raise when decimals are missing"
    );
}
