use crate::error::Error;
use crate::messages::OutcomeMessage;
use crate::metrics::{
    MESSAGES, TOPIC_SUBSCRIBED, TOPIC_UNSUBSCRIBED, TOPICS, TOPICS_MAP_CAPACITY, TOPICS_MAP_SIZE,
};
use crate::topic::Topic;
use axum::extract::ws::Message;
use prometheus::HistogramTimer;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeSet, HashMap, HashSet};
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::{Mutex, RwLock};

pub type ClientId = usize;

/// A cheaply cloneable (`Arc` inside) string key — usually a topic URI as received from the client.
#[derive(Debug, Clone, Default)]
pub struct ClientSubscriptionKey(Arc<String>);

impl serde::Serialize for ClientSubscriptionKey {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(self.0.as_str())
    }
}

impl<'de> serde::Deserialize<'de> for ClientSubscriptionKey {
    fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        let s = String::deserialize(d)?;
        Ok(Self(Arc::new(s)))
    }
}

impl ClientSubscriptionKey {
    pub fn new(topic: impl Into<String>) -> Self {
        Self(Arc::new(topic.into()))
    }

    pub fn as_str(&self) -> &str {
        self.0.as_str()
    }

    pub fn into_inner(self) -> Arc<String> {
        self.0
    }

    pub fn try_as_topic(&self) -> Result<Topic, Error> {
        let uri = self.0.as_str();
        Topic::parse_str(uri).map_err(|_| Error::InvalidTopicFromClient(uri.to_owned()))
    }
}

#[derive(Debug)]
pub struct Client {
    client_id: ClientId,
    sender: ClientSender,
    kill_tx: Option<tokio::sync::oneshot::Sender<()>>,
    subscriptions: HashMap<Topic, ClientSubscriptionData>,
    request_id: Option<String>,
}

#[derive(Debug, Clone)]
pub enum Subscribed {
    DirectlyWithKey(ClientSubscriptionKey),
    Indirectly,
}

#[derive(Debug)]
struct ClientSender {
    tx: tokio::sync::mpsc::UnboundedSender<Message>,
    message_counter: i64,
    /// BTreeSet for O(log n) contains/insert/retain. Ping numbers are monotonically
    /// increasing so iteration order == insertion order — perfect for BTreeSet.
    pending_pings: BTreeSet<i64>,
}

#[derive(Default, Debug)]
struct ClientSubscriptionData {
    subscription_key: ClientSubscriptionKey,
    indirect_subscription_sources: HashMap<Topic, IndirectSubscriptionData>,
    is_new: bool,
    is_direct: bool,
    is_indirect: bool,
    leasing_balance_last_value: Option<LeasingBalance>,
    latency_timer: Option<HistogramTimer>,
}

#[derive(Default, Debug)]
struct IndirectSubscriptionData {
    subscription_key: ClientSubscriptionKey,
}

#[derive(Serialize, Deserialize, Debug)]
struct LeasingBalance {
    address: String,
    #[serde(rename = "in")]
    balance_in: i64,
    #[serde(rename = "out")]
    balance_out: i64,
}

fn leasing_balance_diff(old: &LeasingBalance, new: &LeasingBalance) -> String {
    if old.balance_in == new.balance_in && old.balance_out == new.balance_out {
        serde_json::to_string(new).expect("LeasingBalance serialize")
    } else if old.balance_in == new.balance_in {
        let v = serde_json::json!({"address": new.address, "out": new.balance_out});
        serde_json::to_string(&v).expect("leasing balance diff serialize")
    } else if old.balance_out == new.balance_out {
        let v = serde_json::json!({"address": new.address, "in": new.balance_in});
        serde_json::to_string(&v).expect("leasing balance diff serialize")
    } else {
        serde_json::to_string(new).expect("LeasingBalance serialize")
    }
}

impl Client {
    pub fn new(
        client_id: ClientId,
        tx: tokio::sync::mpsc::UnboundedSender<Message>,
        kill_tx: tokio::sync::oneshot::Sender<()>,
        request_id: Option<String>,
    ) -> Self {
        Self {
            client_id,
            sender: ClientSender {
                tx,
                message_counter: 1,
                pending_pings: BTreeSet::new(),
            },
            kill_tx: Some(kill_tx),
            request_id,
            subscriptions: HashMap::new(),
        }
    }

    pub fn graceful_kill(&mut self) {
        tracing::debug!(client_id = self.client_id, "gracefully killing client");
        if let Some(tx) = self.kill_tx.take() {
            let _ = tx.send(());
        }
    }

    pub fn get_request_id(&self) -> &Option<String> {
        &self.request_id
    }

    pub fn contains_subscription(&self, topic: &Topic) -> bool {
        self.subscriptions.contains_key(topic)
    }

    pub fn add_direct_subscription(&mut self, topic: Topic, key: ClientSubscriptionKey) {
        tracing::debug!(
            client_id = self.client_id,
            topic = %topic,
            subscription_key = key.as_str(),
            "direct subscription added"
        );
        let data = self.subscriptions.entry(topic).or_default();
        data.subscription_key = key;
        data.is_direct = true;
    }

    pub fn add_indirect_subscription(
        &mut self,
        topic: Topic,
        parent: Topic,
        key: ClientSubscriptionKey,
    ) {
        tracing::debug!(
            client_id = self.client_id,
            topic = %topic,
            parent_multitopic = %parent,
            "indirect subscription added"
        );
        let data = self.subscriptions.entry(topic).or_default();
        data.indirect_subscription_sources.insert(
            parent,
            IndirectSubscriptionData {
                subscription_key: key,
            },
        );
        data.is_indirect = true;
    }

    pub fn mark_subscription_as_new(&mut self, topic: Topic, timer: HistogramTimer) {
        self.subscriptions.entry(topic).and_modify(|d| {
            d.is_new = true;
            d.latency_timer = Some(timer);
        });
    }

    pub fn remove_direct_subscription(&mut self, topic: &Topic) {
        tracing::debug!(client_id = self.client_id, topic = %topic, "direct unsubscribe");
        if let Some(data) = self.subscriptions.get_mut(topic) {
            data.is_direct = false;
            if !data.is_indirect {
                self.subscriptions.remove(topic);
            }
        }
    }

    pub fn remove_indirect_subscription(&mut self, topic: &Topic, parent: &Topic) {
        if let Some(data) = self.subscriptions.get_mut(topic) {
            data.indirect_subscription_sources.remove(parent);
            if data.indirect_subscription_sources.is_empty() {
                data.is_indirect = false;
            }
            if !data.is_direct && !data.is_indirect {
                self.subscriptions.remove(topic);
            }
        }
    }

    pub fn handle_pong(&mut self, message_number: i64) -> Result<(), Error> {
        if self.sender.handle_pong(message_number).is_ok() {
            Ok(())
        } else {
            tracing::warn!(client_id = self.client_id, "invalid pong message received");
            Err(Error::InvalidPongMessage)
        }
    }

    pub fn pings_len(&self) -> usize {
        self.sender.pending_pings.len() // BTreeSet::len is O(1)
    }

    pub fn send_ping(&mut self) -> Result<(), Error> {
        self.sender.send_ping()
    }

    pub fn send_subscribed(&mut self, topic: &Topic, value: String) -> Result<(), Error> {
        if let Some(data) = self.subscriptions.get_mut(topic) {
            if let Ok(Some(lb)) = serde_json::from_str(&value) {
                data.leasing_balance_last_value = lb;
            }
            let key = data.subscription_key.clone();
            self.sender.send_subscribed(key, value)?;
        } else {
            tracing::warn!(
                client_id = self.client_id,
                topic = %topic,
                "send_subscribed called for unknown topic; message dropped"
            );
        }
        Ok(())
    }

    pub fn send_update(&mut self, topic: &Topic, mut value: String) -> Result<(), Error> {
        if let Some(data) = self.subscriptions.get_mut(topic) {
            if let Ok(Some(lb)) = serde_json::from_str::<Option<LeasingBalance>>(&value) {
                if let Some(ref old) = data.leasing_balance_last_value {
                    value = leasing_balance_diff(old, &lb);
                }
                data.leasing_balance_last_value = Some(lb);
            }

            if data.is_direct {
                let key = data.subscription_key.clone();
                let v = value.clone();
                if data.is_new {
                    data.is_new = false;
                    self.sender.send_subscribed(key, v)?;
                } else {
                    self.sender.send_update(key, v)?;
                }
            }

            if data.is_indirect {
                for sub in data.indirect_subscription_sources.values() {
                    let key = sub.subscription_key.clone();
                    let wrapped = serde_json::to_string(&[&value]).expect("wrap in array");
                    self.sender.send_update(key, wrapped)?;
                }
            }

            if let Some(timer) = data.latency_timer.take() {
                let latency = timer.stop_and_record();
                tracing::debug!(
                    client_id = self.client_id,
                    latency_ms = latency * 1_000.0,
                    topic = %topic,
                    "subscription latency (delayed send)"
                );
            }
        }
        Ok(())
    }

    pub fn send_unsubscribed(&mut self, key: ClientSubscriptionKey) -> Result<(), Error> {
        self.sender.send_unsubscribed(key)
    }

    pub fn send_error(
        &mut self,
        code: u16,
        message: String,
        details: Option<HashMap<String, String>>,
    ) -> Result<(), Error> {
        self.sender.send_error(code, message, details)
    }

    pub fn on_disconnect(&mut self) {
        for (topic, data) in &mut self.subscriptions {
            if let Some(timer) = data.latency_timer.take() {
                let latency = timer.stop_and_discard();
                tracing::debug!(
                    client_id = self.client_id,
                    latency_ms = latency * 1_000.0,
                    topic = %topic,
                    "subscription aborted while waiting for first value"
                );
            }
        }
    }

    pub fn messages_count(&self) -> i64 {
        self.sender.message_counter - 1
    }

    pub fn subscription_topics_iter(&self) -> impl Iterator<Item = (&Topic, bool, bool)> {
        self.subscriptions
            .iter()
            .map(|(topic, data)| (topic, data.is_direct, data.is_indirect))
    }
}

impl ClientSender {
    fn handle_pong(&mut self, message_number: i64) -> Result<(), ()> {
        if self.pending_pings.contains(&message_number) {
            // Clear this ping and all earlier ones — receiving pong for N means the client
            // was alive up through message N, so pending pings ≤ N are also satisfied.
            // BTreeSet::split_off(N+1) retains only elements > N in O(log n).
            self.pending_pings = self.pending_pings.split_off(&(message_number + 1));
            Ok(())
        } else {
            Err(())
        }
    }

    fn send_ping(&mut self) -> Result<(), Error> {
        self.pending_pings.insert(self.message_counter);
        let number = self.message_counter;
        self.send(OutcomeMessage::Ping {
            message_number: number,
        })
    }

    fn send_subscribed(&mut self, key: ClientSubscriptionKey, value: String) -> Result<(), Error> {
        self.send(OutcomeMessage::Subscribed {
            message_number: self.message_counter,
            topic: key,
            value,
        })?;
        MESSAGES.inc();
        Ok(())
    }

    fn send_update(&mut self, key: ClientSubscriptionKey, value: String) -> Result<(), Error> {
        self.send(OutcomeMessage::Update {
            message_number: self.message_counter,
            topic: key,
            value,
        })?;
        MESSAGES.inc();
        Ok(())
    }

    fn send_unsubscribed(&mut self, key: ClientSubscriptionKey) -> Result<(), Error> {
        self.send(OutcomeMessage::Unsubscribed {
            message_number: self.message_counter,
            topic: key,
        })
    }

    fn send_error(
        &mut self,
        code: u16,
        message: String,
        details: Option<HashMap<String, String>>,
    ) -> Result<(), Error> {
        self.send(OutcomeMessage::Error {
            code,
            message,
            details,
            message_number: self.message_counter,
        })
    }

    fn send(&mut self, msg: OutcomeMessage) -> Result<(), Error> {
        self.message_counter += 1;
        self.tx.send(Message::from(msg))?;
        Ok(())
    }
}

pub type Clients = RwLock<HashMap<ClientId, Arc<Mutex<Client>>>>;
pub type Topics = RwLock<ClientIdsByTopics>;

#[derive(Default, Debug)]
pub struct ClientIdsByTopics(HashMap<Topic, KeyInfo>);

#[derive(Debug)]
pub struct KeyInfo {
    clients: HashMap<ClientId, ClientSubscriptionKey>,
    indirect_clients: HashMap<ClientId, HashSet<Topic>>,
    subtopics: HashSet<Topic>,
    last_refresh_time: Instant,
}

impl Default for KeyInfo {
    fn default() -> Self {
        Self::new()
    }
}

impl KeyInfo {
    pub fn new() -> Self {
        Self {
            clients: HashMap::new(),
            indirect_clients: HashMap::new(),
            subtopics: HashSet::new(),
            last_refresh_time: Instant::now(),
        }
    }

    pub fn is_expiring(&self, expire_time: Instant) -> bool {
        self.last_refresh_time < expire_time
    }

    pub fn refresh(&mut self, refresh_time: Instant) {
        if self.last_refresh_time < refresh_time {
            self.last_refresh_time = refresh_time;
        }
    }
}

#[derive(Clone, Debug)]
pub struct MultitopicUpdate {
    pub added_subtopics: Vec<Topic>,
    pub removed_subtopics: Vec<Topic>,
}

impl ClientIdsByTopics {
    pub fn add_subscription(
        &mut self,
        topic: Topic,
        client_id: ClientId,
        key: ClientSubscriptionKey,
    ) {
        let mut new_entry = false;
        let info = self.0.entry(topic).or_insert_with(|| {
            TOPIC_SUBSCRIBED.inc();
            TOPICS.inc();
            new_entry = true;
            KeyInfo::new()
        });

        if let Some(prev) = info.clients.insert(client_id, key) {
            tracing::warn!(
                client_id,
                prev_key = prev.as_str(),
                "add_subscription replaced existing entry for client; possible duplicate subscribe"
            );
        }

        if new_entry {
            self.update_size_metrics();
        }
    }

    pub fn remove_subscription(&mut self, topic: &Topic, client_id: &ClientId) {
        if let Some(info) = self.0.get_mut(topic) {
            info.clients.remove(client_id);
            if info.clients.is_empty() && info.indirect_clients.is_empty() {
                TOPIC_UNSUBSCRIBED.inc();
                TOPICS.dec();
                self.0.remove(topic);
                self.update_size_metrics();
            }
        }
    }

    pub fn update_multitopic_info(
        &mut self,
        multitopic: Topic,
        subtopics: HashSet<Topic>,
    ) -> MultitopicUpdate {
        let mut new_entry = false;
        let info = self.0.entry(multitopic).or_insert_with(|| {
            TOPIC_SUBSCRIBED.inc();
            TOPICS.inc();
            new_entry = true;
            KeyInfo::new()
        });

        let added = subtopics
            .difference(&info.subtopics)
            .cloned()
            .collect::<Vec<_>>();
        let removed = info
            .subtopics
            .difference(&subtopics)
            .cloned()
            .collect::<Vec<_>>();

        if info.subtopics != subtopics {
            info.subtopics = subtopics;
        }
        // info borrow ends here; now safe to call &self method

        let result = MultitopicUpdate {
            added_subtopics: added,
            removed_subtopics: removed,
        };

        if new_entry {
            self.update_size_metrics();
        }

        result
    }

    pub fn update_indirect_subscriptions(
        &mut self,
        multitopic: Topic,
        update: MultitopicUpdate,
        client_id: &ClientId,
    ) {
        let mut changed = false;

        for topic in update.added_subtopics {
            self.0
                .entry(topic)
                .or_insert_with(|| {
                    TOPIC_SUBSCRIBED.inc();
                    TOPICS.inc();
                    changed = true;
                    KeyInfo::new()
                })
                .indirect_clients
                .entry(*client_id)
                .or_default()
                .insert(multitopic.clone());
        }

        for topic in update.removed_subtopics {
            if let Some(info) = self.0.get_mut(&topic) {
                if let Some(multitopics) = info.indirect_clients.get_mut(client_id) {
                    multitopics.remove(&multitopic);
                    if multitopics.is_empty() {
                        info.indirect_clients.remove(client_id);
                    }
                }
                if info.clients.is_empty() && info.indirect_clients.is_empty() {
                    TOPIC_UNSUBSCRIBED.inc();
                    TOPICS.dec();
                    changed = true;
                    self.0.remove(&topic);
                }
            }
        }

        if changed {
            self.update_size_metrics();
        }
    }

    pub fn remove_indirect_subscriptions(
        &mut self,
        multitopic: &Topic,
        client_id: &ClientId,
    ) -> Vec<Topic> {
        let subtopics = self
            .0
            .get(multitopic)
            .map(|info| info.subtopics.iter().cloned().collect::<Vec<_>>())
            .unwrap_or_default();

        let mut changed = false;

        for topic in &subtopics {
            if let Some(info) = self.0.get_mut(topic) {
                if let Some(multitopics) = info.indirect_clients.get_mut(client_id) {
                    multitopics.remove(multitopic);
                    if multitopics.is_empty() {
                        info.indirect_clients.remove(client_id);
                    }
                }
                if info.clients.is_empty() && info.indirect_clients.is_empty() {
                    TOPIC_UNSUBSCRIBED.inc();
                    TOPICS.dec();
                    changed = true;
                    self.0.remove(topic);
                }
            }
        }

        if changed {
            self.update_size_metrics();
        }

        subtopics
    }

    pub fn get_subscribed_clients(&self, topic: &Topic) -> HashMap<ClientId, Subscribed> {
        self.0
            .get(topic)
            .map(|info| {
                let direct = info
                    .clients
                    .iter()
                    .map(|(&id, key)| (id, Subscribed::DirectlyWithKey(key.clone())));
                let indirect = info
                    .indirect_clients
                    .keys()
                    .map(|&id| (id, Subscribed::Indirectly));
                direct.chain(indirect).collect()
            })
            .unwrap_or_default()
    }

    pub fn topics_iter(&self) -> impl Iterator<Item = (&Topic, &KeyInfo)> {
        self.0.iter()
    }

    pub fn refresh_topic(&mut self, topic: Topic, refresh_time: Instant) {
        if let Some(info) = self.0.get_mut(&topic) {
            info.refresh(refresh_time);
        }
    }

    fn update_size_metrics(&self) {
        TOPICS_MAP_SIZE.set(i64::try_from(self.0.len()).unwrap_or(i64::MAX));
        TOPICS_MAP_CAPACITY.set(i64::try_from(self.0.capacity()).unwrap_or(i64::MAX));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn leasing_balance_diff_both_changed() {
        let lb1 = LeasingBalance {
            address: "addr".into(),
            balance_in: 7,
            balance_out: 2,
        };
        let lb2 = LeasingBalance {
            address: "addr".into(),
            balance_in: 5,
            balance_out: 8,
        };
        assert_eq!(
            r#"{"address":"addr","in":5,"out":8}"#,
            leasing_balance_diff(&lb1, &lb2)
        );
        assert_eq!(
            r#"{"address":"addr","in":7,"out":2}"#,
            leasing_balance_diff(&lb2, &lb1)
        );
    }

    #[test]
    fn leasing_balance_diff_only_out() {
        let lb1 = LeasingBalance {
            address: "addr".into(),
            balance_in: 7,
            balance_out: 2,
        };
        let lb2 = LeasingBalance {
            address: "addr".into(),
            balance_in: 7,
            balance_out: 8,
        };
        assert_eq!(
            r#"{"address":"addr","out":8}"#,
            leasing_balance_diff(&lb1, &lb2)
        );
        assert_eq!(
            r#"{"address":"addr","out":2}"#,
            leasing_balance_diff(&lb2, &lb1)
        );
    }

    #[test]
    fn leasing_balance_diff_only_in() {
        let lb1 = LeasingBalance {
            address: "addr".into(),
            balance_in: 7,
            balance_out: 2,
        };
        let lb2 = LeasingBalance {
            address: "addr".into(),
            balance_in: 5,
            balance_out: 2,
        };
        assert_eq!(
            r#"{"address":"addr","in":5}"#,
            leasing_balance_diff(&lb1, &lb2)
        );
        assert_eq!(
            r#"{"address":"addr","in":7}"#,
            leasing_balance_diff(&lb2, &lb1)
        );
    }

    #[test]
    fn leasing_balance_diff_no_change() {
        let lb = LeasingBalance {
            address: "addr".into(),
            balance_in: 7,
            balance_out: 2,
        };
        assert_eq!(
            r#"{"address":"addr","in":7,"out":2}"#,
            leasing_balance_diff(&lb, &lb)
        );
    }

    #[test]
    fn update_multitopic_info_tracks_added_and_removed() -> Result<(), Box<dyn std::error::Error>> {
        let mt_key = "topic://state?address__in[]=3PPNhH&key__match_any[]=pattern*";
        let multitopic = Topic::parse_str(mt_key)?;

        let sub_key = "topic://state/3PPNhH/pattern_abc";
        let subtopic = Topic::parse_str(sub_key)?;

        let mut store = ClientIdsByTopics::default();
        let mut subtopics = HashSet::new();
        subtopics.insert(subtopic.clone());

        let update = store.update_multitopic_info(multitopic.clone(), subtopics.clone());
        assert_eq!(update.added_subtopics, vec![subtopic]);

        // Second call with same subtopics — nothing added
        let update2 = store.update_multitopic_info(multitopic, subtopics);
        assert!(update2.added_subtopics.is_empty());

        Ok(())
    }
}
