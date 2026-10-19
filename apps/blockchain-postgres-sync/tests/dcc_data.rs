//! AUD-142: `dcc_data` must hold one row per height and roll back with its block.
//!
//! Run with: cargo test --test `dcc_data`

#![allow(clippy::unwrap_used)]

use app_lib::consumer::models::block_microblock::BlockMicroblock;
use app_lib::consumer::models::dcc_data::DccData;
use app_lib::consumer::repo::RepoOperations;
use app_lib::consumer::repo::pg::PgRepoOperations;
use app_lib::consumer::{UidHeight, rollback};
use bigdecimal::BigDecimal;
use chrono::NaiveDateTime;
use diesel::sql_types::{BigInt, Integer, Text};
use diesel::{Connection, RunQueryDsl, pg::PgConnection, sql_query};
use diesel_migrations::{EmbeddedMigrations, MigrationHarness, embed_migrations};
use testcontainers::{ContainerAsync, ImageExt, runners::AsyncRunner};
use testcontainers_modules::postgres::Postgres;

const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

async fn start_pg() -> (ContainerAsync<Postgres>, String) {
    let container = Postgres::default()
        .with_tag("18-alpine")
        .start()
        .await
        .unwrap();
    let host = container.get_host().await.unwrap();
    let port = container.get_host_port_ipv4(5432).await.unwrap();
    (
        container,
        format!("postgres://postgres:postgres@{host}:{port}/postgres"),
    )
}

fn key_block(id: &str, height: i32) -> BlockMicroblock {
    BlockMicroblock {
        id: id.to_owned(),
        time_stamp: Some(
            NaiveDateTime::parse_from_str("2026-10-01 00:00:00", "%Y-%m-%d %H:%M:%S").unwrap(),
        ),
        height,
    }
}

fn row(height: i32, quantity: i64, block_uid: i64) -> DccData {
    DccData {
        height,
        quantity: BigDecimal::from(quantity),
        block_uid: Some(block_uid),
    }
}

#[derive(diesel::QueryableByName, Debug, PartialEq, Eq)]
struct Row {
    #[diesel(sql_type = Integer)]
    height: i32,
    #[diesel(sql_type = Text)]
    quantity: String,
    #[diesel(sql_type = BigInt)]
    block_uid: i64,
}

fn rows(conn: &mut PgConnection) -> Vec<(i32, String, i64)> {
    sql_query("SELECT height, quantity::text AS quantity, block_uid FROM dcc_data ORDER BY height")
        .load::<Row>(conn)
        .unwrap()
        .into_iter()
        .map(|r| (r.height, r.quantity, r.block_uid))
        .collect()
}

#[tokio::test]
async fn one_row_per_height_upserted_and_rolled_back_with_its_block() {
    let (_container, url) = start_pg().await;
    let mut conn = PgConnection::establish(&url).unwrap();
    conn.run_pending_migrations(MIGRATIONS).unwrap();

    let (b1, b2) = {
        let mut ops = PgRepoOperations { conn: &mut conn };
        let b1 = ops
            .insert_blocks_or_microblocks(&[key_block("k1", 1)])
            .unwrap()[0];
        let b2 = ops
            .insert_blocks_or_microblocks(&[key_block("k2", 2)])
            .unwrap()[0];
        // Same quantity at two heights: both rows must be kept (the old quantity PK dropped one).
        ops.insert_dcc_data(&[row(1, 500, b1), row(2, 500, b2)])
            .unwrap();
        // The same height twice in one batch: the last value wins, no ON CONFLICT error.
        ops.insert_dcc_data(&[row(2, 600, b2), row(2, 700, b2)])
            .unwrap();
        (b1, b2)
    };
    assert_eq!(
        rows(&mut conn),
        vec![(1, "500".to_owned(), b1), (2, "700".to_owned(), b2)]
    );

    {
        let mut ops = PgRepoOperations { conn: &mut conn };
        rollback(&mut ops, &[UidHeight { uid: b1, height: 1 }], false).unwrap();
    }
    assert_eq!(rows(&mut conn), vec![(1, "500".to_owned(), b1)]);
}
