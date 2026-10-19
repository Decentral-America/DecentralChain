//! AUD-062: every state key BPS writes is also recorded in its address's state
//! index set, so the websocket-api can resolve multi-topics per address.
//!
//! Run with: cargo test --test `publisher_redis`

#![allow(clippy::unwrap_used)]

use app_lib::publisher::{DataEntryEvent, Publisher, state_index_key};
use fred::interfaces::{ClientLike, KeysInterface, SetsInterface};
use fred::prelude::{Builder, Config};
use testcontainers::GenericImage;
use testcontainers::core::{IntoContainerPort, WaitFor};
use testcontainers::runners::AsyncRunner;

#[tokio::test]
async fn publish_batch_sets_value_and_indexes_key_by_address() {
    let container = GenericImage::new("redis", "8.2-alpine")
        .with_exposed_port(6379.tcp())
        .with_wait_for(WaitFor::message_on_stdout("Ready to accept connections"))
        .start()
        .await
        .unwrap();
    let host = container.get_host().await.unwrap();
    let port = container.get_host_port_ipv4(6379).await.unwrap();
    let url = format!("redis://{host}:{port}/");

    let publisher = Publisher::new(&url).await.unwrap();
    let events = vec![
        DataEntryEvent {
            channel: "topic://state/3MA/bal_1".to_owned(),
            value: "1".to_owned(),
        },
        DataEntryEvent {
            channel: "topic://state/3MA/other".to_owned(),
            value: "2".to_owned(),
        },
        DataEntryEvent {
            channel: "topic://state/3MB/bal_1".to_owned(),
            value: "3".to_owned(),
        },
    ];
    publisher.publish_batch(&events).await;

    let client = Builder::from_config(Config::from_url(&url).unwrap())
        .build()
        .unwrap();
    client.init().await.unwrap();

    let value: Option<String> = client.get("topic://state/3MA/bal_1").await.unwrap();
    assert_eq!(value.as_deref(), Some("1"));

    let mut a: Vec<String> = client.smembers("topic://state-index/3MA").await.unwrap();
    a.sort();
    assert_eq!(
        a,
        vec![
            "topic://state/3MA/bal_1".to_owned(),
            "topic://state/3MA/other".to_owned()
        ]
    );
    let b: Vec<String> = client.smembers("topic://state-index/3MB").await.unwrap();
    assert_eq!(b, vec!["topic://state/3MB/bal_1".to_owned()]);

    // Re-publishing an existing key leaves the index unchanged (a set, no duplicates).
    publisher.publish_batch(&events[..1]).await;
    let n: i64 = client.scard("topic://state-index/3MA").await.unwrap();
    assert_eq!(n, 2);

    assert_eq!(
        state_index_key("topic://state/3MA/bal_1").as_deref(),
        Some("topic://state-index/3MA")
    );
}
