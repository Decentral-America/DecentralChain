//! Redis pub/sub publisher — fired after each committed `PostgreSQL` transaction.
//!
//! After each Postgres commit the publisher sends two event classes to Redis:
//!
//! **State events** (`topic://state/{address}/{key}`):
//!   1. `SET`   — caches the current value so late subscribers get it on first read.
//!   2. `PUBLISH` — fans the update to active WebSocket subscribers in real time.
//!
//! **Transaction events** (`topic://transactions?type=all&address={addr}`):
//!   - `PUBLISH` only — no prior state to cache; subscribers receive the raw tx JSON.
//!   - Matches the channel scheme used by wavesplatform/wx-websocket-api, so the
//!     ws-api's `psubscribe("topic://*")` picks these up with no code changes.
//!
//! All Redis operations are fire-and-forget: failures are logged at WARN and skipped.

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

/// A single confirmed transaction to broadcast on Redis.
///
/// One `TxEvent` may publish to multiple channels — one per involved address
/// × topic type (e.g. `type=all` and `type=transfer`).
#[derive(Debug)]
pub struct TxEvent {
    /// `topic://transactions?type=…&address=…` channels to publish on.
    pub channels: Vec<String>,
    /// JSON payload — format matches the DCC node REST API response.
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

    /// Broadcast confirmed transactions to all subscribed WebSocket clients.
    ///
    /// Publishes to every channel in each `TxEvent`. No `SET` — transactions
    /// are point-in-time events, not queryable state.
    pub async fn publish_tx_batch(&self, events: &[TxEvent]) {
        for event in events {
            for channel in &event.channels {
                if let Err(e) = self
                    .client
                    .publish::<i64, _, _>(channel, &event.value)
                    .await
                {
                    tracing::warn!(channel = %channel, error = %e, "Redis tx PUBLISH failed; continuing");
                }
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

#[cfg(test)]
mod tests {
    use super::*;

    // ── value_to_json — happy-path and edge cases ─────────────────────────────

    #[test]
    fn value_to_json_none_is_null() {
        assert_eq!(value_to_json(None), "null");
    }

    #[test]
    fn value_to_json_integer_positive() {
        assert_eq!(value_to_json(Some(&Value::IntValue(42))), "42");
    }

    #[test]
    fn value_to_json_integer_negative() {
        assert_eq!(value_to_json(Some(&Value::IntValue(-1))), "-1");
    }

    #[test]
    fn value_to_json_integer_zero() {
        assert_eq!(value_to_json(Some(&Value::IntValue(0))), "0");
    }

    #[test]
    fn value_to_json_integer_max() {
        assert_eq!(
            value_to_json(Some(&Value::IntValue(i64::MAX))),
            i64::MAX.to_string()
        );
    }

    #[test]
    fn value_to_json_bool_true() {
        assert_eq!(value_to_json(Some(&Value::BoolValue(true))), "true");
    }

    #[test]
    fn value_to_json_bool_false() {
        assert_eq!(value_to_json(Some(&Value::BoolValue(false))), "false");
    }

    #[test]
    fn value_to_json_string_plain() {
        assert_eq!(
            value_to_json(Some(&Value::StringValue("hello".to_owned()))),
            r#""hello""#
        );
    }

    #[test]
    fn value_to_json_string_with_special_chars() {
        // serde_json escapes quotes and backslashes — verify round-trip fidelity.
        let raw = r#"say "hi" \ bye"#;
        let json = value_to_json(Some(&Value::StringValue(raw.to_owned())));
        let parsed: String = serde_json::from_str(&json).expect("valid JSON string");
        assert_eq!(parsed, raw, "round-trip: JSON → parse must restore original");
    }

    #[test]
    fn value_to_json_string_empty() {
        assert_eq!(
            value_to_json(Some(&Value::StringValue(String::new()))),
            r#""""#
        );
    }

    #[test]
    fn value_to_json_binary_is_base64_prefixed() {
        let bytes = vec![0u8, 1, 2, 255];
        let result = value_to_json(Some(&Value::BinaryValue(bytes.clone())));
        // Must be a JSON string starting with base64:
        assert!(result.starts_with(r#""base64:"#), "must start with base64: prefix");
        assert!(result.ends_with('"'), "must be quoted");

        // Round-trip: strip prefix and quotes, decode base64, compare bytes.
        let inner = &result[r#""base64:"#.len()..result.len() - 1];
        let decoded = BASE64.decode(inner).expect("valid base64");
        assert_eq!(decoded, bytes, "round-trip: base64 decode must restore original bytes");
    }

    #[test]
    fn value_to_json_binary_empty() {
        let result = value_to_json(Some(&Value::BinaryValue(vec![])));
        assert_eq!(result, r#""base64:""#);
    }
}
