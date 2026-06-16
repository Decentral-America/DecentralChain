use axum::extract::ws::{self, WebSocket};
use futures::{SinkExt, future};
use std::collections::HashSet;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::Mutex;

use crate::client::{Client, ClientId, Clients, MultitopicUpdate, Subscribed, Topics};
use crate::error::Error;
use crate::messages::IncomeMessage;
use crate::metrics::{
    CLIENTS, CLIENT_CONNECT, CLIENT_DISCONNECT, REDIS_QUEUE_DEPTH, SUBSCRIBED_MESSAGE_LATENCIES,
};
use crate::repo::Repo;
use crate::shard::Sharded;
use crate::topic::{StateSingle, Topic};

use self::values::{DataEntry, TopicValue, TopicValues};

const INVALID_MESSAGE_ERROR_CODE: u16 = 1;
const ALREADY_SUBSCRIBED_ERROR_CODE: u16 = 2;
const INVALID_TOPIC_ERROR_CODE: u16 = 3;

#[derive(Clone, Debug)]
pub struct HandleConnectionOptions {
    pub ping_interval: tokio::time::Duration,
    pub ping_failures_threshold: usize,
}

/// Shared state for an active WebSocket connection, passed to the inner run loop.
struct ConnectionState<R: Repo> {
    client: Arc<Mutex<Client>>,
    client_id: ClientId,
    request_id: Option<String>,
    topics: Arc<Topics>,
    repo: Arc<R>,
    options: HandleConnectionOptions,
}

pub async fn handle_connection<R: Repo>(
    mut socket: WebSocket,
    clients: Arc<Sharded<Clients>>,
    topics: Arc<Topics>,
    repo: Arc<R>,
    options: HandleConnectionOptions,
    request_id: Option<String>,
    shutdown_signal: tokio::sync::mpsc::Sender<()>,
) -> Result<(), Error> {
    let client_id = repo.get_connection_id().await?;

    tracing::info!(client_id, "client connected");

    let (client_tx, client_rx) = tokio::sync::mpsc::unbounded_channel();
    let (kill_tx, kill_rx) = tokio::sync::oneshot::channel();

    let client = Arc::new(Mutex::new(Client::new(
        client_id,
        client_tx,
        kill_tx,
        request_id.clone(),
    )));

    CLIENTS.inc();
    CLIENT_CONNECT.inc();

    clients
        .get(&client_id)
        .write()
        .await
        .insert(client_id, client.clone());

    let state = ConnectionState {
        client: client.clone(),
        client_id,
        request_id,
        topics: topics.clone(),
        repo,
        options,
    };

    tokio::select! {
        _ = run(&mut socket, &state, client_rx) => {}
        _ = shutdown_signal.closed() => {
            tracing::debug!(client_id, "shutdown signal received");
        }
        _ = kill_rx => {
            tracing::debug!(client_id, "graceful kill signal received");
        }
    }

    on_disconnect(socket, client, client_id, clients, topics).await;

    CLIENTS.dec();
    CLIENT_DISCONNECT.inc();

    Ok(())
}

async fn run<R: Repo>(
    socket: &mut WebSocket,
    state: &ConnectionState<R>,
    mut client_rx: tokio::sync::mpsc::UnboundedReceiver<ws::Message>,
) {
    let client = &state.client;
    let client_id = &state.client_id;
    let request_id = &state.request_id;
    let topics = &state.topics;
    let options = &state.options;
    let mut interval = tokio::time::interval(options.ping_interval);

    loop {
        tokio::select! {
            next = socket.recv() => {
                let msg = match next {
                    Some(Ok(m)) => m,
                    Some(Err(e)) => {
                        tracing::debug!(client_id, error = %e, "connection unexpectedly closed");
                        break;
                    }
                    None => break,
                };

                match msg {
                    ws::Message::Close(_) => {
                        tracing::debug!(client_id, "client sent close frame");
                        break;
                    }
                    ws::Message::Ping(_) | ws::Message::Pong(_) => continue,
                    _ => {}
                }

                let result = handle_income_message(
                    state.repo.clone(),
                    client.clone(),
                    *client_id,
                    topics.clone(),
                    msg,
                ).await;
                let send_err = match result {
                    Err(Error::UnknownIncomeMessage(detail)) => {
                        send_error(detail, "Invalid message", INVALID_MESSAGE_ERROR_CODE, client).await
                    }
                    Err(Error::InvalidTopicFromClient(topic)) => {
                        tracing::debug!(client_id, topic, "client sent invalid topic");
                        send_error(
                            format!("Invalid topic: {topic}"),
                            "Invalid topic",
                            INVALID_TOPIC_ERROR_CODE,
                            client,
                        ).await
                    }
                    Err(Error::InvalidPongMessage) => break,
                    Err(e) => {
                        tracing::error!(client_id, error = %e, "error processing message");
                        break;
                    }
                    Ok(()) => Ok(()),
                };

                if send_err.is_err() {
                    tracing::error!(client_id, "error sending message to client");
                    break;
                }
            }

            msg = client_rx.recv() => {
                match msg {
                    Some(message) => {
                        if let Err(e) = socket.send(message).await {
                            tracing::error!(
                                client_id,
                                req_id = ?request_id,
                                error = %e,
                                "error sending to WebSocket"
                            );
                            break;
                        }
                    }
                    None => break,
                }
            }

            _ = interval.tick() => {
                // Use lock().await — no other lock is held here, so no deadlock risk.
                let mut lock = client.lock().await;
                if lock.pings_len() >= options.ping_failures_threshold {
                    tracing::debug!(
                        client_id,
                        threshold = options.ping_failures_threshold,
                        "ping failure threshold reached"
                    );
                    return;
                }
                if let Err(e) = lock.send_ping() {
                    tracing::error!(client_id, error = %e, "error sending ping");
                    return;
                }
            }
        }
    }
}

/// Lock ordering rule (prevents deadlock):
///   1. If only one lock is needed: acquire it directly.
///   2. If both topics and client locks are needed: acquire topics FIRST, then client.
///      This is consistent with updates_handler (topics.read → client.lock).
async fn handle_income_message<R: Repo>(
    repo: Arc<R>,
    client: Arc<Mutex<Client>>,
    client_id: ClientId,
    topics: Arc<Topics>,
    raw_msg: ws::Message,
) -> Result<(), Error> {
    let msg = IncomeMessage::try_from(raw_msg)?;

    match msg {
        IncomeMessage::Pong(pong) => {
            // Only client lock needed; no risk of ordering conflict.
            client.lock().await.handle_pong(pong.message_number)?;
        }

        IncomeMessage::Subscribe { topic: client_key } => {
            let topic = client_key.try_as_topic()?;
            let canonical_key = topic.to_string();

            if canonical_key != client_key.as_str() {
                tracing::debug!(
                    original = client_key.as_str(),
                    normalized = canonical_key,
                    "subscription key normalized (non-ASCII characters)"
                );
            }

            // Phase 1: brief read-only check under client lock only.
            {
                let mut lock = client.lock().await;
                if lock.contains_subscription(&topic) {
                    lock.send_error(
                        ALREADY_SUBSCRIBED_ERROR_CODE,
                        "You are already subscribed for the specified topic".to_owned(),
                        None,
                    )?;
                    return Ok(());
                }
            }

            // Phase 2: async I/O — no locks held.
            let latency_timer = SUBSCRIBED_MESSAGE_LATENCIES.start_timer();

            tracing::debug!(client_id, key = client_key.as_str(), "handling subscription");

            let value = repo.get_by_key(&canonical_key).await?;
            tracing::debug!(topic = canonical_key, has_value = value.is_some(), "current value in Redis");

            // Pre-compute subtopics while holding no locks.
            let subtopics_computed: Option<(HashSet<Topic>, String, bool)> =
                if let Some(ref val) = value {
                    if topic.is_multi_topic() {
                        let subtopic_list = parse_subtopic_list::<Vec<_>>(val)?;
                        tracing::debug!(
                            topic = canonical_key,
                            count = subtopic_list.len(),
                            "subtopics resolved"
                        );
                        let subtopic_set = subtopic_list.iter().cloned().collect::<HashSet<_>>();
                        let mut sv = fetch_subtopic_values(repo.clone(), subtopic_list, vec![]).await?;
                        sv.filter_raw_null();
                        Some((subtopic_set, sv.as_json_string(), true))
                    } else {
                        Some((HashSet::new(), val.clone(), false))
                    }
                } else {
                    None
                };

            // Phase 3: apply state. Acquire topics THEN client (consistent lock ordering).
            {
                let mut topics_lock = topics.write().await;
                let mut lock = client.lock().await;

                // Re-check under lock to close the TOCTOU window.
                if lock.contains_subscription(&topic) {
                    latency_timer.stop_and_discard();
                    lock.send_error(
                        ALREADY_SUBSCRIBED_ERROR_CODE,
                        "You are already subscribed for the specified topic".to_owned(),
                        None,
                    )?;
                    return Ok(());
                }

                lock.add_direct_subscription(topic.clone(), client_key.clone());

                match subtopics_computed {
                    Some((subtopics, json, is_multi)) => {
                        lock.send_subscribed(&topic, json)?;
                        let latency = latency_timer.stop_and_record();
                        tracing::debug!(
                            client_id,
                            latency_ms = latency * 1_000.0,
                            kind = if is_multi { "multitopic" } else { "single" },
                            "immediate subscribed"
                        );

                        topics_lock.add_subscription(topic.clone(), client_id, client_key.clone());

                        if is_multi {
                            let update = MultitopicUpdate {
                                added_subtopics: subtopics.iter().cloned().collect(),
                                removed_subtopics: vec![],
                            };
                            let _ = topics_lock.update_multitopic_info(topic.clone(), subtopics.clone());
                            for sub in subtopics.iter().cloned() {
                                lock.add_indirect_subscription(sub, topic.clone(), client_key.clone());
                            }
                            topics_lock.update_indirect_subscriptions(topic, update, &client_id);
                        }
                    }
                    None => {
                        lock.mark_subscription_as_new(topic.clone(), latency_timer);
                        topics_lock.add_subscription(topic.clone(), client_id, client_key.clone());
                    }
                }
            }

            // Phase 4: Redis subscribe — no locks needed.
            repo.subscribe(canonical_key).await?;
        }

        IncomeMessage::Unsubscribe { topic: client_key } => {
            let topic = client_key.try_as_topic()?;

            // Acquire topics THEN client (consistent lock ordering).
            let mut topics_lock = topics.write().await;
            let mut lock = client.lock().await;

            if lock.contains_subscription(&topic) {
                lock.remove_direct_subscription(&topic);
                if topic.is_multi_topic() {
                    let removed = topics_lock.remove_indirect_subscriptions(&topic, &client_id);
                    for subtopic in removed {
                        lock.remove_indirect_subscription(&subtopic, &topic);
                    }
                }
                topics_lock.remove_subscription(&topic, &client_id);
            }

            drop(topics_lock);
            lock.send_unsubscribed(client_key)?;
        }
    }

    Ok(())
}

async fn send_error(
    reason: impl Into<String>,
    message: impl Into<String>,
    code: u16,
    client: &Arc<Mutex<Client>>,
) -> Result<(), Error> {
    let mut details = std::collections::HashMap::new();
    details.insert("reason".to_owned(), reason.into());
    client.lock().await.send_error(code, message.into(), Some(details))?;
    Ok(())
}

async fn on_disconnect(
    mut socket: WebSocket,
    client: Arc<Mutex<Client>>,
    client_id: ClientId,
    clients: Arc<Sharded<Clients>>,
    topics: Arc<Topics>,
) {
    // Phase 1: collect subscription info and call on_disconnect under brief client lock.
    let (subs, messages_count, req_id) = {
        let mut lock = client.lock().await;
        lock.on_disconnect();
        let subs: Vec<(Topic, bool)> = lock
            .subscription_topics_iter()
            .map(|(topic, is_direct, _)| (topic.clone(), is_direct))
            .collect();
        let messages_count = lock.messages_count();
        let req_id = lock.get_request_id().clone();
        (subs, messages_count, req_id)
    };
    // client lock dropped before acquiring topics lock

    // Phase 2: update topics map. Topics only, no client lock.
    {
        let mut topics_lock = topics.write().await;
        for (topic, is_direct) in &subs {
            if topic.is_multi_topic() {
                topics_lock.remove_indirect_subscriptions(topic, &client_id);
            }
            if *is_direct {
                topics_lock.remove_subscription(topic, &client_id);
            }
        }
    }

    tracing::info!(
        client_id,
        messages = messages_count,
        req_id = ?req_id,
        "client disconnected"
    );

    clients.get(&client_id).write().await.remove(&client_id);

    // Send close frame; ignore errors (connection may already be gone)
    let _ = socket.send(ws::Message::Close(None)).await;
    let _ = socket.close().await;
}

pub async fn updates_handler<R: Repo>(
    mut updates_receiver: tokio::sync::mpsc::Receiver<(Topic, String)>,
    clients: Arc<Sharded<Clients>>,
    topics: Arc<Topics>,
    repo: Arc<R>,
) {
    tracing::info!("WebSocket updates handler started");

    #[derive(Clone)]
    enum Update {
        Ignore,
        Single { topic: Topic, value: String },
        Multi { topic: Topic, value: String, multitopic_update: MultitopicUpdate },
    }

    while let Some((topic, value)) = updates_receiver.recv().await {
        REDIS_QUEUE_DEPTH.dec();

        // Arc so we can share a single allocation across all per-shard futures.
        let subscribed_clients = Arc::new(topics.read().await.get_subscribed_clients(&topic));
        let has_clients = !subscribed_clients.is_empty();

        tracing::debug!(
            topic = %topic,
            subscribed = subscribed_clients.len(),
            "Redis update received"
        );

        let update = if !has_clients {
            tracing::debug!(topic = %topic, "no subscribers; ignoring update");
            Update::Ignore
        } else if topic.is_multi_topic() {
            match parse_subtopic_list::<HashSet<_>>(&value) {
                Ok(subtopics) => {
                    let is_empty = subtopics.is_empty();
                    let mut lock = topics.write().await;
                    let mt_update = lock.update_multitopic_info(topic.clone(), subtopics);
                    for client_id in subscribed_clients.keys() {
                        lock.update_indirect_subscriptions(
                            topic.clone(),
                            mt_update.clone(),
                            client_id,
                        );
                    }
                    drop(lock);

                    match fetch_subtopic_values(
                        repo.clone(),
                        mt_update.added_subtopics.clone(),
                        mt_update.removed_subtopics.clone(),
                    )
                    .await
                    {
                        Ok(mut sv) => {
                            sv.filter_raw_null();
                            if is_empty || !sv.is_empty() {
                                Update::Multi {
                                    topic,
                                    value: sv.as_json_string(),
                                    multitopic_update: mt_update,
                                }
                            } else {
                                tracing::debug!("subtopic values not yet available; deferring");
                                Update::Ignore
                            }
                        }
                        Err(e) => {
                            tracing::error!(error = %e, "failed to fetch subtopic values");
                            Update::Ignore
                        }
                    }
                }
                Err(e) => {
                    // Downgrade to warn — a corrupted key would produce error! on every
                    // pub/sub message for that topic, creating a log-flood DoS.
                    tracing::warn!(topic = %topic, error = %e, "unrecognized multitopic value in Redis; ignoring");
                    Update::Ignore
                }
            }
        } else {
            Update::Single { topic, value }
        };

        if matches!(update, Update::Ignore) {
            continue;
        }

        let broadcast_start = Instant::now();

        // Acquire all shard read locks concurrently (one future per shard), collect matching
        // client Arcs, then drop all locks before touching any client. Sequential acquisition
        // would let a single write-locked shard delay the entire broadcast.
        let per_shard_futs: Vec<_> = clients
            .into_iter()
            .map(|shard| {
                let sc = Arc::clone(&subscribed_clients);
                async move {
                    let lock = shard.read().await;
                    lock.iter()
                        .filter_map(|(id, arc)| {
                            sc.get(id).map(|sub| (*id, arc.clone(), sub.clone()))
                        })
                        .collect::<Vec<_>>()
                }
            })
            .collect();

        let clients_to_update: Vec<(ClientId, Arc<Mutex<Client>>, Subscribed)> =
            future::join_all(per_shard_futs)
                .await
                .into_iter()
                .flatten()
                .collect();

        for (client_id, client_arc, subscribed) in &clients_to_update {
            let mut lock = client_arc.lock().await;

            let send_result = match &update {
                Update::Single { topic, value } => lock.send_update(topic, value.clone()),
                Update::Multi { topic, value, multitopic_update } => {
                    for subtopic in multitopic_update.added_subtopics.iter().cloned() {
                        let parent_key = match subscribed {
                            Subscribed::DirectlyWithKey(k) => k.clone(),
                            Subscribed::Indirectly => Default::default(),
                        };
                        lock.add_indirect_subscription(subtopic, topic.clone(), parent_key);
                    }
                    for subtopic in &multitopic_update.removed_subtopics {
                        lock.remove_indirect_subscription(subtopic, topic);
                    }
                    lock.send_update(topic, value.clone())
                }
                Update::Ignore => unreachable!(),
            };

            if let Err(e) = send_result {
                tracing::debug!(client_id, error = %e, "client channel closed during broadcast; skipping");
            }
        }

        tracing::debug!(
            recipients = subscribed_clients.len(),
            elapsed_ms = broadcast_start.elapsed().as_millis(),
            "update broadcast complete"
        );
    }
}

fn parse_subtopic_list<T>(topics_json: &str) -> Result<T, Error>
where
    T: FromIterator<Topic>,
{
    let raw: Vec<&str> = serde_json::from_str(topics_json)?;
    raw.into_iter()
        .map(|url| Topic::parse_str(url).map_err(Error::InvalidTopicInRedis))
        .collect()
}

async fn fetch_subtopic_values<R, T>(
    repo: Arc<R>,
    updated_topics: T,
    removed_topics: T,
) -> Result<TopicValues, Error>
where
    R: Repo,
    T: IntoIterator<Item = Topic>,
{
    let keys: Vec<String> = updated_topics.into_iter().map(|t| t.to_string()).collect();
    let keys_len = keys.len();
    let values = repo.get_by_keys(keys).await?;
    debug_assert_eq!(keys_len, values.len());

    let updated = values
        .into_iter()
        .filter_map(|v| v.map(TopicValue::Raw));

    let removed = removed_topics
        .into_iter()
        .map(|topic| -> Result<TopicValue, Error> {
            let StateSingle { address, key } = topic
                .data()
                .as_state_single()
                .ok_or_else(|| Error::InvalidTopicInRedis(
                    crate::topic::TopicParseError::from(
                        "removed subtopic is not a concrete state topic".to_owned()
                    )
                ))?;
            Ok(TopicValue::DataEntry(DataEntry::deleted(address, key)))
        })
        .collect::<Result<Vec<_>, _>>()?;

    Ok(TopicValues(updated.chain(removed).collect()))
}

mod values {
    use serde::{Serialize, Serializer};

    #[derive(Debug)]
    pub struct TopicValues(pub Vec<TopicValue>);

    #[derive(Clone, Debug, Serialize)]
    #[serde(untagged)]
    pub enum TopicValue {
        Raw(String),
        #[serde(serialize_with = "serialize_data_entry_as_string")]
        DataEntry(DataEntry),
    }

    #[derive(Clone, Debug, Serialize)]
    pub struct DataEntry {
        address: String,
        key: String,
        value: String,
    }

    impl DataEntry {
        pub fn deleted(address: String, key: String) -> Self {
            Self { address, key, value: String::new() }
        }

        fn as_json_string(&self) -> String {
            serde_json::to_string(self).expect("DataEntry serialization cannot fail")
        }
    }

    impl TopicValues {
        pub fn is_empty(&self) -> bool {
            self.0.is_empty()
        }

        pub fn as_json_string(&self) -> String {
            serde_json::to_string(&self.0).expect("TopicValues serialization cannot fail")
        }

        pub fn filter_raw_null(&mut self) {
            self.0.retain(|e| !matches!(e, TopicValue::Raw(s) if s == "null"));
        }
    }

    fn serialize_data_entry_as_string<S: Serializer>(
        entry: &DataEntry,
        s: S,
    ) -> Result<S::Ok, S::Error> {
        s.serialize_str(&entry.as_json_string())
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[test]
        fn empty_topic_values_serialize_as_array() {
            assert_eq!(TopicValues(vec![]).as_json_string(), r#"[]"#);
        }

        #[test]
        fn mixed_topic_values_serialize_correctly() {
            let values = TopicValues(vec![
                TopicValue::Raw("raw value".to_owned()),
                TopicValue::DataEntry(DataEntry::deleted("addr".to_owned(), "key".to_owned())),
            ]);
            assert_eq!(
                values.as_json_string(),
                r#"["raw value","{\"address\":\"addr\",\"key\":\"key\",\"value\":\"\"}"]"#
            );
        }

        #[test]
        fn filter_raw_null_removes_null_strings() {
            let mut values = TopicValues(vec![
                TopicValue::Raw("null".to_owned()),
                TopicValue::Raw("something".to_owned()),
            ]);
            values.filter_raw_null();
            assert_eq!(values.0.len(), 1);
        }
    }
}
