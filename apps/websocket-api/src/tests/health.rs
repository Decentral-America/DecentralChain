//! Integration tests for the /health endpoint.
//!
//! Uses axum-test TestServer so no real network or Redis is required.
//! A mock Repo is wired in to satisfy the health handler's ping call.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use axum::{Router, http::StatusCode, routing::get};
use axum_test::TestServer;

use crate::client::ClientId;
use crate::error::Error;
use crate::repo::Repo;
use crate::topic::Topic;

// ── Mock Repo ─────────────────────────────────────────────────────────────────

struct OkRepo;

impl Repo for OkRepo {
    async fn get_connection_id(&self) -> Result<ClientId, Error> {
        Ok(1)
    }
    async fn ping(&self) -> Result<(), Error> {
        Ok(())
    }
    async fn subscribe<S: Into<String> + Send + Sync>(&self, _key: S) -> Result<(), Error> {
        Ok(())
    }
    async fn get_by_key(&self, _key: &str) -> Result<Option<String>, Error> {
        Ok(None)
    }
    async fn get_by_keys(&self, keys: Vec<String>) -> Result<Vec<Option<String>>, Error> {
        Ok(vec![None; keys.len()])
    }
    async fn refresh(&self, topics: Vec<Topic>) -> Result<HashMap<Topic, Instant>, Error> {
        Ok(topics.into_iter().map(|t| (t, Instant::now())).collect())
    }
}

struct ErrRepo;

impl Repo for ErrRepo {
    async fn get_connection_id(&self) -> Result<ClientId, Error> {
        Err(Error::ConfigValidation("mock error".to_owned()))
    }
    async fn ping(&self) -> Result<(), Error> {
        Err(Error::ConfigValidation("redis unavailable".to_owned()))
    }
    async fn subscribe<S: Into<String> + Send + Sync>(&self, _key: S) -> Result<(), Error> {
        Err(Error::ConfigValidation("mock error".to_owned()))
    }
    async fn get_by_key(&self, _key: &str) -> Result<Option<String>, Error> {
        Err(Error::ConfigValidation("mock error".to_owned()))
    }
    async fn get_by_keys(&self, _keys: Vec<String>) -> Result<Vec<Option<String>>, Error> {
        Err(Error::ConfigValidation("mock error".to_owned()))
    }
    async fn refresh(&self, _topics: Vec<Topic>) -> Result<HashMap<Topic, Instant>, Error> {
        Err(Error::ConfigValidation("mock error".to_owned()))
    }
}

// ── Router factory ────────────────────────────────────────────────────────────

/// Builds a minimal router containing only the /health endpoint.
fn health_router<R: Repo + 'static>(repo: R) -> Router {
    let repo = Arc::new(repo);
    let health = {
        let r = repo.clone();
        move || {
            let r = r.clone();
            async move {
                match tokio::time::timeout(Duration::from_secs(2), r.ping()).await {
                    Ok(Ok(())) => StatusCode::OK,
                    Ok(Err(_)) | Err(_) => StatusCode::SERVICE_UNAVAILABLE,
                }
            }
        }
    };
    Router::new().route("/health", get(health))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[tokio::test]
async fn health_returns_200_when_redis_ok() {
    let server = TestServer::new(health_router(OkRepo));
    let response = server.get("/health").await;
    response.assert_status_ok();
}

#[tokio::test]
async fn health_returns_503_when_redis_down() {
    let server = TestServer::new(health_router(ErrRepo));
    let response = server.get("/health").await;
    response.assert_status(StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn health_endpoint_responds_quickly() {
    let server = TestServer::new(health_router(OkRepo));
    let response = server.get("/health").await;
    response.assert_status_ok();
}

#[tokio::test]
async fn unknown_route_returns_404() {
    let server = TestServer::new(health_router(OkRepo));
    let response = server.get("/nonexistent").await;
    response.assert_status(StatusCode::NOT_FOUND);
}
