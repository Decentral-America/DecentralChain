//! Integration test modules for websocket-api.
//!
//! These tests are compiled only in cfg(test) mode via the library crate target.
//! Each sub-module focuses on a distinct component:
//!
//! - `messages`  — serialization / deserialization of WebSocket message types
//! - `topic`     — topic URI parsing, normalization, and accessor logic
//! - `shard`     — shard routing determinism and bucket distribution
//! - `health`    — /health HTTP endpoint via axum-test TestServer
//! - `websocket` — full WebSocket connection flow via axum-test WebSocket client

#![allow(clippy::unwrap_used)]

pub mod health;
pub mod messages;
pub mod shard;
pub mod topic;
pub mod websocket;
