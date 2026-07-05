use anyhow::{Context, Result};
use app_lib::{config, consumer, db, publisher};
use axum::{Router, extract::State, routing::get};
use std::net::SocketAddr;
use std::sync::Arc;
use std::sync::atomic::{AtomicU32, Ordering};
use tokio::select;
use tracing::{error, info};
use tracing_subscriber::{EnvFilter, fmt};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialise structured logging from RUST_LOG (default: info)
    fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .json()
        .init();

    let config = config::load_consumer_config()?;

    info!(
        config = ?config.consumer,
        "starting blockchain-postgres-sync consumer",
    );

    let conn = db::async_pool(&config.postgres)
        .await
        .context("DB connection failed")?;

    let updates_src = consumer::updates::new(&config.consumer.blockchain_updates_url)
        .await
        .context("Blockchain gRPC connection failed")?;

    let pg_repo = consumer::repo::pg::new(conn.clone());

    // Optional Redis publisher — enabled when REDIS_URL is set in the environment.
    // Absent REDIS_URL → BPS-only mode; no Redis connection is attempted.
    let redis_publisher = match &config.consumer.redis_url {
        Some(url) => {
            let pub_ = publisher::Publisher::new(url)
                .await
                .context("Redis publisher connection failed")?;
            Some(pub_)
        }
        None => {
            tracing::info!("REDIS_URL not set — Redis publishing disabled");
            None
        }
    };

    // Health / readiness / metrics HTTP server
    let metrics_port = config.consumer.metrics_port;
    let health_conn = conn.clone();
    let last_synced_height = Arc::new(AtomicU32::new(0));
    let health_server = tokio::spawn({
        let last_synced_height = last_synced_height.clone();
        async move {
            let app = Router::new()
            .route("/health", get(|| async { "OK" }))
            .route(
                "/readiness",
                get(move || {
                    let c = health_conn.clone();
                    async move {
                        // Acquiring a connection proves the pool + DB are healthy.
                        c.get().await.map_or(
                            (axum::http::StatusCode::SERVICE_UNAVAILABLE, "not ready"),
                            |_conn| (axum::http::StatusCode::OK, "ready"),
                        )
                    }
                }),
            )
            .route(
                "/metrics",
                get(|State(height): State<Arc<AtomicU32>>| async move {
                    let height = height.load(Ordering::Relaxed);
                    (
                        [("content-type", "text/plain; version=0.0.4")],
                        format!(
                            "# HELP bps_up Whether the BPS consumer process is running.\n\
                             # TYPE bps_up gauge\n\
                             bps_up 1\n\
                             # HELP bps_last_synced_height Last blockchain height committed to Postgres.\n\
                             # TYPE bps_last_synced_height gauge\n\
                             bps_last_synced_height {height}\n"
                        ),
                    )
                }),
            )
            .with_state(last_synced_height);

            let addr = SocketAddr::from(([0, 0, 0, 0], metrics_port));
            let listener = tokio::net::TcpListener::bind(addr)
                .await
                .context("health listener bind failed")?;
            info!(%addr, "health server listening");
            axum::serve(listener, app)
                .await
                .context("health server failed")
        }
    });

    let consumer = consumer::start(
        updates_src,
        pg_repo,
        config.consumer,
        redis_publisher,
        last_synced_height,
    );

    select! {
        result = consumer => {
            if let Err(err) = result {
                error!(error = %err, "consumer stopped with error");
                return Err(err);
            }
            info!("consumer finished");
        },
        result = health_server => {
            match result {
                Err(err) => {
                    error!(error = ?err, "health server task panicked");
                }
                Ok(Err(err)) => {
                    error!(error = %err, "health server failed");
                    return Err(err);
                }
                Ok(Ok(())) => {
                    error!("health server stopped unexpectedly");
                }
            }
        }
    };
    Ok(())
}
