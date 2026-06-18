//! Integration tests for message serialization / deserialization.

use serde_json::Value;

use crate::client::ClientSubscriptionKey;
use crate::messages::{IncomeMessage, OutcomeMessage};

// ── IncomeMessage ──────────────────────────────────────────────────────────────

#[test]
fn income_subscribe_round_trip() {
    let json = r#"{"type":"subscribe","topic":"topic://state/3MAddr/key"}"#;
    let msg: IncomeMessage = serde_json::from_str(json).expect("deserialize subscribe");
    match msg {
        IncomeMessage::Subscribe { topic } => {
            assert_eq!(topic.as_str(), "topic://state/3MAddr/key");
        }
        other => panic!("unexpected variant: {other:?}"),
    }
}

#[test]
fn income_unsubscribe_round_trip() {
    let json = r#"{"type":"unsubscribe","topic":"topic://state/3MAddr/key"}"#;
    let msg: IncomeMessage = serde_json::from_str(json).expect("deserialize unsubscribe");
    match msg {
        IncomeMessage::Unsubscribe { topic } => {
            assert_eq!(topic.as_str(), "topic://state/3MAddr/key");
        }
        other => panic!("unexpected variant: {other:?}"),
    }
}

#[test]
fn income_pong_round_trip() {
    let json = r#"{"type":"pong","message_number":42}"#;
    let msg: IncomeMessage = serde_json::from_str(json).expect("deserialize pong");
    match msg {
        IncomeMessage::Pong(p) => assert_eq!(p.message_number, 42),
        other => panic!("unexpected variant: {other:?}"),
    }
}

#[test]
fn income_invalid_json_returns_error() {
    let result = serde_json::from_str::<IncomeMessage>("not json");
    assert!(result.is_err());
}

#[test]
fn income_unknown_type_returns_error() {
    let json = r#"{"type":"magic","foo":"bar"}"#;
    let result = serde_json::from_str::<IncomeMessage>(json);
    assert!(
        result.is_err(),
        "unknown message type should fail to deserialize"
    );
}

// ── OutcomeMessage ─────────────────────────────────────────────────────────────

#[test]
fn outcome_ping_serializes_correctly() {
    let msg = OutcomeMessage::Ping { message_number: 7 };
    let v: Value = serde_json::from_str(&serde_json::to_string(&msg).unwrap()).unwrap();
    assert_eq!(v["type"], "ping");
    assert_eq!(v["message_number"], 7);
}

#[test]
fn outcome_update_serializes_correctly() {
    let key = ClientSubscriptionKey::new("topic://state/3MAddr/key");
    let msg = OutcomeMessage::Update {
        message_number: 1,
        topic: key,
        value: "42".to_owned(),
    };
    let v: Value = serde_json::from_str(&serde_json::to_string(&msg).unwrap()).unwrap();
    assert_eq!(v["type"], "update");
    assert_eq!(v["topic"], "topic://state/3MAddr/key");
    assert_eq!(v["value"], "42");
    assert_eq!(v["message_number"], 1);
}

#[test]
fn outcome_subscribed_serializes_correctly() {
    let key = ClientSubscriptionKey::new("topic://state/3MAddr/key");
    let msg = OutcomeMessage::Subscribed {
        message_number: 2,
        topic: key,
        value: "hello".to_owned(),
    };
    let v: Value = serde_json::from_str(&serde_json::to_string(&msg).unwrap()).unwrap();
    assert_eq!(v["type"], "subscribed");
    assert_eq!(v["message_number"], 2);
    assert_eq!(v["value"], "hello");
}

#[test]
fn outcome_unsubscribed_serializes_correctly() {
    let key = ClientSubscriptionKey::new("topic://state/3MAddr/key");
    let msg = OutcomeMessage::Unsubscribed {
        message_number: 3,
        topic: key,
    };
    let v: Value = serde_json::from_str(&serde_json::to_string(&msg).unwrap()).unwrap();
    assert_eq!(v["type"], "unsubscribed");
    assert_eq!(v["message_number"], 3);
    assert_eq!(v["topic"], "topic://state/3MAddr/key");
}

#[test]
fn outcome_error_serializes_correctly() {
    let mut details = std::collections::HashMap::new();
    details.insert("reason".to_owned(), "bad topic".to_owned());
    let msg = OutcomeMessage::Error {
        message_number: 4,
        code: 3,
        message: "Invalid topic".to_owned(),
        details: Some(details),
    };
    let v: Value = serde_json::from_str(&serde_json::to_string(&msg).unwrap()).unwrap();
    assert_eq!(v["type"], "error");
    assert_eq!(v["code"], 3);
    assert_eq!(v["message"], "Invalid topic");
    assert_eq!(v["details"]["reason"], "bad topic");
}

#[test]
fn outcome_error_without_details_serializes_null() {
    let msg = OutcomeMessage::Error {
        message_number: 5,
        code: 1,
        message: "oops".to_owned(),
        details: None,
    };
    let v: Value = serde_json::from_str(&serde_json::to_string(&msg).unwrap()).unwrap();
    assert_eq!(v["type"], "error");
    assert!(v["details"].is_null());
}

#[test]
fn income_subscribe_preserves_multi_topic_uri() {
    let json =
        r#"{"type":"subscribe","topic":"topic://state?address__in[]=3MAddr&key__match_any[]=*"}"#;
    let msg: IncomeMessage = serde_json::from_str(json).expect("deserialize multi-topic subscribe");
    match msg {
        IncomeMessage::Subscribe { topic } => {
            assert!(topic.as_str().starts_with("topic://state?"));
        }
        other => panic!("unexpected: {other:?}"),
    }
}

#[test]
fn client_subscription_key_round_trip() {
    let key = ClientSubscriptionKey::new("topic://state/addr/key");
    let serialized = serde_json::to_string(&key).expect("serialize key");
    let deserialized: ClientSubscriptionKey =
        serde_json::from_str(&serialized).expect("deserialize key");
    assert_eq!(key.as_str(), deserialized.as_str());
}

#[test]
fn outcome_message_into_ws_message_is_text() {
    use axum::extract::ws::Message;
    let msg = OutcomeMessage::Ping { message_number: 99 };
    let ws_msg = Message::from(msg);
    match ws_msg {
        Message::Text(t) => {
            let v: Value = serde_json::from_str(t.as_str()).expect("valid json");
            assert_eq!(v["type"], "ping");
        }
        other => panic!("expected text message, got {other:?}"),
    }
}
