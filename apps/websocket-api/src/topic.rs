//! Topic URI parser — inlined replacement for the legacy `wavesexchange_topic` crate.
//!
//! Topics are URI-like strings with the scheme `topic://`:
//!
//! - Concrete:   `topic://state/3MxAddress/some_key`
//! - Multi:      `topic://state?address__in[]=3MxAddr&key__match_any[]=pattern*`
//!
//! Concrete topics identify a single data point (address + key).
//! Multi-topics use query parameters to describe a filter over many data points.
//! The Redis pub/sub channel name is the canonical `Display` form of a `Topic`.

use std::fmt;

/// A parsed and normalized topic URI.
///
/// `Topic` is cheap to clone (`Arc<str>` inside) and implements `Hash + Eq`
/// so it can be used directly as a `HashMap` key.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Topic(Arc<str>);

use std::sync::Arc;

#[derive(Debug, Clone, thiserror::Error)]
#[error("invalid topic URI: {0}")]
pub struct TopicParseError(String);

impl From<String> for TopicParseError {
    fn from(s: String) -> Self {
        Self(s)
    }
}

impl Topic {
    /// Parse a topic URI string.
    ///
    /// Normalizes non-ASCII characters to their percent-encoded form.
    /// Returns [`TopicParseError`] if the string does not start with `topic://`
    /// or has no type component.
    pub fn parse_str(s: &str) -> Result<Self, TopicParseError> {
        let rest = s.strip_prefix("topic://").ok_or_else(|| {
            TopicParseError(format!("must start with 'topic://': {s}"))
        })?;

        if rest.is_empty() || rest.starts_with('/') || rest.starts_with('?') {
            return Err(TopicParseError(format!("missing type component: {s}")));
        }

        // Percent-encode any non-ASCII characters (e.g. Cyrillic in keys)
        let normalized: Arc<str> = percent_encode_non_ascii(s).into();
        Ok(Self(normalized))
    }

    /// Returns `true` if this is a state multi-topic.
    ///
    /// State multi-topics (`topic://state?address__in[]=…&key__match_any[]=…`)
    /// describe a set of concrete state topics via filter query parameters.
    /// The ws-api resolves them by computing subtopic expansions from Redis.
    ///
    /// Other topic types that happen to use query params — e.g.
    /// `topic://transactions?type=all&address=…` — are **exact-channel**
    /// subscriptions. BPS publishes to that exact Redis channel and the ws-api
    /// delivers the raw value to subscribed clients without any subtopic logic.
    pub fn is_multi_topic(&self) -> bool {
        self.0.starts_with("topic://state?")
    }

    /// Returns the data accessor for this topic.
    pub fn data(&self) -> TopicData<'_> {
        TopicData { uri: &self.0 }
    }
}

impl fmt::Display for Topic {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

/// Accessor for the type-specific data encoded in a topic URI.
pub struct TopicData<'a> {
    uri: &'a str,
}

impl<'a> TopicData<'a> {
    /// If this is a concrete state topic (`topic://state/ADDRESS/KEY`),
    /// returns the address and key segments.
    ///
    /// Returns `None` for multi-topics or non-state topics.
    pub fn as_state_single(&self) -> Option<StateSingle> {
        let rest = self.uri.strip_prefix("topic://state/")?;

        // Multi-topics have '?' — exclude them
        if rest.contains('?') {
            return None;
        }

        let mut parts = rest.splitn(2, '/');
        let address = parts.next().filter(|s| !s.is_empty())?;
        let key = parts.next().filter(|s| !s.is_empty() && !s.contains('/'))?;

        Some(StateSingle {
            address: address.to_owned(),
            key: key.to_owned(),
        })
    }
}

/// Address and key from a concrete `topic://state/ADDRESS/KEY` URI.
#[derive(Debug, Clone)]
pub struct StateSingle {
    pub address: String,
    pub key: String,
}

/// Percent-encode any non-ASCII bytes in `s`, leaving ASCII characters unchanged.
fn percent_encode_non_ascii(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for byte in s.bytes() {
        if byte.is_ascii() {
            out.push(byte as char);
        } else {
            use fmt::Write as _;
            write!(out, "%{byte:02X}").expect("write to String cannot fail");
        }
    }
    out
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    #[test]
    fn parse_concrete_state_topic() {
        let uri = "topic://state/3PPNhHYkkEy13gRWDCaruQyhNbX2GrjYSyV/some_key";
        let topic = Topic::parse_str(uri).unwrap();
        assert!(!topic.is_multi_topic());
        assert_eq!(topic.to_string(), uri);

        let StateSingle { address, key } = topic.data().as_state_single().unwrap();
        assert_eq!(address, "3PPNhHYkkEy13gRWDCaruQyhNbX2GrjYSyV");
        assert_eq!(key, "some_key");
    }

    #[test]
    fn parse_multi_topic() {
        let uri = "topic://state?address__in[]=3PPNhHYkkEy13gRWDCaruQyhNbX2GrjYSyV&key__match_any[]=%s%s%s__staked__3PNVVvuvWqpTnHPgWDTtESJhsBTYdGc4eQ8__*";
        let topic = Topic::parse_str(uri).unwrap();
        assert!(topic.is_multi_topic());
        assert!(topic.data().as_state_single().is_none());
    }

    #[test]
    fn transaction_topic_is_not_multi_topic() {
        // Transaction topics use query params as an exact Redis channel name,
        // not as filter descriptors — they must NOT be treated as multi-topics.
        let uri = "topic://transactions?type=all&address=3PPNhHYkkEy13gRWDCaruQyhNbX2GrjYSyV";
        let topic = Topic::parse_str(uri).unwrap();
        assert!(!topic.is_multi_topic(), "transaction topic must be an exact-channel (single) topic");
    }

    #[test]
    fn parse_concrete_with_percent_encoded_path() {
        let uri = "topic://state/3PPNhHYkkEy13gRWDCaruQyhNbX2GrjYSyV/%25s%25s%25s__staked__addr__key";
        let topic = Topic::parse_str(uri).unwrap();
        assert!(!topic.is_multi_topic());
        let d = topic.data().as_state_single().unwrap();
        assert_eq!(d.address, "3PPNhHYkkEy13gRWDCaruQyhNbX2GrjYSyV");
        assert_eq!(d.key, "%25s%25s%25s__staked__addr__key");
    }

    #[test]
    fn non_ascii_chars_are_percent_encoded() {
        // Simulate a topic with a non-ASCII char in the key
        let raw = "topic://state/3Maddr/кириллица";
        let topic = Topic::parse_str(raw).unwrap();
        // All bytes are ASCII in the normalized form
        assert!(topic.to_string().is_ascii());
        assert!(!topic.is_multi_topic());
    }

    #[test]
    fn reject_missing_scheme() {
        assert!(Topic::parse_str("state/addr/key").is_err());
        assert!(Topic::parse_str("http://state/addr/key").is_err());
    }

    #[test]
    fn reject_empty_type() {
        assert!(Topic::parse_str("topic://").is_err());
        assert!(Topic::parse_str("topic:///addr/key").is_err());
    }

    #[test]
    fn hash_and_eq_on_canonical_form() {
        use std::collections::HashMap;
        let t1 = Topic::parse_str("topic://state/addr/key").unwrap();
        let t2 = Topic::parse_str("topic://state/addr/key").unwrap();
        assert_eq!(t1, t2);

        let mut map = HashMap::new();
        map.insert(t1, "value");
        assert_eq!(map[&t2], "value");
    }
}
