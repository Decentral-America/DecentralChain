//! PostgreSQL integration tests.
//!
//! Each test function spins up a throwaway PostgreSQL Docker container via
//! `testcontainers`, runs the full diesel migration suite against it, exercises
//! one concern, then lets the container be dropped automatically.
//!
//! Run with:
//!   cargo test --test db_integration -- --test-threads=1
//!
//! Docker must be running on the host for these tests to pass.

#![allow(clippy::unwrap_used)]

use diesel::{Connection, RunQueryDsl, pg::PgConnection, sql_query};
use diesel_migrations::{EmbeddedMigrations, MigrationHarness, embed_migrations};
use testcontainers::{ContainerAsync, ImageExt, runners::AsyncRunner};
use testcontainers_modules::postgres::Postgres;

const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

/// Helper: start a Postgres container and return the connection URL.
async fn start_pg() -> (ContainerAsync<Postgres>, String) {
    let container = Postgres::default()
        .with_tag("16-alpine")
        .start()
        .await
        .expect("failed to start postgres container — is Docker running?");

    let host = container
        .get_host()
        .await
        .expect("container host unavailable");
    let port = container
        .get_host_port_ipv4(5432)
        .await
        .expect("container port unavailable");

    let url = format!("postgres://postgres:postgres@{host}:{port}/postgres");
    (container, url)
}

/// Apply all diesel migrations and return an open connection.
fn migrate_and_connect(url: &str) -> PgConnection {
    let mut conn =
        PgConnection::establish(url).expect("failed to connect to test postgres container");
    conn.run_pending_migrations(MIGRATIONS)
        .expect("failed to apply migrations");
    conn
}

// ─── Test: connection can be established ────────────────────────────────────

#[tokio::test]
async fn test_postgres_connection() {
    let (_container, url) = start_pg().await;

    let conn_result = PgConnection::establish(&url);
    assert!(
        conn_result.is_ok(),
        "should be able to connect to test container"
    );
}

// ─── Test: migrations apply cleanly ─────────────────────────────────────────

#[tokio::test]
async fn test_migrations_apply_cleanly() {
    let (_container, url) = start_pg().await;
    let mut conn = PgConnection::establish(&url).expect("connect failed");

    let pending_before = conn
        .pending_migrations(MIGRATIONS)
        .expect("listing pending migrations failed");
    let total = pending_before.len();
    assert!(total > 0, "expected at least one migration to apply");

    let applied = conn
        .run_pending_migrations(MIGRATIONS)
        .expect("migrations failed");
    assert_eq!(
        applied.len(),
        total,
        "all pending migrations should have been applied"
    );

    // After running, there must be zero pending migrations left.
    let pending_after = conn
        .pending_migrations(MIGRATIONS)
        .expect("listing pending migrations failed");
    assert!(
        pending_after.is_empty(),
        "expected zero pending migrations after a full run"
    );
}

// ─── Test: candle insertion ──────────────────────────────────────────────────

#[tokio::test]
async fn test_candle_insertion() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    // Insert a single candle row directly via raw SQL (avoids needing a full
    // Insertable struct and keeps this test self-contained).
    sql_query(
        "INSERT INTO candles \
         (time_start, amount_asset_id, price_asset_id, low, high, volume, \
          quote_volume, max_height, txs_count, weighted_average_price, \
          open, close, interval, matcher_address) \
         VALUES \
         ('2024-01-01 00:00:00', 'ASSET_A', 'DCC', 1.5, 2.5, 1000.0, \
          500.0, 42, 10, 2.0, 1.5, 2.5, '1m', '3PMatcher000000000000000000000000001')",
    )
    .execute(&mut conn)
    .expect("candle insert failed");

    // Read it back and verify key fields.
    #[derive(diesel::QueryableByName, Debug)]
    struct Row {
        #[diesel(sql_type = diesel::sql_types::Varchar)]
        amount_asset_id: String,
        #[diesel(sql_type = diesel::sql_types::Varchar)]
        price_asset_id: String,
        #[diesel(sql_type = diesel::sql_types::Varchar)]
        interval: String,
        #[diesel(sql_type = diesel::sql_types::Integer)]
        max_height: i32,
        #[diesel(sql_type = diesel::sql_types::Integer)]
        txs_count: i32,
    }

    let rows: Vec<Row> = sql_query(
        "SELECT amount_asset_id, price_asset_id, interval, max_height, txs_count \
         FROM candles \
         WHERE amount_asset_id = 'ASSET_A'",
    )
    .load(&mut conn)
    .expect("candle select failed");

    assert_eq!(rows.len(), 1, "expected exactly one candle row");
    let row = &rows[0];
    assert_eq!(row.amount_asset_id, "ASSET_A");
    assert_eq!(row.price_asset_id, "DCC");
    assert_eq!(row.interval, "1m");
    assert_eq!(row.max_height, 42);
    assert_eq!(row.txs_count, 10);
}
