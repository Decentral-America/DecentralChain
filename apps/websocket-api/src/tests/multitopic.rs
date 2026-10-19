//! A key that appears after a multi-topic subscription is delivered to the
//! subscriber as an `update` on the multi-topic key.

use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::time::{Duration, Instant};

use axum::extract::ws::Message;
use tokio::sync::{Mutex, mpsc};

use crate::client::{Client, ClientId, ClientSubscriptionKey, Clients, Topics};
use crate::error::Error;
use crate::repo::Repo;
use crate::shard::Sharded;
use crate::topic::Topic;
use crate::websocket::updates_handler;

struct NoRepo;

impl Repo for NoRepo {
    async fn get_connection_id(&self) -> Result<ClientId, Error> {
        Ok(1)
    }
    async fn ping(&self) -> Result<(), Error> {
        Ok(())
    }
    async fn subscribe<S: Into<String> + Send + Sync>(&self, _key: S) -> Result<(), Error> {
        Ok(())
    }
    async fn get_by_key(&self, _key: &str) -> Result<Option<String>, Error> {
        Ok(None)
    }
    async fn get_by_keys(&self, keys: Vec<String>) -> Result<Vec<Option<String>>, Error> {
        Ok(vec![None; keys.len()])
    }
    async fn state_index_scan(
        &self,
        _address: &str,
        _keep: &(dyn Fn(&str) -> bool + Sync),
        _limit: usize,
    ) -> Result<Vec<String>, Error> {
        Ok(vec![])
    }
    async fn refresh(&self, topics: Vec<Topic>) -> Result<HashMap<Topic, Instant>, Error> {
        Ok(topics.into_iter().map(|t| (t, Instant::now())).collect())
    }
}

#[tokio::test]
async fn new_matching_key_is_delivered_on_the_multitopic_key() {
    let mt_uri = "topic://state?address__in[]=3MA&key__match_any[]=bal_*";
    let mt = Topic::parse_str(mt_uri).unwrap();
    let key = ClientSubscriptionKey::new(mt_uri);

    let clients = Arc::new(Sharded::<Clients>::new(4));
    let topics = Arc::new(Topics::default());

    let (client_tx, mut client_rx) = mpsc::unbounded_channel::<Message>();
    let (kill_tx, _kill_rx) = tokio::sync::oneshot::channel();
    let mut client = Client::new(7, client_tx, kill_tx, None);
    client.add_direct_subscription(mt.clone(), key.clone());
    clients
        .get(&7usize)
        .write()
        .await
        .insert(7, Arc::new(Mutex::new(client)));
    {
        let mut t = topics.write().await;
        t.add_subscription(mt.clone(), 7, key);
        let _ = t.update_multitopic_info(mt.clone(), HashSet::new());
    }

    let (updates_tx, updates_rx) = mpsc::channel(8);
    let handler = tokio::spawn(updates_handler(
        updates_rx,
        clients.clone(),
        topics.clone(),
        Arc::new(NoRepo),
        5000,
    ));
    updates_tx
        .send((
            Topic::parse_str("topic://state/3MA/bal_new").unwrap(),
            "\"v\"".to_owned(),
        ))
        .await
        .unwrap();

    let msg = tokio::time::timeout(Duration::from_secs(5), client_rx.recv())
        .await
        .expect("update within 5 s")
        .expect("client channel open");
    let Message::Text(text) = msg else {
        panic!("expected a text frame")
    };
    let v: serde_json::Value = serde_json::from_str(text.as_str()).unwrap();
    assert_eq!(v["type"], "update");
    assert_eq!(v["topic"], mt_uri);
    assert_eq!(v["value"], "[\"\\\"v\\\"\"]");

    handler.abort();
}

/// Live expansion stops adding indirect subtopics once the connection reaches
/// its indirect-subtopic cap.
#[tokio::test]
async fn live_expansion_respects_indirect_subtopic_cap() {
    let mt_uri = "topic://state?address__in[]=3MA&key__match_any[]=bal_*";
    let mt = Topic::parse_str(mt_uri).unwrap();
    let key = ClientSubscriptionKey::new(mt_uri);

    let clients = Arc::new(Sharded::<Clients>::new(4));
    let topics = Arc::new(Topics::default());

    let (client_tx, mut client_rx) = mpsc::unbounded_channel::<Message>();
    let (kill_tx, _kill_rx) = tokio::sync::oneshot::channel();
    let mut client = Client::new(7, client_tx, kill_tx, None);
    client.add_direct_subscription(mt.clone(), key.clone());
    let client = Arc::new(Mutex::new(client));
    clients.get(&7usize).write().await.insert(7, client.clone());
    {
        let mut t = topics.write().await;
        t.add_subscription(mt.clone(), 7, key);
        let _ = t.update_multitopic_info(mt.clone(), HashSet::new());
    }

    let (updates_tx, updates_rx) = mpsc::channel(8);
    let handler = tokio::spawn(updates_handler(
        updates_rx,
        clients.clone(),
        topics.clone(),
        Arc::new(NoRepo),
        1,
    ));
    for k in ["bal_1", "bal_2"] {
        updates_tx
            .send((
                Topic::parse_str(&format!("topic://state/3MA/{k}")).unwrap(),
                format!("\"{k}\""),
            ))
            .await
            .unwrap();
    }

    let msg = tokio::time::timeout(Duration::from_secs(5), client_rx.recv())
        .await
        .expect("first update within 5 s")
        .expect("client channel open");
    let Message::Text(text) = msg else {
        panic!("expected a text frame")
    };
    let v: serde_json::Value = serde_json::from_str(text.as_str()).unwrap();
    assert_eq!(v["value"], "[\"\\\"bal_1\\\"\"]");

    assert!(
        tokio::time::timeout(Duration::from_millis(300), client_rx.recv())
            .await
            .is_err(),
        "second key must not be delivered past the indirect cap"
    );
    assert_eq!(client.lock().await.indirect_subscriptions_count(), 1);
    let bal_2 = Topic::parse_str("topic://state/3MA/bal_2").unwrap();
    assert!(
        topics
            .read()
            .await
            .get_subscribed_clients(&bal_2)
            .is_empty(),
        "capped key must not be registered for the client"
    );

    handler.abort();
}
