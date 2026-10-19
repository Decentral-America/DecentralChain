//! AUD-002: BPS must apply its migrations on start and must refuse to resume an
//! index whose genesis / resume block differs from the node's chain.
//!
//! Run with: cargo test --test ancestry

#![allow(clippy::unwrap_used)]

use std::collections::HashMap;

use app_lib::config::postgres::Config as PgConfig;
use app_lib::consumer::ancestry::{self, BlockIdSource, heights_to_check};
use app_lib::consumer::repo::pg;
use app_lib::consumer::resubscribe::is_stream_error;
use app_lib::db;
use app_lib::error::Error as AppError;
use diesel::sql_types::{Integer, Nullable, VarChar};
use diesel::{Connection, RunQueryDsl, pg::PgConnection, sql_query};
use testcontainers::{ContainerAsync, ImageExt, runners::AsyncRunner};
use testcontainers_modules::postgres::Postgres;

struct FakeNode(HashMap<u32, String>);

impl BlockIdSource for FakeNode {
    async fn block_id_at(&self, height: u32) -> Result<String, AppError> {
        self.0
            .get(&height)
            .cloned()
            .ok_or_else(|| AppError::StreamError(format!("node has no block at {height} yet")))
    }
}

fn node(blocks: &[(u32, &str)]) -> FakeNode {
    FakeNode(
        blocks
            .iter()
            .map(|(h, id)| (*h, (*id).to_owned()))
            .collect(),
    )
}

async fn start_pg() -> (ContainerAsync<Postgres>, PgConfig) {
    let container = Postgres::default()
        .with_tag("18-alpine")
        .start()
        .await
        .expect("failed to start postgres container — is Docker running?");
    let host = container.get_host().await.unwrap().to_string();
    let port = container.get_host_port_ipv4(5432).await.unwrap();
    let cfg = PgConfig {
        host,
        port,
        database: "postgres".to_owned(),
        user: "postgres".to_owned(),
        password: "postgres".to_owned(),
        poolsize: 2,
    };
    (container, cfg)
}

fn insert_block(conn: &mut PgConnection, id: &str, height: i32, ts: Option<&str>) {
    sql_query(
        "INSERT INTO blocks_microblocks (id, height, time_stamp) VALUES ($1, $2, $3::timestamptz)",
    )
    .bind::<VarChar, _>(id)
    .bind::<Integer, _>(height)
    .bind::<Nullable<VarChar>, _>(ts)
    .execute(conn)
    .unwrap();
}

#[test]
fn checks_genesis_and_the_last_solid_block() {
    assert_eq!(heights_to_check(0), Vec::<u32>::new());
    assert_eq!(heights_to_check(1), vec![1]);
    assert_eq!(heights_to_check(2), vec![1]);
    assert_eq!(heights_to_check(73_620), vec![1, 73_619]);
}

#[tokio::test]
async fn migrations_apply_on_start_and_ancestry_is_enforced() {
    let (_container, cfg) = start_pg().await;

    // Migrate-on-start: the first run applies everything, the second is a no-op.
    assert!(!db::run_pending_migrations(&cfg).unwrap().is_empty());
    assert!(db::run_pending_migrations(&cfg).unwrap().is_empty());

    let repo = pg::new(db::async_pool(&cfg).await.unwrap());

    // Empty index: nothing to compare, resume is allowed.
    ancestry::verify(&node(&[]), &repo).await.unwrap();

    let mut conn = PgConnection::establish(&cfg.database_url()).unwrap();
    insert_block(&mut conn, "genesis", 1, Some("2026-09-04 16:32:59+00"));
    insert_block(&mut conn, "block-2", 2, Some("2026-09-04 16:33:59+00"));
    insert_block(&mut conn, "block-3", 3, Some("2026-09-04 16:34:59+00"));

    // Same chain: genesis (1) and the last solid block (current 3 - 1 = 2) match.
    ancestry::verify(&node(&[(1, "genesis"), (2, "block-2")]), &repo)
        .await
        .unwrap();

    // Different genesis (re-genesis): fatal, not a retryable stream error.
    let err = ancestry::verify(&node(&[(1, "new-genesis"), (2, "block-2")]), &repo)
        .await
        .unwrap_err();
    assert!(
        !is_stream_error(&err),
        "a chain mismatch must not be retried: {err:#}"
    );
    assert!(
        err.chain().any(|c| matches!(
            c.downcast_ref::<AppError>(),
            Some(AppError::InconsistentDataError(_))
        )),
        "expected InconsistentDataError, got: {err:#}"
    );

    // Node not caught up to the resume height yet: retryable.
    let err = ancestry::verify(&node(&[(1, "genesis")]), &repo)
        .await
        .unwrap_err();
    assert!(
        is_stream_error(&err),
        "a node that is behind must be retried: {err:#}"
    );
}
