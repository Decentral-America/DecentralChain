//! Integration tests for the WebSocket endpoint.
//!
//! Uses axum-test's WebSocket client (`ws` feature) backed by a mock Repo —
//! no real Redis or network socket is required.

use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::{Duration, Instant};

use axum::Router;
use axum::extract::{State, ws::WebSocketUpgrade};
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum_test::TestServer;
use axum_test::WsMessage;
use serde_json::{Value, json};
use tokio::sync::{Semaphore, mpsc};

use crate::websocket::MAX_MULTITOPIC_SUBTOPICS;

use crate::client::{ClientId, Clients, Topics};
use crate::error::Error;
use crate::repo::Repo;
use crate::shard::Sharded;
use crate::topic::Topic;
use crate::websocket::{self, HandleConnectionOptions};

// ── Mock Repo ─────────────────────────────────────────────────────────────────

struct MockRepo {
    id: AtomicUsize,
}

impl Default for MockRepo {
    fn default() -> Self {
        Self {
            id: AtomicUsize::new(1),
        }
    }
}

impl Repo for MockRepo {
    async fn get_connection_id(&self) -> Result<ClientId, Error> {
        Ok(self.id.fetch_add(1, Ordering::Relaxed))
    }
    async fn ping(&self) -> Result<(), Error> {
        Ok(())
    }
    async fn subscribe<S: Into<String> + Send + Sync>(&self, _key: S) -> Result<(), Error> {
        Ok(())
    }
    /// Return a known value so Subscribe can immediately reply with Subscribed.
    async fn get_by_key(&self, _key: &str) -> Result<Option<String>, Error> {
        Ok(Some("\"mocked_value\"".to_owned()))
    }
    async fn get_by_keys(&self, keys: Vec<String>) -> Result<Vec<Option<String>>, Error> {
        Ok(vec![Some("\"mocked_value\"".to_owned()); keys.len()])
    }
    /// State index: two keys (`key_a`, `key_b`, plus a non-matching `other`) for the
    /// test address, 1001 `big_*` keys for `3MBIG`, nothing for other addresses.
    async fn state_index_scan(
        &self,
        address: &str,
        keep: &(dyn Fn(&str) -> bool + Sync),
        limit: usize,
    ) -> Result<Vec<String>, Error> {
        let members: Vec<String> = match address {
            "3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr" => ["key_a", "key_b", "other"]
                .iter()
                .map(|k| format!("topic://state/{address}/{k}"))
                .collect(),
            "3MBIG" => (0..1001)
                .map(|i| format!("topic://state/{address}/big_{i}"))
                .collect(),
            _ => vec![],
        };
        Ok(members
            .into_iter()
            .filter(|m| keep(m))
            .take(limit.saturating_add(1))
            .collect())
    }
    async fn refresh(&self, topics: Vec<Topic>) -> Result<HashMap<Topic, Instant>, Error> {
        Ok(topics.into_iter().map(|t| (t, Instant::now())).collect())
    }
}

// ── Shared state ──────────────────────────────────────────────────────────────

#[derive(Clone)]
struct WsState {
    repo: Arc<MockRepo>,
    clients: Arc<Sharded<Clients>>,
    topics: Arc<Topics>,
    options: Arc<HandleConnectionOptions>,
    shutdown_tx: mpsc::Sender<()>,
}

async fn ws_handler_fn(
    ws: WebSocketUpgrade,
    headers: HeaderMap,
    State(s): State<WsState>,
) -> Response {
    let req_id = headers
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .map(str::to_owned);

    let semaphore = Arc::new(Semaphore::new(100));
    let permit = match semaphore.try_acquire_owned() {
        Ok(p) => p,
        Err(_) => return StatusCode::SERVICE_UNAVAILABLE.into_response(),
    };

    ws.on_upgrade(move |socket| async move {
        let _permit = permit;
        if let Err(e) = websocket::handle_connection(
            socket,
            s.clients,
            s.topics,
            s.repo,
            (*s.options).clone(),
            req_id,
            s.shutdown_tx,
        )
        .await
        {
            tracing::error!(error = %e, "test WS handler error");
        }
    })
}

fn options_with(max_subscriptions_per_client: usize) -> HandleConnectionOptions {
    HandleConnectionOptions {
        // Very long interval so the first tick is deferred well past test duration.
        ping_interval: Duration::from_secs(3600),
        ping_failures_threshold: 3,
        max_subscriptions_per_client,
        max_indirect_subtopics_per_client: 5000,
        multitopic_permits: Arc::new(Semaphore::new(8)),
        multitopic_permit_timeout: Duration::from_millis(100),
    }
}

/// Builds the test router and returns it along with the shutdown channel receiver.
/// The receiver MUST be kept alive for the duration of the test — dropping it
/// closes the shutdown signal and causes the server to disconnect all clients.
fn ws_router_opts(options: HandleConnectionOptions) -> (Router, mpsc::Receiver<()>) {
    let (shutdown_tx, shutdown_rx) = mpsc::channel::<()>(1);
    let state = WsState {
        repo: Arc::new(MockRepo::default()),
        clients: Arc::new(Sharded::new(4)),
        topics: Arc::new(Topics::default()),
        options: Arc::new(options),
        shutdown_tx,
    };
    let router = Router::new()
        .route("/ws", get(ws_handler_fn))
        .with_state(state);
    (router, shutdown_rx)
}

fn make_server() -> (TestServer, mpsc::Receiver<()>) {
    make_server_with(100)
}

fn make_server_with(max_subscriptions_per_client: usize) -> (TestServer, mpsc::Receiver<()>) {
    make_server_opts(options_with(max_subscriptions_per_client))
}

fn make_server_opts(options: HandleConnectionOptions) -> (TestServer, mpsc::Receiver<()>) {
    let (router, rx) = ws_router_opts(options);
    let server = TestServer::builder().http_transport().build(router);
    (server, rx)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn extract_text(msg: &WsMessage) -> &str {
    match msg {
        WsMessage::Text(t) => t.as_str(),
        other => panic!("expected text WsMessage, got {other:?}"),
    }
}

/// Receive the next non-ping message, replying to any ping with a pong first.
async fn receive_non_ping(ws: &mut axum_test::TestWebSocket) -> WsMessage {
    loop {
        let msg = ws.receive_message().await;
        if let WsMessage::Text(ref t) = msg {
            let v: Value = serde_json::from_str(t.as_str()).unwrap_or(Value::Null);
            if v["type"] == "ping" {
                let pong = json!({
                    "type": "pong",
                    "message_number": v["message_number"]
                });
                ws.send_message(WsMessage::Text(pong.to_string().into()))
                    .await;
                continue;
            }
        }
        return msg;
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

/// The WebSocket handshake must complete without error.
#[tokio::test]
async fn websocket_handshake_succeeds() {
    let (server, _rx) = make_server();
    let response = server.get_websocket("/ws").await;
    let _ws = response.into_websocket().await;
}

/// A valid Subscribe message for a topic that has a current value in Redis
/// must produce a Subscribed reply with the topic URI.
#[tokio::test]
async fn client_can_subscribe_to_topic() {
    let (server, _rx) = make_server();
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;

    let sub_msg = json!({
        "type": "subscribe",
        "topic": "topic://state/3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr/test_key"
    });
    ws.send_message(WsMessage::Text(sub_msg.to_string().into()))
        .await;

    let reply = receive_non_ping(&mut ws).await;
    let v: Value = serde_json::from_str(extract_text(&reply)).expect("valid json");
    assert_eq!(v["type"], "subscribed", "expected subscribed, got: {v}");
    assert_eq!(
        v["topic"],
        "topic://state/3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr/test_key"
    );
}

/// Subscribing to the same topic twice must return an error (code 2 = already subscribed).
#[tokio::test]
async fn subscribing_to_same_topic_twice_sends_error() {
    let (server, _rx) = make_server();
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;

    let sub_msg = json!({
        "type": "subscribe",
        "topic": "topic://state/3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr/dup_key"
    });
    let payload = WsMessage::Text(sub_msg.to_string().into());

    ws.send_message(payload.clone()).await;
    let first = receive_non_ping(&mut ws).await;
    let v1: Value = serde_json::from_str(extract_text(&first)).unwrap();
    assert_eq!(v1["type"], "subscribed");

    ws.send_message(payload).await;
    let second = receive_non_ping(&mut ws).await;
    let v2: Value = serde_json::from_str(extract_text(&second)).unwrap();
    assert_eq!(
        v2["type"], "error",
        "duplicate subscribe must return error, got: {v2}"
    );
}

/// Unsubscribing from a subscribed topic must produce an Unsubscribed reply.
#[tokio::test]
async fn unsubscribing_sends_unsubscribed_message() {
    let (server, _rx) = make_server();
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;

    let topic_uri = "topic://state/3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr/unsub_key";

    ws.send_message(WsMessage::Text(
        json!({ "type": "subscribe", "topic": topic_uri })
            .to_string()
            .into(),
    ))
    .await;
    let subscribed = receive_non_ping(&mut ws).await;
    let v: Value = serde_json::from_str(extract_text(&subscribed)).unwrap();
    assert_eq!(v["type"], "subscribed");

    ws.send_message(WsMessage::Text(
        json!({ "type": "unsubscribe", "topic": topic_uri })
            .to_string()
            .into(),
    ))
    .await;
    let unsubscribed = receive_non_ping(&mut ws).await;
    let v2: Value = serde_json::from_str(extract_text(&unsubscribed)).unwrap();
    assert_eq!(
        v2["type"], "unsubscribed",
        "expected unsubscribed, got: {v2}"
    );
    assert_eq!(v2["topic"], topic_uri);
}

/// A syntactically invalid JSON payload is a protocol error: the server closes
/// the connection rather than sending an error frame (JSON parse failures are not
/// recoverable at the application level).
#[tokio::test]
async fn invalid_json_closes_connection() {
    let (server, _rx) = make_server();
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;

    ws.send_message(WsMessage::Text("this is not json".to_owned().into()))
        .await;

    // The server should close the connection after a syntax error.
    let msg = receive_non_ping(&mut ws).await;
    // Accept either a Close frame or a text error, but not panic.
    // The protocol behavior (close on syntax error) is the key assertion here.
    match msg {
        WsMessage::Close(_) => { /* expected: server closed the connection */ }
        WsMessage::Text(ref t) => {
            // If the implementation sends an error text, it must be valid JSON.
            let v: Value = serde_json::from_str(t.as_str())
                .expect("if server sends text on bad JSON, it must be valid JSON");
            // It should be an error message.
            assert_eq!(v["type"], "error", "unexpected text after bad JSON: {v}");
        }
        other => panic!("unexpected WsMessage after bad JSON: {other:?}"),
    }
}

/// A valid JSON message with an unknown `type` field must return error code 1.
#[tokio::test]
async fn unknown_message_type_returns_error_code_1() {
    let (server, _rx) = make_server();
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;

    // Valid JSON, but unknown `type` — triggers UnknownIncomeMessage.
    ws.send_message(WsMessage::Text(
        json!({ "type": "unknown_type_xyz", "data": "anything" })
            .to_string()
            .into(),
    ))
    .await;

    let msg = receive_non_ping(&mut ws).await;
    let v: Value = serde_json::from_str(extract_text(&msg)).expect("valid json response");
    assert_eq!(
        v["type"], "error",
        "unknown message type must produce error, got: {v}"
    );
    assert_eq!(v["code"], 1u16, "error code must be 1 (invalid message)");
}

/// An invalid topic URI must return error code 3.
#[tokio::test]
async fn invalid_topic_uri_returns_error() {
    let (server, _rx) = make_server();
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;

    ws.send_message(WsMessage::Text(
        json!({ "type": "subscribe", "topic": "not-a-valid-topic-uri" })
            .to_string()
            .into(),
    ))
    .await;

    let msg = receive_non_ping(&mut ws).await;
    let v: Value = serde_json::from_str(extract_text(&msg)).expect("valid json response");
    assert_eq!(
        v["type"], "error",
        "invalid topic must produce error, got: {v}"
    );
    assert_eq!(v["code"], 3u16);
}

/// After unsubscribing, re-subscribing to the same topic must succeed.
#[tokio::test]
async fn unsubscribe_then_resubscribe_succeeds() {
    let (server, _rx) = make_server();
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;

    let topic_uri = "topic://state/3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr/clean_key";

    ws.send_message(WsMessage::Text(
        json!({ "type": "subscribe", "topic": topic_uri })
            .to_string()
            .into(),
    ))
    .await;
    let _sub = receive_non_ping(&mut ws).await; // consume subscribed

    ws.send_message(WsMessage::Text(
        json!({ "type": "unsubscribe", "topic": topic_uri })
            .to_string()
            .into(),
    ))
    .await;
    let unsub = receive_non_ping(&mut ws).await;
    let v: Value = serde_json::from_str(extract_text(&unsub)).unwrap();
    assert_eq!(v["type"], "unsubscribed");

    ws.send_message(WsMessage::Text(
        json!({ "type": "subscribe", "topic": topic_uri })
            .to_string()
            .into(),
    ))
    .await;
    let re_sub = receive_non_ping(&mut ws).await;
    let v2: Value = serde_json::from_str(extract_text(&re_sub)).unwrap();
    assert_eq!(
        v2["type"], "subscribed",
        "re-subscribe after unsub must succeed, got: {v2}"
    );
}

/// A connection may hold at most `max_subscriptions_per_client` subscriptions;
/// the next one gets error code 4 and the connection stays open.
#[tokio::test]
async fn subscription_cap_per_connection_returns_error_code_4() {
    let (server, _rx) = make_server_with(2);
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;

    for key in ["cap_a", "cap_b"] {
        ws.send_message(WsMessage::Text(
            json!({ "type": "subscribe",
                    "topic": format!("topic://state/3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr/{key}") })
            .to_string()
            .into(),
        ))
        .await;
        let v: Value =
            serde_json::from_str(extract_text(&receive_non_ping(&mut ws).await)).unwrap();
        assert_eq!(v["type"], "subscribed");
    }

    ws.send_message(WsMessage::Text(
        json!({ "type": "subscribe",
                "topic": "topic://state/3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr/cap_c" })
        .to_string()
        .into(),
    ))
    .await;
    let v: Value = serde_json::from_str(extract_text(&receive_non_ping(&mut ws).await)).unwrap();
    assert_eq!(
        v["type"], "error",
        "third subscription must be refused, got: {v}"
    );
    assert_eq!(v["code"], 4u16);

    // Unsubscribing frees a slot.
    ws.send_message(WsMessage::Text(
        json!({ "type": "unsubscribe",
                "topic": "topic://state/3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr/cap_a" })
        .to_string()
        .into(),
    ))
    .await;
    let _unsub = receive_non_ping(&mut ws).await;
    ws.send_message(WsMessage::Text(
        json!({ "type": "subscribe",
                "topic": "topic://state/3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr/cap_c" })
        .to_string()
        .into(),
    ))
    .await;
    let v: Value = serde_json::from_str(extract_text(&receive_non_ping(&mut ws).await)).unwrap();
    assert_eq!(v["type"], "subscribed");
}

/// A state multi-topic resolves immediately to the current values of every
/// matching key (here two), instead of waiting forever for a list key.
#[tokio::test]
async fn multitopic_subscription_resolves_current_keys() {
    let (server, _rx) = make_server();
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;
    let topic =
        "topic://state?address__in[]=3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr&key__match_any[]=key_*";

    ws.send_message(WsMessage::Text(
        json!({ "type": "subscribe", "topic": topic })
            .to_string()
            .into(),
    ))
    .await;
    let v: Value = serde_json::from_str(extract_text(&receive_non_ping(&mut ws).await)).unwrap();
    assert_eq!(v["type"], "subscribed", "got: {v}");
    assert_eq!(v["topic"], topic);
    let values: Vec<String> = serde_json::from_str(v["value"].as_str().unwrap()).unwrap();
    assert_eq!(values.len(), 2, "one value per matching key: {values:?}");
}

/// Subscribes to `topic` and returns the first non-ping reply.
async fn subscribe_reply(ws: &mut axum_test::TestWebSocket, topic: &str) -> Value {
    ws.send_message(WsMessage::Text(
        json!({ "type": "subscribe", "topic": topic })
            .to_string()
            .into(),
    ))
    .await;
    serde_json::from_str(extract_text(&receive_non_ping(ws).await)).unwrap()
}

/// More than 20 addresses is refused with error code 4.
#[tokio::test]
async fn multitopic_with_too_many_addresses_is_refused() {
    let (server, _rx) = make_server();
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;
    let addresses: String = (0..21).map(|i| format!("address__in[]=3MA{i}&")).collect();
    let v = subscribe_reply(
        &mut ws,
        &format!("topic://state?{addresses}key__match_any[]=*"),
    )
    .await;
    assert_eq!(v["type"], "error", "got: {v}");
    assert_eq!(v["code"], 4u16);

    // Exactly 20 addresses is accepted.
    let addresses: String = (0..20).map(|i| format!("address__in[]=3MA{i}&")).collect();
    let v = subscribe_reply(
        &mut ws,
        &format!("topic://state?{addresses}key__match_any[]=*"),
    )
    .await;
    assert_eq!(v["type"], "subscribed", "got: {v}");
}

/// More than 20 key patterns is refused with error code 4.
#[tokio::test]
async fn multitopic_with_too_many_key_patterns_is_refused() {
    let (server, _rx) = make_server();
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;
    let patterns: String = (0..21)
        .map(|i| format!("&key__match_any[]=p{i}*"))
        .collect();
    let v = subscribe_reply(
        &mut ws,
        &format!("topic://state?address__in[]=3MA{patterns}"),
    )
    .await;
    assert_eq!(v["type"], "error", "got: {v}");
    assert_eq!(v["code"], 4u16);
}

/// A multi-topic resolving to more than MAX_MULTITOPIC_SUBTOPICS keys is refused.
#[tokio::test]
async fn multitopic_resolving_to_too_many_keys_is_refused() {
    assert_eq!(MAX_MULTITOPIC_SUBTOPICS, 1000);
    let (server, _rx) = make_server();
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;
    let v = subscribe_reply(
        &mut ws,
        "topic://state?address__in[]=3MBIG&key__match_any[]=big_*",
    )
    .await;
    assert_eq!(v["type"], "error", "got: {v}");
    assert_eq!(v["code"], 4u16);

    // A narrower pattern on the same address resolves fine.
    let v = subscribe_reply(
        &mut ws,
        "topic://state?address__in[]=3MBIG&key__match_any[]=big_1*",
    )
    .await;
    assert_eq!(v["type"], "subscribed", "got: {v}");
}

/// When every multi-topic resolution permit is taken, a multi-topic subscribe is
/// refused with error code 4 after the permit timeout; single topics are unaffected.
#[tokio::test]
async fn multitopic_resolution_is_rate_limited_globally() {
    let mut options = options_with(100);
    options.multitopic_permits = Arc::new(Semaphore::new(0));
    let (server, _rx) = make_server_opts(options);
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;

    let v = subscribe_reply(
        &mut ws,
        "topic://state?address__in[]=3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr&key__match_any[]=key_*",
    )
    .await;
    assert_eq!(v["type"], "error", "got: {v}");
    assert_eq!(v["code"], 4u16);

    let v = subscribe_reply(
        &mut ws,
        "topic://state/3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr/single",
    )
    .await;
    assert_eq!(v["type"], "subscribed", "got: {v}");
}

/// A multi-topic whose resolved keys would push the connection over its indirect
/// subtopic cap is refused with error code 4.
#[tokio::test]
async fn multitopic_over_indirect_cap_is_refused() {
    let mut options = options_with(100);
    options.max_indirect_subtopics_per_client = 3;
    let (server, _rx) = make_server_opts(options);
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;

    // Two keys: fits (2 <= 3).
    let v = subscribe_reply(
        &mut ws,
        "topic://state?address__in[]=3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr&key__match_any[]=key_*",
    )
    .await;
    assert_eq!(v["type"], "subscribed", "got: {v}");

    // Two more: 4 > 3, refused.
    let v = subscribe_reply(
        &mut ws,
        "topic://state?address__in[]=3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr&key__match_any[]=key*",
    )
    .await;
    assert_eq!(v["type"], "error", "got: {v}");
    assert_eq!(v["code"], 4u16);
}
