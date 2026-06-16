use axum::{
    Router,
    extract::{
        State,
        ws::{WebSocket, WebSocketUpgrade},
    },
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::get,
};
use prometheus::{Encoder, TextEncoder};
use std::net::{Ipv4Addr, SocketAddr};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{Semaphore, oneshot};
use tower_http::request_id::{MakeRequestUuid, PropagateRequestIdLayer, SetRequestIdLayer};
use tower_http::trace::TraceLayer;

use crate::client::{Clients, Topics};
use crate::error::Error;
use crate::metrics::REGISTRY;
use crate::repo::Repo;
use crate::shard::Sharded;
use crate::websocket;

pub struct ServerConfig {
    pub port: u16,
    pub client_ping_interval: u64,
    pub client_ping_failures_threshold: u16,
    pub graceful_shutdown_duration: Duration,
    pub max_connections: u32,
}

pub struct ServerOptions {
    pub client_ping_interval: Duration,
    pub client_ping_failures_threshold: usize,
    pub max_connections: u32,
}

struct AppState<R: Repo + 'static> {
    repo: Arc<R>,
    clients: Arc<Sharded<Clients>>,
    topics: Arc<Topics>,
    options: Arc<websocket::HandleConnectionOptions>,
    shutdown_signal: tokio::sync::mpsc::Sender<()>,
    connection_semaphore: Arc<Semaphore>,
}

// Manual Clone implementation so we don't require R: Clone —
// Arc<R> is always Clone regardless of whether R is.
impl<R: Repo + 'static> Clone for AppState<R> {
    fn clone(&self) -> Self {
        Self {
            repo: Arc::clone(&self.repo),
            clients: Arc::clone(&self.clients),
            topics: Arc::clone(&self.topics),
            options: Arc::clone(&self.options),
            shutdown_signal: self.shutdown_signal.clone(),
            connection_semaphore: Arc::clone(&self.connection_semaphore),
        }
    }
}

pub fn start<R: Repo + 'static>(
    port: u16,
    repo: Arc<R>,
    clients: Arc<Sharded<Clients>>,
    topics: Arc<Topics>,
    options: ServerOptions,
    shutdown_signal: tokio::sync::mpsc::Sender<()>,
) -> (oneshot::Sender<()>, impl std::future::Future<Output = Result<(), Error>>) {
    let handle_opts = Arc::new(websocket::HandleConnectionOptions {
        ping_interval: options.client_ping_interval,
        ping_failures_threshold: options.client_ping_failures_threshold,
    });

    let max_conn = usize::try_from(options.max_connections).unwrap_or(usize::MAX);
    let state = AppState {
        repo,
        clients,
        topics,
        options: handle_opts,
        shutdown_signal,
        connection_semaphore: Arc::new(Semaphore::new(max_conn)),
    };

    // Layer order: first .layer() call = outermost = first to process the request.
    // SetRequestId runs first (assigns the ID), then Propagate forwards it in headers,
    // then TraceLayer sees the request with the ID already present in the span.
    let app = Router::new()
        .route("/ws", get(ws_handler::<R>))
        .route("/metrics", get(metrics_handler))
        .route("/health", get(health_handler::<R>))
        .with_state(state)
        .layer(SetRequestIdLayer::x_request_id(MakeRequestUuid))
        .layer(PropagateRequestIdLayer::x_request_id())
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from((Ipv4Addr::UNSPECIFIED, port));
    tracing::info!(%addr, "WebSocket server listening");

    let (stop_tx, stop_rx) = oneshot::channel::<()>();

    let server_fut = async move {
        let listener = tokio::net::TcpListener::bind(addr)
            .await
            .map_err(|e| Error::ConfigValidation(format!("bind {addr}: {e}")))?;

        axum::serve(listener, app)
            .with_graceful_shutdown(async move {
                let _ = stop_rx.await;
            })
            .await
            .map_err(|e| Error::ConfigValidation(format!("server error: {e}")))?;

        Ok(())
    };

    (stop_tx, server_fut)
}

async fn ws_handler<R: Repo + 'static>(
    ws: WebSocketUpgrade,
    headers: HeaderMap,
    State(state): State<AppState<R>>,
) -> Response {
    let request_id = headers
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .map(str::to_owned);

    // Reject with 503 when at capacity — prevent memory/fd exhaustion.
    let permit = match Arc::clone(&state.connection_semaphore).try_acquire_owned() {
        Ok(p) => p,
        Err(_) => {
            tracing::warn!("connection limit reached; rejecting new WebSocket connection");
            return StatusCode::SERVICE_UNAVAILABLE.into_response();
        }
    };

    ws.on_upgrade(move |socket| async move {
        // Hold the semaphore permit for the lifetime of this connection.
        let _permit = permit;
        handle_upgraded::<R>(socket, state, request_id).await;
    })
}

async fn handle_upgraded<R: Repo + 'static>(
    socket: WebSocket,
    state: AppState<R>,
    request_id: Option<String>,
) {
    if let Err(e) = websocket::handle_connection(
        socket,
        state.clients,
        state.topics,
        state.repo,
        (*state.options).clone(),
        request_id,
        state.shutdown_signal,
    )
    .await
    {
        tracing::error!(error = %e, "WebSocket connection error");
    }
}

async fn health_handler<R: Repo + 'static>(
    State(state): State<AppState<R>>,
) -> StatusCode {
    match tokio::time::timeout(Duration::from_secs(2), state.repo.ping()).await {
        Ok(Ok(())) => StatusCode::OK,
        Ok(Err(e)) => {
            tracing::warn!(error = %e, "health check: Redis ping failed");
            StatusCode::SERVICE_UNAVAILABLE
        }
        Err(_) => {
            tracing::warn!("health check: Redis ping timed out");
            StatusCode::SERVICE_UNAVAILABLE
        }
    }
}

async fn metrics_handler() -> impl IntoResponse {
    let encoder = TextEncoder::new();

    let mut buf = Vec::new();
    if let Err(e) = encoder.encode(&REGISTRY.gather(), &mut buf) {
        tracing::error!(error = %e, "failed to encode custom metrics");
        return (StatusCode::INTERNAL_SERVER_ERROR, "metrics encoding error").into_response();
    }

    let mut output = match String::from_utf8(buf) {
        Ok(s) => s,
        Err(e) => {
            tracing::error!(error = %e, "custom metrics produced non-UTF-8 output");
            return (StatusCode::INTERNAL_SERVER_ERROR, "metrics encoding error").into_response();
        }
    };

    let mut buf = Vec::new();
    if let Err(e) = encoder.encode(&prometheus::gather(), &mut buf) {
        tracing::error!(error = %e, "failed to encode default metrics");
        return (StatusCode::INTERNAL_SERVER_ERROR, "metrics encoding error").into_response();
    }
    if let Ok(s) = String::from_utf8(buf) {
        output.push_str(&s);
    }

    (
        [(axum::http::header::CONTENT_TYPE, "text/plain; version=0.0.4")],
        output,
    )
        .into_response()
}
