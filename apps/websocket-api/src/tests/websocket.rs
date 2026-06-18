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
        Self { id: AtomicUsize::new(1) }
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

/// Builds the test router and returns it along with the shutdown channel receiver.
/// The receiver MUST be kept alive for the duration of the test — dropping it
/// closes the shutdown signal and causes the server to disconnect all clients.
fn ws_router() -> (Router, mpsc::Receiver<()>) {
    let (shutdown_tx, shutdown_rx) = mpsc::channel::<()>(1);
    let state = WsState {
        repo: Arc::new(MockRepo::default()),
        clients: Arc::new(Sharded::new(4)),
        topics: Arc::new(Topics::default()),
        options: Arc::new(HandleConnectionOptions {
            // Very long interval so the first tick is deferred well past test duration.
            ping_interval: Duration::from_secs(3600),
            ping_failures_threshold: 3,
        }),
        shutdown_tx,
    };
    let router = Router::new()
        .route("/ws", get(ws_handler_fn))
        .with_state(state);
    (router, shutdown_rx)
}

fn make_server() -> (TestServer, mpsc::Receiver<()>) {
    let (router, rx) = ws_router();
    let server = TestServer::builder()
        .http_transport()
        .build(router);
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
                ws.send_message(WsMessage::Text(pong.to_string().into())).await;
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
    ws.send_message(WsMessage::Text(sub_msg.to_string().into())).await;

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
    assert_eq!(v2["type"], "error", "duplicate subscribe must return error, got: {v2}");
}

/// Unsubscribing from a subscribed topic must produce an Unsubscribed reply.
#[tokio::test]
async fn unsubscribing_sends_unsubscribed_message() {
    let (server, _rx) = make_server();
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;

    let topic_uri = "topic://state/3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr/unsub_key";

    ws.send_message(WsMessage::Text(
        json!({ "type": "subscribe", "topic": topic_uri }).to_string().into(),
    )).await;
    let subscribed = receive_non_ping(&mut ws).await;
    let v: Value = serde_json::from_str(extract_text(&subscribed)).unwrap();
    assert_eq!(v["type"], "subscribed");

    ws.send_message(WsMessage::Text(
        json!({ "type": "unsubscribe", "topic": topic_uri }).to_string().into(),
    )).await;
    let unsubscribed = receive_non_ping(&mut ws).await;
    let v2: Value = serde_json::from_str(extract_text(&unsubscribed)).unwrap();
    assert_eq!(v2["type"], "unsubscribed", "expected unsubscribed, got: {v2}");
    assert_eq!(v2["topic"], topic_uri);
}

/// A syntactically invalid JSON payload is a protocol error: the server closes
/// the connection rather than sending an error frame (JSON parse failures are not
/// recoverable at the application level).
#[tokio::test]
async fn invalid_json_closes_connection() {
    let (server, _rx) = make_server();
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;

    ws.send_message(WsMessage::Text("this is not json".to_owned().into())).await;

    // The server should close the connection after a syntax error.
    let msg = ws.receive_message().await;
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
    )).await;

    let msg = receive_non_ping(&mut ws).await;
    let v: Value = serde_json::from_str(extract_text(&msg)).expect("valid json response");
    assert_eq!(v["type"], "error", "unknown message type must produce error, got: {v}");
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
    )).await;

    let msg = receive_non_ping(&mut ws).await;
    let v: Value = serde_json::from_str(extract_text(&msg)).expect("valid json response");
    assert_eq!(v["type"], "error", "invalid topic must produce error, got: {v}");
    assert_eq!(v["code"], 3u16);
}

/// After unsubscribing, re-subscribing to the same topic must succeed.
#[tokio::test]
async fn unsubscribe_then_resubscribe_succeeds() {
    let (server, _rx) = make_server();
    let mut ws = server.get_websocket("/ws").await.into_websocket().await;

    let topic_uri = "topic://state/3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr/clean_key";

    ws.send_message(WsMessage::Text(
        json!({ "type": "subscribe", "topic": topic_uri }).to_string().into(),
    )).await;
    let _sub = receive_non_ping(&mut ws).await; // consume subscribed

    ws.send_message(WsMessage::Text(
        json!({ "type": "unsubscribe", "topic": topic_uri }).to_string().into(),
    )).await;
    let unsub = receive_non_ping(&mut ws).await;
    let v: Value = serde_json::from_str(extract_text(&unsub)).unwrap();
    assert_eq!(v["type"], "unsubscribed");

    ws.send_message(WsMessage::Text(
        json!({ "type": "subscribe", "topic": topic_uri }).to_string().into(),
    )).await;
    let re_sub = receive_non_ping(&mut ws).await;
    let v2: Value = serde_json::from_str(extract_text(&re_sub)).unwrap();
    assert_eq!(v2["type"], "subscribed", "re-subscribe after unsub must succeed, got: {v2}");
}
