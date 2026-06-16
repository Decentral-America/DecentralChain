mod client;
mod config;
mod error;
mod messages;
mod metrics;
mod refresher;
mod repo;
mod server;
mod shard;
mod topic;
mod updater;
mod websocket;

use error::Error;
use fred::interfaces::ClientLike;
use refresher::KeysRefresher;
use repo::RepoImpl;
use std::sync::Arc;
use std::time::Duration;
use tokio::signal::unix::{SignalKind, signal};
use tracing_subscriber::{EnvFilter, fmt};

fn main() -> Result<(), Error> {
    fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .json()
        .init();

    let rt = tokio::runtime::Runtime::new().expect("create tokio runtime");
    let result = rt.block_on(run());
    // 5 seconds — enough for tasks to flush logs and close sockets after run() returns.
    rt.shutdown_timeout(Duration::from_secs(5));
    result
}

async fn run() -> Result<(), Error> {
    let app_config = config::app::load()?;
    let repo_config = config::load_repo()?;
    let server_config = config::load_server()?;

    metrics::register_all();

    let pool = RepoImpl::build_pool(&repo_config)?;
    // The ConnectHandle drives the background connection task. Monitor it in the main
    // select so a fatal Redis failure surfaces immediately rather than silently disappearing.
    let mut pool_connect_handle = pool.init().await?;

    let clients = Arc::new(shard::Sharded::<client::Clients>::new(app_config.shard_count));
    let topics = Arc::new(client::Topics::default());

    let repo = Arc::new(RepoImpl::new(
        pool,
        repo_config.key_ttl,
        repo_config.refresh_threads,
    ));

    let refresher = KeysRefresher::new(repo.clone(), repo_config.key_ttl, topics.clone());
    let mut refresher_handle = tokio::spawn(async move { refresher.run().await });

    // Bounded channel provides backpressure: the updater blocks rather than growing
    // unboundedly under a Redis message burst. 10k messages is ~40MB worst-case.
    let (updates_tx, updates_rx) = tokio::sync::mpsc::channel(10_000);

    let mut updates_handler_handle = {
        let clients = clients.clone();
        let topics = topics.clone();
        tokio::task::spawn(websocket::updates_handler(
            updates_rx,
            clients,
            topics,
            repo.clone(),
        ))
    };

    let redis_config = repo::build_config(&repo_config)?;
    let mut updater_handle = tokio::spawn(updater::run(redis_config, updates_tx));

    let options = server::ServerOptions {
        client_ping_interval: Duration::from_secs(server_config.client_ping_interval),
        client_ping_failures_threshold: server_config.client_ping_failures_threshold as usize,
        max_connections: server_config.max_connections,
    };

    let (shutdown_signal_tx, mut shutdown_signal_rx) = tokio::sync::mpsc::channel(1);

    let (server_stop_tx, server_fut) = server::start(
        server_config.port,
        repo,
        clients.clone(),
        topics.clone(),
        options,
        shutdown_signal_tx,
    );

    let mut server_handle = tokio::spawn(server_fut);

    // Graceful drain: after SIGTERM or SIGINT, stagger-disconnect all clients
    // over the configured window before shutting down the process.
    let (drain_start_tx, drain_start_rx) = tokio::sync::oneshot::channel::<()>();
    let drain_duration = server_config.graceful_shutdown_duration;
    let clients_for_drain = clients.clone();

    let mut drain_handle = tokio::spawn(async move {
        if drain_start_rx.await.is_ok() {
            tracing::info!("graceful drain started");

            let mut all_clients = Vec::new();
            for shard in clients_for_drain.as_ref().into_iter() {
                for client in shard.read().await.values() {
                    all_clients.push(client.clone());
                }
            }

            let count = all_clients.len();
            if count > 0 {
                let count_u32 = u32::try_from(count).unwrap_or(u32::MAX);
                let interval = drain_duration / count_u32;
                tracing::debug!(count, ?interval, "draining clients");
                for client in all_clients {
                    tokio::time::sleep(interval).await;
                    client.lock().await.graceful_kill();
                }
            }

            tracing::info!("graceful drain complete");
        }
    });

    let mut drain_start_tx = Some(drain_start_tx);
    let mut sigterm = signal(SignalKind::terminate()).expect("register SIGTERM handler");

    let trigger_drain = |tx: &mut Option<tokio::sync::oneshot::Sender<()>>| {
        if let Some(t) = tx.take() {
            let _ = t.send(());
        }
    };

    loop {
        tokio::select! {
            _ = sigterm.recv() => {
                tracing::info!("received SIGTERM; starting graceful drain");
                trigger_drain(&mut drain_start_tx);
            }
            _ = tokio::signal::ctrl_c() => {
                tracing::info!("received SIGINT; starting graceful drain");
                trigger_drain(&mut drain_start_tx);
            }
            _ = &mut drain_handle => {
                tracing::info!("drain complete; shutting down");
                break;
            }
            r = &mut server_handle => {
                match r {
                    Ok(Ok(())) => tracing::info!("server exited cleanly"),
                    Ok(Err(e)) => tracing::error!(error = %e, "server exited with error"),
                    Err(e) => tracing::error!(error = %e, "server task panicked"),
                }
                break;
            }
            r = &mut refresher_handle => {
                tracing::error!(?r, "keys refresher exited unexpectedly");
                break;
            }
            r = &mut updater_handle => {
                tracing::error!(?r, "Redis updater exited unexpectedly");
                break;
            }
            r = &mut pool_connect_handle => {
                tracing::error!(?r, "Redis pool connection driver exited");
                break;
            }
            r = &mut updates_handler_handle => {
                tracing::error!(?r, "WebSocket updates handler exited unexpectedly");
                break;
            }
        }
    }

    // Close the shutdown signal AFTER drain: any connection tasks still in on_disconnect
    // will complete naturally; new connections are rejected from this point.
    shutdown_signal_rx.close();

    // Stop accepting new connections and wait for the server to finish.
    let _ = server_stop_tx.send(());

    // Abort all background tasks and wait for them to exit.
    refresher_handle.abort();
    updater_handle.abort();
    updates_handler_handle.abort();

    let _ = server_handle.await;
    let _ = refresher_handle.await;
    let _ = updater_handle.await;
    let _ = updates_handler_handle.await;

    tracing::info!("shutdown complete");
    Ok(())
}
