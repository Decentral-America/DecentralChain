//! Regression test for AUD-016: a microblock squash must keep `CommitToGeneration`
//! (type 19) transactions and re-point them at the key block.
//!
//! Run with: cargo test --test `txs19_squash`

#![allow(clippy::unwrap_used)]

use app_lib::consumer::models::block_microblock::BlockMicroblock;
use app_lib::consumer::models::txs::Tx19;
use app_lib::consumer::repo::RepoOperations;
use app_lib::consumer::repo::pg::PgRepoOperations;
use app_lib::consumer::{UidHeight, rollback, squash_microblocks};
use chrono::NaiveDateTime;
use diesel::sql_types::BigInt;
use diesel::{Connection, RunQueryDsl, pg::PgConnection, sql_query};
use diesel_migrations::{EmbeddedMigrations, MigrationHarness, embed_migrations};
use testcontainers::{ContainerAsync, ImageExt, runners::AsyncRunner};
use testcontainers_modules::postgres::Postgres;

const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

async fn start_pg() -> (ContainerAsync<Postgres>, String) {
    // Same major version as production (Postgres 18 on the testnet VPS).
    let container = Postgres::default()
        .with_tag("18-alpine")
        .start()
        .await
        .expect("failed to start postgres container — is Docker running?");
    let host = container.get_host().await.unwrap();
    let port = container.get_host_port_ipv4(5432).await.unwrap();
    (
        container,
        format!("postgres://postgres:postgres@{host}:{port}/postgres"),
    )
}

fn migrate_and_connect(url: &str) -> PgConnection {
    let mut conn = PgConnection::establish(url).unwrap();
    conn.run_pending_migrations(MIGRATIONS).unwrap();
    conn
}

fn ts(s: &str) -> NaiveDateTime {
    NaiveDateTime::parse_from_str(s, "%Y-%m-%d %H:%M:%S").unwrap()
}

fn block(id: &str, height: i32, time_stamp: Option<&str>) -> BlockMicroblock {
    BlockMicroblock {
        id: id.to_owned(),
        time_stamp: time_stamp.map(ts),
        height,
    }
}

fn tx19(uid: i64, height: i32, block_uid: i64) -> Tx19 {
    Tx19 {
        uid,
        height,
        tx_type: 19,
        id: format!("ctg-{uid}"),
        time_stamp: ts("2026-10-01 00:00:01"),
        signature: None,
        fee: 10_000_000,
        proofs: Some(vec!["proof".to_owned()]),
        tx_version: Some(1),
        block_uid,
        sender: "3Nsender".to_owned(),
        sender_public_key: "senderPublicKey".to_owned(),
        status: "succeeded".to_owned(),
        endorser_public_key: "endorserPublicKey".to_owned(),
        generation_period_start: 100,
    }
}

#[derive(diesel::QueryableByName)]
struct UidBlock {
    #[diesel(sql_type = BigInt)]
    uid: i64,
    #[diesel(sql_type = BigInt)]
    block_uid: i64,
}

fn txs19_rows(conn: &mut PgConnection) -> Vec<(i64, i64)> {
    sql_query("SELECT uid, block_uid FROM txs_19 ORDER BY uid")
        .load::<UidBlock>(conn)
        .unwrap()
        .into_iter()
        .map(|r| (r.uid, r.block_uid))
        .collect()
}

#[derive(diesel::QueryableByName)]
struct Cnt {
    #[diesel(sql_type = BigInt)]
    cnt: i64,
}

#[tokio::test]
async fn squash_keeps_commit_to_generation_txs() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    let key_uid = {
        let mut ops = PgRepoOperations { conn: &mut conn };
        let key_uid = ops
            .insert_blocks_or_microblocks(&[block("key-10", 10, Some("2026-10-01 00:00:00"))])
            .unwrap()[0];
        let micro_uid = ops
            .insert_blocks_or_microblocks(&[block("micro-10a", 10, None)])
            .unwrap()[0];
        ops.insert_txs_19(vec![tx19(1_000_001, 10, micro_uid)])
            .unwrap();

        squash_microblocks(&mut ops, false).unwrap();
        key_uid
    };

    assert_eq!(
        txs19_rows(&mut conn),
        vec![(1_000_001, key_uid)],
        "the type-19 tx must survive the squash and point at the key block"
    );
    let through_parent: Vec<Cnt> =
        sql_query("SELECT count(*)::bigint AS cnt FROM txs WHERE tx_type = 19")
            .load(&mut conn)
            .unwrap();
    assert_eq!(
        through_parent[0].cnt, 1,
        "txs_19 rows must be visible through txs"
    );
}

#[tokio::test]
async fn rollback_removes_commit_to_generation_txs_without_fk_errors() {
    let (_container, url) = start_pg().await;
    let mut conn = migrate_and_connect(&url);

    {
        let mut ops = PgRepoOperations { conn: &mut conn };
        let uid_10 = ops
            .insert_blocks_or_microblocks(&[block("key-10", 10, Some("2026-10-01 00:00:00"))])
            .unwrap()[0];
        let uid_11 = ops
            .insert_blocks_or_microblocks(&[block("key-11", 11, Some("2026-10-01 00:01:00"))])
            .unwrap()[0];
        ops.insert_txs_19(vec![tx19(1_100_001, 11, uid_11)])
            .unwrap();

        rollback(
            &mut ops,
            &[UidHeight {
                uid: uid_10,
                height: 10,
            }],
            false,
        )
        .unwrap();
    }

    assert!(
        txs19_rows(&mut conn).is_empty(),
        "rollback must delete the type-19 tx"
    );
}
