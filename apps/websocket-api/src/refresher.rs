use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::select;

use crate::client::Topics;
use crate::error::Error;
use crate::repo::Repo;

/// Minimum interval between refresh passes. Guards against TTL values under 4s
/// producing a zero or near-zero interval that would spin the loop at 100% CPU.
const MIN_REFRESH_INTERVAL: Duration = Duration::from_secs(1);

pub struct KeysRefresher<R: Repo> {
    key_ttl: Duration,
    repo: Arc<R>,
    topics: Arc<Topics>,
}

impl<R: Repo> KeysRefresher<R> {
    pub fn new(repo: Arc<R>, key_ttl: Duration, topics: Arc<Topics>) -> Self {
        Self {
            key_ttl,
            repo,
            topics,
        }
    }

    pub async fn run(&self) -> Result<(), Error> {
        let refresh_interval = (self.key_ttl / 4).max(MIN_REFRESH_INTERVAL);

        loop {
            tokio::time::sleep(refresh_interval).await;

            let topics_to_refresh = {
                // Subtract half the TTL from now to find the expiry threshold.
                // checked_sub guards against underflow near process startup (panic = "abort").
                let expiry_threshold = Instant::now()
                    .checked_sub(self.key_ttl / 2)
                    .unwrap_or_else(Instant::now);
                // Half the refresh interval gives ample time for write-heavy paths to release
                // the lock. At 1/16 we skipped far too often under sustained write pressure.
                let read_timeout = refresh_interval / 2;
                let mut pending = Vec::new();

                select! {
                    guard = self.topics.read() => {
                        for (topic, info) in guard.topics_iter() {
                            if info.is_expiring(expiry_threshold) {
                                pending.push(topic.clone());
                            }
                        }
                    }
                    _ = tokio::time::sleep(read_timeout) => {
                        tracing::warn!(
                            timeout = ?read_timeout,
                            "could not acquire Topics read lock; skipping refresh iteration"
                        );
                        continue;
                    }
                }

                pending
            };

            if topics_to_refresh.is_empty() {
                continue;
            }

            match self.repo.refresh(topics_to_refresh).await {
                Ok(refreshed) => {
                    tracing::debug!(count = refreshed.len(), "storing refresh timestamps");
                    let mut guard = self.topics.write().await;
                    for (topic, refresh_time) in refreshed {
                        guard.refresh_topic(topic, refresh_time);
                    }
                }
                Err(e) => {
                    // A transient Redis error during TTL refresh is not service-fatal.
                    // Keys will expire and clients will silently lose their subscriptions
                    // if the condition persists, but a single failure should not crash the service.
                    tracing::error!(error = %e, "failed to refresh Redis TTLs; will retry next interval");
                }
            }
        }
    }
}
