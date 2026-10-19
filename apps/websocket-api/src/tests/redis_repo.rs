//! `RepoImpl` against a real Redis (testcontainers; Docker must be running).
//!
//! The state index set for one address is read with `SSCAN`, whose pages hold
//! about `STATE_INDEX_SCAN_COUNT` (1000) members, so an index with more members
//! than that is only resolved correctly if every cursor page is consumed.

use std::time::Duration;

use fred::interfaces::{ClientLike, SetsInterface};
use testcontainers::core::{IntoContainerPort, WaitFor};
use testcontainers::runners::AsyncRunner;
use testcontainers::{ContainerAsync, GenericImage};

use crate::error::Error;
use crate::repo::{Repo, RepoConfig, RepoImpl, state_index_key};
use crate::topic::Topic;
use crate::websocket::resolve_multitopic;

const ADDRESS: &str = "3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr";
const MEMBERS: usize = 2500;
/// Every fourth member is a `bal_*` key.
const MATCHING: usize = MEMBERS / 4;

async fn redis_with_index() -> (ContainerAsync<GenericImage>, RepoImpl) {
    let container = GenericImage::new("redis", "8.2-alpine")
        .with_exposed_port(6379.tcp())
        .with_wait_for(WaitFor::message_on_stdout("Ready to accept connections"))
        .start()
        .await
        .unwrap();
    let host = container.get_host().await.unwrap().to_string();
    let port = container.get_host_port_ipv4(6379).await.unwrap();
    let pool = RepoImpl::build_pool(&RepoConfig {
        host,
        port,
        username: String::new(),
        password: String::new(),
        key_ttl: Duration::from_secs(60),
        max_pool_size: 2,
        refresh_threads: 1,
    })
    .unwrap();
    pool.init().await.unwrap();

    let members: Vec<String> = (0..MEMBERS)
        .map(|i| {
            let key = if i % 4 == 0 {
                format!("bal_{i}")
            } else {
                format!("other_{i}")
            };
            format!("topic://state/{ADDRESS}/{key}")
        })
        .collect();
    let added: i64 = pool
        .next()
        .sadd(state_index_key(ADDRESS), members)
        .await
        .unwrap();
    assert_eq!(usize::try_from(added).unwrap(), MEMBERS);

    (container, RepoImpl::new(pool, Duration::from_secs(60), 1))
}

fn is_bal(member: &str) -> bool {
    member.contains("/bal_")
}

#[tokio::test]
async fn state_index_scan_reads_every_sscan_page() {
    let (_container, repo) = redis_with_index().await;

    let scan = repo
        .state_index_scan(ADDRESS, &is_bal, usize::MAX - 1, usize::MAX - 1)
        .await
        .unwrap();
    assert_eq!(scan.examined, MEMBERS, "every index member is examined");
    assert_eq!(scan.kept.len(), MATCHING);
    assert!(scan.kept.iter().all(|m| is_bal(m)));
}

#[tokio::test]
async fn state_index_scan_stops_past_the_examination_budget() {
    let (_container, repo) = redis_with_index().await;

    let scan = repo
        .state_index_scan(ADDRESS, &is_bal, usize::MAX - 1, 1200)
        .await
        .unwrap();
    assert_eq!(
        scan.examined, 1201,
        "stops at the first member past the budget"
    );
}

#[tokio::test]
async fn multitopic_resolves_an_address_with_more_than_one_scan_page() {
    let (_container, repo) = redis_with_index().await;

    let mt = Topic::parse_str(&format!(
        "topic://state?address__in[]={ADDRESS}&key__match_any[]=bal_*"
    ))
    .unwrap();
    let filter = mt.data().as_state_multi().unwrap();
    let resolved = resolve_multitopic(&repo, &filter).await.unwrap();
    assert_eq!(resolved.len(), MATCHING);
    let mut sorted = resolved.clone();
    sorted.sort();
    assert_eq!(resolved, sorted, "resolution is sorted");

    // A pattern matching more than MAX_MULTITOPIC_SUBTOPICS keys is refused.
    let wide = Topic::parse_str(&format!(
        "topic://state?address__in[]={ADDRESS}&key__match_any[]=*"
    ))
    .unwrap();
    let filter = wide.data().as_state_multi().unwrap();
    assert!(matches!(
        resolve_multitopic(&repo, &filter).await,
        Err(Error::SubscriptionLimit(_))
    ));
}
