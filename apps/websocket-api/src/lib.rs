// Library target — exposes internal modules for integration tests.
// The binary (src/main.rs) is the actual service entry point.
pub mod client;
pub mod config;
pub mod error;
pub mod messages;
pub mod metrics;
pub mod refresher;
pub mod repo;
pub mod server;
pub mod shard;
pub mod topic;
pub mod updater;
pub mod websocket;

#[cfg(test)]
pub mod tests;
