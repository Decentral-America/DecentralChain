//! In-process resubscription to the node's `BlockchainUpdates` stream.
//!
//! Every node restart (deploy, crash drill, config reload) drops the gRPC
//! stream. Before this module, that ended the process and Docker restarted the
//! container (113 restarts on testnet by 2026-10-09, every one caused by a node
//! deploy). [`super::start`] recomputes its resume height from Postgres (with
//! the configured rollback depth) on every call, so calling it again in-process
//! is exactly what a container restart did, minus the restart.
//!
//! Only stream and connection failures are retried. Database and
//! data-consistency errors still end the process: those are not transient, and
//! retrying them would hide a real fault.

use std::future::Future;
use std::time::{Duration, Instant};

use anyhow::Result;
use tracing::warn;

use crate::error::Error as AppError;

/// First retry delay after the stream is lost.
pub const RETRY_INITIAL: Duration = Duration::from_secs(1);
/// Cap for the exponential backoff (a node restart takes ~30-90 s).
pub const RETRY_MAX: Duration = Duration::from_secs(30);
/// An attempt that ran at least this long was a healthy sync, not a
/// reconnect storm, so the next failure starts again from [`RETRY_INITIAL`].
pub const RETRY_RESET_AFTER: Duration = Duration::from_secs(60);

/// Whether `err` is a lost/failed updates stream (retryable) rather than a
/// database or data error (fatal).
#[must_use]
pub fn is_stream_error(err: &anyhow::Error) -> bool {
    err.chain().any(|cause| {
        matches!(
            cause.downcast_ref::<AppError>(),
            Some(AppError::StreamClosed(_) | AppError::StreamError(_))
        ) || cause.downcast_ref::<tonic::transport::Error>().is_some()
            || cause.downcast_ref::<tonic::Status>().is_some()
    })
}

/// Runs `attempt` until it returns `Ok` (graceful shutdown) or a non-stream
/// error, waiting with capped exponential backoff between stream failures.
/// `shutdown` resolving during a backoff wait ends the loop with `Ok`.
///
/// # Errors
///
/// Returns the first error from `attempt` that [`is_stream_error`] rejects.
pub async fn run_with_resubscribe<F, Fut, S>(mut attempt: F, shutdown: S) -> Result<()>
where
    F: FnMut() -> Fut,
    Fut: Future<Output = Result<()>>,
    S: Future<Output = ()>,
{
    tokio::pin!(shutdown);
    let mut backoff = RETRY_INITIAL;
    loop {
        let started = Instant::now();
        match attempt().await {
            Ok(()) => return Ok(()),
            Err(err) if is_stream_error(&err) => {
                if started.elapsed() >= RETRY_RESET_AFTER {
                    backoff = RETRY_INITIAL;
                }
                warn!(error = %err, retry_in = ?backoff, "updates stream lost, resubscribing");
                tokio::select! {
                    () = &mut shutdown => return Ok(()),
                    () = tokio::time::sleep(backoff) => {}
                }
                backoff = (backoff * 2).min(RETRY_MAX);
            }
            Err(err) => return Err(err),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use std::sync::atomic::{AtomicUsize, Ordering};

    fn stream_closed() -> anyhow::Error {
        anyhow::Error::new(AppError::StreamClosed(
            "GRPC Stream was closed by the server".into(),
        ))
    }

    #[test]
    fn classifies_stream_errors_as_retryable() {
        assert!(is_stream_error(&stream_closed()));
        assert!(is_stream_error(&anyhow::Error::new(AppError::StreamError(
            "x".into()
        ))));
        assert!(is_stream_error(&stream_closed().context("consumer failed")));
        assert!(is_stream_error(&anyhow::Error::new(
            tonic::Status::unavailable("node restarting")
        )));
    }

    #[test]
    fn classifies_data_errors_as_fatal() {
        assert!(!is_stream_error(&anyhow::Error::new(
            AppError::InconsistentDataError("x".into())
        )));
        assert!(!is_stream_error(&anyhow::anyhow!("DB connection failed")));
    }

    #[tokio::test(start_paused = true)]
    async fn resubscribes_after_stream_loss_then_finishes() {
        let calls = Arc::new(AtomicUsize::new(0));
        let c = calls.clone();
        let result = run_with_resubscribe(
            move || {
                let n = c.fetch_add(1, Ordering::SeqCst);
                async move { if n < 3 { Err(stream_closed()) } else { Ok(()) } }
            },
            std::future::pending(),
        )
        .await;
        assert!(result.is_ok());
        assert_eq!(calls.load(Ordering::SeqCst), 4);
    }

    #[tokio::test(start_paused = true)]
    async fn fatal_error_stops_without_retry() {
        let calls = Arc::new(AtomicUsize::new(0));
        let c = calls.clone();
        let result = run_with_resubscribe(
            move || {
                c.fetch_add(1, Ordering::SeqCst);
                async {
                    Err(anyhow::Error::new(AppError::InconsistentDataError(
                        "bad block".into(),
                    )))
                }
            },
            std::future::pending(),
        )
        .await;
        assert!(result.is_err());
        assert_eq!(calls.load(Ordering::SeqCst), 1);
    }

    #[tokio::test(start_paused = true)]
    async fn backoff_doubles_and_is_capped() {
        let start = tokio::time::Instant::now();
        let calls = Arc::new(AtomicUsize::new(0));
        let c = calls.clone();
        run_with_resubscribe(
            move || {
                let n = c.fetch_add(1, Ordering::SeqCst);
                async move { if n < 7 { Err(stream_closed()) } else { Ok(()) } }
            },
            std::future::pending(),
        )
        .await
        .expect("finishes once the stream stays up");
        // 1 + 2 + 4 + 8 + 16 + 30 + 30 seconds of backoff across 7 failures.
        assert_eq!(start.elapsed(), Duration::from_secs(91));
    }

    #[tokio::test(start_paused = true)]
    async fn shutdown_during_backoff_ends_cleanly() {
        let calls = Arc::new(AtomicUsize::new(0));
        let c = calls.clone();
        let result = run_with_resubscribe(
            move || {
                c.fetch_add(1, Ordering::SeqCst);
                async { Err(stream_closed()) }
            },
            tokio::time::sleep(Duration::from_millis(500)),
        )
        .await;
        assert!(result.is_ok());
        assert_eq!(calls.load(Ordering::SeqCst), 1);
    }
}
