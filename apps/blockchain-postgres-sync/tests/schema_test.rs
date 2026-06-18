//! Schema-correctness integration tests.
//!
//! Verifies that the migration-applied schema has the expected tables,
//! columns, and indexes so that application queries will succeed at runtime.
//!
//! Run with:
//!   cargo test --test schema_test -- --test-threads=1

#![allow(clippy::unwrap_used)]

use diesel::{Connection, RunQueryDsl, pg::PgConnection, sql_query};
use diesel_migrations::{EmbeddedMigrations, MigrationHarness, embed_migrations};
use testcontainers::{ContainerAsync, ImageExt, runners::AsyncRunner};
use testcontainers_modules::postgres::Postgres;

const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

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

    let url = format!("postgres://postgres:postgres@{host}:{port}/postgres");
    (container, url)
}

fn migrate_and_connect(url: &str) -> PgConnection {
    let mut conn = PgConnection::establish(url).expect("connect failed");
    conn.run_pending_migrations(MIGRATIONS)
        .expect("migrations failed");
    conn
}

// ─── Helper: check table exists ──────────────────────────────────────────────

fn table_exists(conn: &mut PgConnection, table_name: &str) -> bool {
    #[derive(diesel::QueryableByName)]
    struct Exists {
        #[diesel(sql_type = diesel::sql_types::BigInt)]
        cnt: i64,
    }

    let rows: Vec<Exists> = sql_query(
        "SELECT COUNT(*)::bigint AS cnt \
         FROM information_schema.tables \
         WHERE table_schema = 'public' AND table_name = $1",
    )
    .bind::<diesel::sql_types::Text, _>(table_name)
    .load(conn)
    .unwrap();

    rows.first().map_or(false, |r| r.cnt > 0)
}

// ─── Helper: check column exists ─────────────────────────────────────────────

fn column_exists(conn: &mut PgConnection, table_name: &str, column_name: &str) -> bool {
    #[derive(diesel::QueryableByName)]
    struct Exists {
        #[diesel(sql_type = diesel::sql_types::BigInt)]
        cnt: i64,
    }

    let rows: Vec<Exists> = sql_query(
        "SELECT COUNT(*)::bigint AS cnt \
         FROM information_schema.columns \
         WHERE table_schema = 'public' \
           AND table_name  = $1 \
           AND column_name = $2",
    )
    .bind::<diesel::sql_types::Text, _>(table_name)
    .bind::<diesel::sql_types::Text, _>(column_name)
    .load(conn)
    .unwrap();

    rows.first().map_or(false, |r| r.cnt > 0)
}

// ─── Helper: check index exists ──────────────────────────────────────────────

fn index_exists(conn: &mut PgConnection, index_name: &str) -> bool {
    #[derive(diesel::QueryableByName)]
    struct Exists {
        #[diesel(sql_type = diesel::sql_types::BigInt)]
        cnt: i64,
    }

    let rows: Vec<Exists> = sql_query(
        "SELECT COUNT(*)::bigint AS cnt \
         FROM pg_indexes \
         WHERE schemaname = 'public' AND indexname = $1",
    )
    .bind::<diesel::sql_types::Text, _>(index_name)
    .load(conn)
    .unwrap();

    rows.first().map_or(false, |r| r.cnt > 0)
}

// ─── Test: core tables exist ─────────────────────────────────────────────────

#[tokio::test]
async fn test_core_tables_exist() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    let required = [
        "blocks_microblocks",
        "txs",
        "txs_1",
        "txs_2",
        "txs_3",
        "txs_4",
        "txs_5",
        "txs_6",
        "txs_7",
        "txs_8",
        "txs_9",
        "txs_10",
        "txs_11",
        "txs_11_transfers",
        "txs_12",
        "txs_12_data",
        "txs_13",
        "txs_14",
        "txs_15",
        "txs_16",
        "txs_16_args",
        "txs_16_payment",
        "txs_17",
        "txs_18",
        "txs_18_args",
        "txs_18_payment",
        "asset_updates",
        "asset_origins",
        "asset_tickers",
        "assets_metadata",
        "candles",
        "pairs",
        "dcc_data",
    ];

    for table in required {
        assert!(
            table_exists(&mut conn, table),
            "table '{table}' is missing from schema"
        );
    }
}

// ─── Test: blocks_microblocks columns ────────────────────────────────────────

#[tokio::test]
async fn test_blocks_microblocks_columns() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    for col in ["uid", "id", "height", "time_stamp"] {
        assert!(
            column_exists(&mut conn, "blocks_microblocks", col),
            "blocks_microblocks.{col} is missing"
        );
    }
}

// ─── Test: txs table required columns ────────────────────────────────────────

#[tokio::test]
async fn test_txs_columns() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    let required_cols = [
        "uid",
        "tx_type",
        "sender",
        "sender_public_key",
        "time_stamp",
        "height",
        "id",
        "signature",
        "proofs",
        "tx_version",
        "fee",
        "status",
        "block_uid",
    ];

    for col in required_cols {
        assert!(column_exists(&mut conn, "txs", col), "txs.{col} is missing");
    }
}

// ─── Test: candles table columns ─────────────────────────────────────────────

#[tokio::test]
async fn test_candles_columns() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    let required_cols = [
        "time_start",
        "amount_asset_id",
        "price_asset_id",
        "low",
        "high",
        "volume",
        "quote_volume",
        "max_height",
        "txs_count",
        "weighted_average_price",
        "open",
        "close",
        "interval",
        "matcher_address",
    ];

    for col in required_cols {
        assert!(
            column_exists(&mut conn, "candles", col),
            "candles.{col} is missing"
        );
    }
}

// ─── Test: pairs table has volume_dcc column (post-rename migration) ──────────

#[tokio::test]
async fn test_pairs_has_volume_dcc_column() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    assert!(
        column_exists(&mut conn, "pairs", "volume_dcc"),
        "pairs.volume_dcc is missing (rename migration may not have applied)"
    );
    // The old column name must be gone.
    assert!(
        !column_exists(&mut conn, "pairs", "volume_waves"),
        "pairs.volume_waves still exists — rename migration did not apply"
    );
}

// ─── Test: dcc_data table exists (was waves_data before rename) ───────────────

#[tokio::test]
async fn test_dcc_data_table_exists() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    assert!(
        table_exists(&mut conn, "dcc_data"),
        "dcc_data table is missing"
    );
    assert!(
        !table_exists(&mut conn, "waves_data"),
        "waves_data still exists — rename migration did not apply"
    );
}

// ─── Test: key query indexes exist ───────────────────────────────────────────

#[tokio::test]
async fn test_key_indexes_exist() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    let required_indexes = [
        // blocks
        "blocks_microblocks_id_idx",
        "blocks_microblocks_time_stamp_uid_idx",
        // txs
        "txs_id_idx",
        "txs_height_idx",
        "txs_sender_uid_idx",
        "txs_tx_type_idx",
        "txs_time_stamp_uid_idx",
        // tx type-specific
        "txs_4_recipient_address_uid_idx",
        "txs_7_amount_asset_id_uid_idx",
        "txs_7_price_asset_id_uid_idx",
        "txs_10_alias_uid_idx",
        "txs_16_dapp_address_uid_idx",
        // asset
        "asset_updates_block_uid_idx",
        "asset_tickers_block_uid_idx",
        // candles
        "candles_max_height_index",
        "candles_interval_time_start",
    ];

    for idx in required_indexes {
        assert!(
            index_exists(&mut conn, idx),
            "index '{idx}' is missing from schema"
        );
    }
}

// ─── Test: asset_updates columns ─────────────────────────────────────────────

#[tokio::test]
async fn test_asset_updates_columns() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    for col in [
        "uid",
        "block_uid",
        "superseded_by",
        "asset_id",
        "decimals",
        "name",
        "description",
        "reissuable",
        "volume",
        "script",
        "sponsorship",
        "nft",
    ] {
        assert!(
            column_exists(&mut conn, "asset_updates", col),
            "asset_updates.{col} is missing"
        );
    }
}
