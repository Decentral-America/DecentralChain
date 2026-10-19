use crate::error::Error;
use crate::repo;
use crate::server;
use serde::Deserialize;
use std::time::Duration;

fn default_port() -> u16 {
    8080
}

fn default_repo_port() -> u16 {
    6379
}

fn default_client_ping_interval_in_secs() -> u64 {
    30
}

fn default_client_ping_failures_threshold() -> u16 {
    3
}

// Default is 25s — safely under Kubernetes' default terminationGracePeriodSeconds (30s).
// Set this to (terminationGracePeriodSeconds - 5) in your deployment manifest.
fn default_graceful_shutdown_duration_seconds() -> u64 {
    25
}

fn default_key_ttl() -> u64 {
    60
}

fn default_max_pool_size() -> usize {
    10
}

fn default_refresh_threads() -> usize {
    1
}

fn default_shard_count() -> u8 {
    20
}

fn default_max_connections() -> u32 {
    10_000
}

fn default_max_connections_per_ip() -> u32 {
    50
}

fn default_max_subscriptions_per_client() -> u32 {
    500
}

fn default_max_indirect_subtopics_per_client() -> u32 {
    5000
}

fn default_multitopic_resolve_concurrency() -> u32 {
    8
}

/// Upper bound for `MAX_INDIRECT_SUBTOPICS_PER_CLIENT`.
const MAX_INDIRECT_SUBTOPICS_UPPER: u32 = 100_000;
/// Upper bound for `MULTITOPIC_RESOLVE_CONCURRENCY`.
const MULTITOPIC_RESOLVE_CONCURRENCY_UPPER: u32 = 256;

#[derive(Deserialize)]
struct FlatServerConfig {
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "default_client_ping_interval_in_secs")]
    pub client_ping_interval_in_secs: u64,
    #[serde(default = "default_client_ping_failures_threshold")]
    pub client_ping_failures_threshold: u16,
    #[serde(default = "default_graceful_shutdown_duration_seconds")]
    pub graceful_shutdown_duration_seconds: u64,
    #[serde(default = "default_max_connections")]
    pub max_connections: u32,
    #[serde(default = "default_max_connections_per_ip")]
    pub max_connections_per_ip: u32,
    #[serde(default = "default_max_subscriptions_per_client")]
    pub max_subscriptions_per_client: u32,
    #[serde(default = "default_max_indirect_subtopics_per_client")]
    pub max_indirect_subtopics_per_client: u32,
    #[serde(default = "default_multitopic_resolve_concurrency")]
    pub multitopic_resolve_concurrency: u32,
}

#[derive(Deserialize)]
struct FlatRepoConfig {
    pub host: String,
    #[serde(default = "default_repo_port")]
    pub port: u16,
    pub username: String,
    pub password: String,
    #[serde(default = "default_key_ttl")]
    pub key_ttl: u64,
    #[serde(default = "default_max_pool_size")]
    pub max_pool_size: usize,
    #[serde(default = "default_refresh_threads")]
    pub refresh_threads: usize,
}

pub mod app {
    use crate::error::Error;

    #[derive(Debug, serde::Deserialize)]
    struct FlatConfig {
        #[serde(default = "super::default_shard_count")]
        pub shard_count: u8,
    }

    #[derive(Debug)]
    pub struct Config {
        /// Number of shards for the client map. Higher values reduce lock contention
        /// under high concurrent connection counts. Values in the range 8–64 are typical.
        pub shard_count: u8,
    }

    pub fn load() -> Result<Config, Error> {
        let flat = envy::from_env::<FlatConfig>()?;
        Ok(Config {
            shard_count: flat.shard_count,
        })
    }
}

pub fn load_repo() -> Result<repo::RepoConfig, Error> {
    let flat = envy::prefixed("REPO__").from_env::<FlatRepoConfig>()?;

    if flat.key_ttl < 10 {
        return Err(Error::ConfigValidation(format!(
            "REPO__KEY_TTL ({}) must be at least 10 seconds",
            flat.key_ttl
        )));
    }

    if flat.key_ttl > 86_400 {
        return Err(Error::ConfigValidation(format!(
            "REPO__KEY_TTL ({}) must be at most 86400 seconds (1 day)",
            flat.key_ttl
        )));
    }

    // Leave at least half the pool free for subscriptions, lookups, and pings.
    // Allowing all-but-one for refresh starves other operations under load.
    if flat.refresh_threads > flat.max_pool_size / 2 {
        return Err(Error::ConfigValidation(format!(
            "REPO__REFRESH_THREADS ({}) must be ≤ REPO__MAX_POOL_SIZE / 2 ({}); \
             refresh tasks must not exhaust the pool",
            flat.refresh_threads,
            flat.max_pool_size / 2,
        )));
    }

    Ok(repo::RepoConfig {
        host: flat.host,
        port: flat.port,
        username: flat.username,
        password: flat.password,
        key_ttl: Duration::from_secs(flat.key_ttl),
        max_pool_size: flat.max_pool_size,
        refresh_threads: flat.refresh_threads,
    })
}

pub fn load_server() -> Result<server::ServerConfig, Error> {
    let flat = envy::from_env::<FlatServerConfig>()?;

    if flat.max_connections_per_ip == 0 || flat.max_connections_per_ip > flat.max_connections {
        return Err(Error::ConfigValidation(format!(
            "MAX_CONNECTIONS_PER_IP ({}) must be between 1 and MAX_CONNECTIONS ({})",
            flat.max_connections_per_ip, flat.max_connections
        )));
    }
    if flat.max_subscriptions_per_client == 0 {
        return Err(Error::ConfigValidation(
            "MAX_SUBSCRIPTIONS_PER_CLIENT must be at least 1".to_owned(),
        ));
    }

    validate_multitopic_limits(
        flat.max_indirect_subtopics_per_client,
        flat.multitopic_resolve_concurrency,
    )?;

    Ok(server::ServerConfig {
        port: flat.port,
        client_ping_interval: flat.client_ping_interval_in_secs,
        client_ping_failures_threshold: flat.client_ping_failures_threshold,
        graceful_shutdown_duration: Duration::from_secs(flat.graceful_shutdown_duration_seconds),
        max_connections: flat.max_connections,
        max_connections_per_ip: flat.max_connections_per_ip,
        max_subscriptions_per_client: flat.max_subscriptions_per_client,
        max_indirect_subtopics_per_client: flat.max_indirect_subtopics_per_client,
        multitopic_resolve_concurrency: flat.multitopic_resolve_concurrency,
    })
}

/// `MAX_INDIRECT_SUBTOPICS_PER_CLIENT` must be in `1..=100000` and
/// `MULTITOPIC_RESOLVE_CONCURRENCY` in `1..=256`.
fn validate_multitopic_limits(max_indirect: u32, concurrency: u32) -> Result<(), Error> {
    if !(1..=MAX_INDIRECT_SUBTOPICS_UPPER).contains(&max_indirect) {
        return Err(Error::ConfigValidation(format!(
            "MAX_INDIRECT_SUBTOPICS_PER_CLIENT ({max_indirect}) must be between 1 and \
             {MAX_INDIRECT_SUBTOPICS_UPPER}"
        )));
    }
    if !(1..=MULTITOPIC_RESOLVE_CONCURRENCY_UPPER).contains(&concurrency) {
        return Err(Error::ConfigValidation(format!(
            "MULTITOPIC_RESOLVE_CONCURRENCY ({concurrency}) must be between 1 and \
             {MULTITOPIC_RESOLVE_CONCURRENCY_UPPER}"
        )));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn multitopic_limit_defaults_are_valid() {
        assert!(
            validate_multitopic_limits(
                default_max_indirect_subtopics_per_client(),
                default_multitopic_resolve_concurrency()
            )
            .is_ok()
        );
    }

    #[test]
    fn multitopic_limits_out_of_range_are_rejected() {
        for (indirect, concurrency) in [(0, 8), (100_001, 8), (5000, 0), (5000, 257)] {
            assert!(
                matches!(
                    validate_multitopic_limits(indirect, concurrency),
                    Err(Error::ConfigValidation(_))
                ),
                "({indirect}, {concurrency})"
            );
        }
        assert!(validate_multitopic_limits(100_000, 256).is_ok());
        assert!(validate_multitopic_limits(1, 1).is_ok());
    }
}
