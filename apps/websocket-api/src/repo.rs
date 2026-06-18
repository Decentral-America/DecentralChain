use crate::client::ClientId;
use crate::error::Error;
use crate::topic::Topic;
use fred::prelude::*;
use std::collections::HashMap;
use std::time::{Duration, Instant};
use tokio::task::JoinSet;

use self::counter::VersionCounter;

const CONNECTION_ID_KEY: &str = "NEXT_CONNECTION_ID";

pub struct RepoConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub key_ttl: Duration,
    pub max_pool_size: usize,
    pub refresh_threads: usize,
}

/// Builds a fred `Config` from the repo config using typed fields rather than a URL string,
/// which avoids the password ever appearing in a formatted string that could be logged.
pub fn build_config(cfg: &RepoConfig) -> Result<Config, Error> {
    Ok(Config {
        server: ServerConfig::new_centralized(cfg.host.as_str(), cfg.port),
        username: if cfg.username.is_empty() {
            None
        } else {
            Some(cfg.username.clone())
        },
        password: if cfg.password.is_empty() {
            None
        } else {
            Some(cfg.password.clone())
        },
        ..Config::default()
    })
}

/// Data access layer over Redis. All futures are `Send` so they compose safely
/// with axum's `on_upgrade` handler which requires `Send + 'static` futures.
pub trait Repo: Send + Sync {
    fn get_connection_id(
        &self,
    ) -> impl std::future::Future<Output = Result<ClientId, Error>> + Send;

    fn ping(&self) -> impl std::future::Future<Output = Result<(), Error>> + Send;

    fn subscribe<S: Into<String> + Send + Sync>(
        &self,
        key: S,
    ) -> impl std::future::Future<Output = Result<(), Error>> + Send;

    fn get_by_key(
        &self,
        key: &str,
    ) -> impl std::future::Future<Output = Result<Option<String>, Error>> + Send;

    fn get_by_keys(
        &self,
        keys: Vec<String>,
    ) -> impl std::future::Future<Output = Result<Vec<Option<String>>, Error>> + Send;

    fn refresh(
        &self,
        topics: Vec<Topic>,
    ) -> impl std::future::Future<Output = Result<HashMap<Topic, Instant>, Error>> + Send;
}

pub struct RepoImpl {
    pool: Pool,
    key_ttl: Duration,
    refresh_threads: usize,
    state_version: VersionCounter,
}

impl RepoImpl {
    pub fn new(pool: Pool, key_ttl: Duration, refresh_threads: usize) -> Self {
        Self {
            pool,
            key_ttl,
            refresh_threads,
            state_version: VersionCounter::default(),
        }
    }

    /// Builds a fred connection pool. Call `pool.init().await` before first use.
    pub fn build_pool(cfg: &RepoConfig) -> Result<Pool, Error> {
        let config = build_config(cfg)?;
        Builder::from_config(config)
            .build_pool(cfg.max_pool_size)
            .map_err(Error::Redis)
    }
}

impl Repo for RepoImpl {
    async fn get_connection_id(&self) -> Result<ClientId, Error> {
        let id: i64 = self.pool.incr(CONNECTION_ID_KEY).await?;
        if id < 1 {
            return Err(Error::ConfigValidation(format!(
                "Redis INCR returned non-positive client ID {id}; \
                 NEXT_CONNECTION_ID may have been reset or manipulated"
            )));
        }
        usize::try_from(id)
            .map_err(|_| Error::ConfigValidation(format!("client ID {id} overflows usize")))
    }

    async fn ping(&self) -> Result<(), Error> {
        self.pool.ping::<()>(None).await.map_err(Error::Redis)
    }

    async fn subscribe<S: Into<String> + Send + Sync>(&self, key: S) -> Result<(), Error> {
        let key = format!("sub:{}", key.into());
        // config::load_repo validates key_ttl ≤ 86400; this try_from is always Ok.
        let ttl = i64::try_from(self.key_ttl.as_secs())
            .expect("key_ttl is validated ≤ 86400 at config load");
        let version = self.state_version.next();
        self.pool
            .set::<(), _, _>(key, version, Some(Expiration::EX(ttl)), None, false)
            .await?;
        Ok(())
    }

    async fn get_by_key(&self, key: &str) -> Result<Option<String>, Error> {
        Ok(self.pool.get(key).await?)
    }

    async fn get_by_keys(&self, keys: Vec<String>) -> Result<Vec<Option<String>>, Error> {
        match keys.len() {
            0 => Ok(vec![]),
            1 => {
                // Single-key path: GET avoids MGET's array-response parsing overhead.
                let key = keys.into_iter().next().expect("len checked to be 1");
                let val: Option<String> = self.pool.get(key).await?;
                Ok(vec![val])
            }
            _ => Ok(self.pool.mget(keys).await?),
        }
    }

    async fn refresh(&self, mut topics: Vec<Topic>) -> Result<HashMap<Topic, Instant>, Error> {
        tracing::debug!(count = topics.len(), "refreshing TTLs in Redis");

        // config::load_repo validates key_ttl ≤ 86400; this try_from is always Ok.
        let ttl = i64::try_from(self.key_ttl.as_secs())
            .expect("key_ttl is validated ≤ 86400 at config load");

        // Distribute topics into at most refresh_threads batches. For small topic counts
        // (fewer topics than threads) this produces fewer tasks, not more.
        // JoinSet ties task lifetimes to this future — if the refresher is aborted,
        // the JoinSet drops and all spawned batch tasks are cancelled automatically.
        let thread_count = self.refresh_threads.min(topics.len());
        let chunk_size = topics.len().div_ceil(thread_count);
        let mut join_set: JoinSet<Result<HashMap<Topic, Instant>, Error>> = JoinSet::new();

        for batch_num in 1_usize.. {
            let batch = if topics.len() > chunk_size {
                topics.split_off(topics.len() - chunk_size)
            } else {
                std::mem::take(&mut topics)
            };

            let pool = self.pool.clone();
            join_set.spawn(async move {
                let mut result = HashMap::new();
                for topic in batch {
                    let key = format!("sub:{topic}");
                    pool.expire::<(), _>(&key, ttl, None).await?;
                    // Capture the timestamp AFTER the EXPIRE succeeds so that is_expiring()
                    // comparisons are never stale by more than one network round-trip.
                    result.insert(topic, Instant::now());
                }
                tracing::debug!(
                    batch = batch_num,
                    count = result.len(),
                    "TTL batch complete"
                );
                Ok(result)
            });

            if topics.is_empty() {
                break;
            }
        }

        let mut combined = HashMap::new();
        while let Some(res) = join_set.join_next().await {
            let batch = res.map_err(Error::Join)??;
            combined.extend(batch);
        }
        Ok(combined)
    }
}

mod counter {
    use std::sync::atomic::{AtomicU64, Ordering};

    #[derive(Default, Debug)]
    pub(super) struct VersionCounter(AtomicU64);

    impl VersionCounter {
        pub(super) fn next(&self) -> u64 {
            // Relaxed is correct here: the counter is only used to generate monotonically
            // increasing unique values; no other memory synchronization is required.
            self.0.fetch_add(1, Ordering::Relaxed)
        }
    }
}
