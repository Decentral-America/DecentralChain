//! AUD-149: the DCC pseudo-asset must report this chain's genesis timestamp.
//! AUD-148: the Waves-mainnet-matcher partial index is gone.
//!
//! Run with: cargo test --test `dcc_asset_view`

#![allow(clippy::unwrap_used)]

use diesel::sql_types::{BigInt, Text};
use diesel::{Connection, RunQueryDsl, pg::PgConnection, sql_query};
use diesel_migrations::{EmbeddedMigrations, MigrationHarness, embed_migrations};
use testcontainers::{ImageExt, runners::AsyncRunner};
use testcontainers_modules::postgres::Postgres;

const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

#[derive(diesel::QueryableByName)]
struct Ts {
    #[diesel(sql_type = Text)]
    ts: String,
}

#[derive(diesel::QueryableByName)]
struct Cnt {
    #[diesel(sql_type = BigInt)]
    cnt: i64,
}

#[tokio::test]
async fn dcc_issue_timestamp_is_the_genesis_block_time() {
    let container = Postgres::default()
        .with_tag("18-alpine")
        .start()
        .await
        .unwrap();
    let host = container.get_host().await.unwrap();
    let port = container.get_host_port_ipv4(5432).await.unwrap();
    let mut conn = PgConnection::establish(&format!(
        "postgres://postgres:postgres@{host}:{port}/postgres"
    ))
    .unwrap();
    conn.run_pending_migrations(MIGRATIONS).unwrap();
    sql_query("SET TIME ZONE 'UTC'").execute(&mut conn).unwrap();

    let empty: Vec<Ts> =
        sql_query("SELECT issue_timestamp::text AS ts FROM assets WHERE asset_id = 'DCC'")
            .load(&mut conn)
            .unwrap();
    assert_eq!(empty[0].ts, "1970-01-01 00:00:00+00");

    sql_query(
        "INSERT INTO blocks_microblocks (id, height, time_stamp) \
         VALUES ('genesis', 1, '2026-09-04 16:32:59+00')",
    )
    .execute(&mut conn)
    .unwrap();
    let got: Vec<Ts> =
        sql_query("SELECT issue_timestamp::text AS ts FROM assets WHERE asset_id = 'DCC'")
            .load(&mut conn)
            .unwrap();
    assert_eq!(got[0].ts, "2026-09-04 16:32:59+00");

    let idx: Vec<Cnt> = sql_query(
        "SELECT count(*)::bigint AS cnt FROM pg_indexes WHERE indexname = 'candles_assets_id_idx'",
    )
    .load(&mut conn)
    .unwrap();
    assert_eq!(idx[0].cnt, 0);
}
