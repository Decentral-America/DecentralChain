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

    Ok(server::ServerConfig {
        port: flat.port,
        client_ping_interval: flat.client_ping_interval_in_secs,
        client_ping_failures_threshold: flat.client_ping_failures_threshold,
        graceful_shutdown_duration: Duration::from_secs(flat.graceful_shutdown_duration_seconds),
        max_connections: flat.max_connections,
    })
}
