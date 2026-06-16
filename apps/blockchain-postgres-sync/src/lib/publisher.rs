//! Redis pub/sub publisher — fired after each committed `PostgreSQL` transaction.
//!
//! For every data-entry change processed by the consumer, the publisher:
//!   1. `SET topic://state/{address}/{key} {value}` — so new subscribers
//!      get the current value immediately on first read.
//!   2. `PUBLISH topic://state/{address}/{key} {value}` — so active subscribers
//!      receive the update in real time.
//!
//! Both operations are fire-and-forget: a Redis failure is logged at `WARN`
//! level and does not affect `PostgreSQL` writes or process liveness.

use crate::proto::dcc::data_entry::Value;
use base64::{Engine, engine::general_purpose::STANDARD as BASE64};
use fred::interfaces::{ClientLike, KeysInterface, PubsubInterface};
use fred::prelude::*;

/// A single data-entry change to publish to Redis.
#[derive(Debug)]
pub struct DataEntryEvent {
    /// Redis channel and key: `topic://state/{base58_address}/{key}`
    pub channel: String,
    /// JSON representation of the value (see [`value_to_json`]).
    pub value: String,
}

/// Async Redis publisher backed by a single persistent connection.
///
/// `Client` (not `Pool`) is used because PUBLISH and SET are stateless
/// and fred's `Pool` does not implement `PubsubInterface`.
pub struct Publisher {
    client: Client,
}

impl Publisher {
    /// Connect to Redis and initialise the client.
    ///
    /// Accepts a Redis URL (`redis://:password@host:port/`) but immediately
    /// parses it into a typed `Config` so the password string is not retained
    /// in memory longer than necessary and never appears in formatted output.
    ///
    /// # Errors
    ///
    /// Returns an error if the URL is invalid or the initial connection fails.
    pub async fn new(url: &str) -> Result<Self, fred::error::Error> {
        // Parse into typed config immediately; the URL string is dropped.
        let parsed = Config::from_url(url)?;
        let config = Config {
            server: parsed.server,
            username: parsed.username,
            password: parsed.password,
            ..Config::default()
        };
        let client = Builder::from_config(config).build()?;
        client.init().await?;
        tracing::info!("Redis publisher connected");
        Ok(Self { client })
    }

    /// Publish a batch of data-entry changes to Redis.
    ///
    /// For each event:
    /// - `SET` stores the current value so new subscribers see it on first read.
    /// - `PUBLISH` notifies active WebSocket subscribers in real time.
    ///
    /// Failures are logged at WARN level and skipped — they do not propagate.
    pub async fn publish_batch(&self, events: &[DataEntryEvent]) {
        for event in events {
            // SET — current value for new subscribers (no TTL: blockchain state is permanent).
            if let Err(e) = self
                .client
                .set::<(), _, _>(&event.channel, &event.value, None, None, false)
                .await
            {
                tracing::warn!(channel = %event.channel, error = %e, "Redis SET failed; continuing");
            }

            // PUBLISH — real-time notification to active subscribers.
            if let Err(e) = self
                .client
                .publish::<i64, _, _>(&event.channel, &event.value)
                .await
            {
                tracing::warn!(channel = %event.channel, error = %e, "Redis PUBLISH failed; continuing");
            }
        }
    }
}

/// Serialise a protobuf data-entry value to a JSON string.
///
/// Format matches what the DCC REST API returns for individual data entries:
/// - Integer → bare number: `42`
/// - Boolean → `true` / `false`
/// - String  → JSON-quoted string: `"hello"`
/// - Binary  → `"base64:<standard-b64>"`
/// - Deleted (None) → `null` (the WebSocket API filters these as tombstones)
#[must_use]
pub fn value_to_json(value: Option<&Value>) -> String {
    match value {
        None => "null".to_owned(),
        Some(Value::IntValue(n)) => n.to_string(),
        Some(Value::BoolValue(b)) => b.to_string(),
        Some(Value::StringValue(s)) => {
            serde_json::to_string(s).unwrap_or_else(|_| "null".to_owned())
        }
        Some(Value::BinaryValue(b)) => {
            format!("\"base64:{}\"", BASE64.encode(b))
        }
    }
}
