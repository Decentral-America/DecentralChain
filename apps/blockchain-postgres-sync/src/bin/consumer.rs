use anyhow::{Context, Result};
use app_lib::{config, consumer, db};
use axum::{routing::get, Router};
use std::net::SocketAddr;
use tokio::select;
use tracing::{error, info};
use tracing_subscriber::{fmt, EnvFilter};

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

    // Health / readiness HTTP server (replaces wavesexchange_warp + wavesexchange_liveness)
    let metrics_port = config.consumer.metrics_port;
    let health_conn = conn.clone();
    let health_server = tokio::spawn(async move {
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
            );

        let addr = SocketAddr::from(([0, 0, 0, 0], metrics_port));
        let listener = tokio::net::TcpListener::bind(addr)
            .await
            .expect("health listener bind");
        info!(%addr, "health server listening");
        axum::serve(listener, app).await.expect("health server");
    });

    let consumer = consumer::start(updates_src, pg_repo, config.consumer);

    select! {
        result = consumer => {
            if let Err(err) = result {
                error!(error = %err, "consumer stopped with error");
                return Err(err);
            }
            info!("consumer finished");
        },
        result = health_server => {
            if let Err(err) = result {
                error!(error = ?err, "health server panicked");
            } else {
                error!("health server stopped unexpectedly");
            }
        }
    };
    Ok(())
}
