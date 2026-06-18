//! Integration tests for topic URI parsing and construction.

use crate::topic::{StateSingle, Topic};

#[test]
fn parse_concrete_state_topic_ok() {
    let uri = "topic://state/3PPNhHYkkEy13gRWDCaruQyhNbX2GrjYSyV/some_key";
    let topic = Topic::parse_str(uri).expect("valid concrete topic");
    assert!(!topic.is_multi_topic());
    assert_eq!(topic.to_string(), uri);
}

#[test]
fn parse_concrete_state_topic_extracts_address_and_key() {
    let uri = "topic://state/3PPNhHYkkEy13gRWDCaruQyhNbX2GrjYSyV/some_key";
    let topic = Topic::parse_str(uri).unwrap();
    let StateSingle { address, key } = topic.data().as_state_single().expect("state single");
    assert_eq!(address, "3PPNhHYkkEy13gRWDCaruQyhNbX2GrjYSyV");
    assert_eq!(key, "some_key");
}

#[test]
fn parse_multi_topic_ok() {
    let uri = "topic://state?address__in[]=3PPNhH&key__match_any[]=*";
    let topic = Topic::parse_str(uri).expect("valid multi-topic");
    assert!(topic.is_multi_topic());
    assert!(topic.data().as_state_single().is_none());
}

#[test]
fn parse_non_state_topic_not_multi() {
    let uri = "topic://transactions?type=all&address=3PPNhH";
    let topic = Topic::parse_str(uri).expect("valid transaction topic");
    assert!(!topic.is_multi_topic(), "transaction topic must be single");
}

#[test]
fn reject_missing_scheme() {
    assert!(Topic::parse_str("state/addr/key").is_err());
    assert!(Topic::parse_str("http://state/addr/key").is_err());
}

#[test]
fn reject_empty_type_component() {
    assert!(Topic::parse_str("topic://").is_err());
    assert!(Topic::parse_str("topic:///addr/key").is_err());
    assert!(Topic::parse_str("topic://?x=1").is_err());
}

#[test]
fn non_ascii_chars_are_percent_encoded() {
    let raw = "topic://state/3Maddr/кириллица";
    let topic = Topic::parse_str(raw).expect("valid topic with non-ASCII key");
    let canonical = topic.to_string();
    assert!(canonical.is_ascii(), "normalized form must be ASCII-only");
    assert!(!topic.is_multi_topic());
}

#[test]
fn topic_display_round_trip_for_concrete() {
    let uri = "topic://state/3MAddr/myKey123";
    let topic = Topic::parse_str(uri).unwrap();
    let display = topic.to_string();
    let reparsed = Topic::parse_str(&display).unwrap();
    assert_eq!(topic, reparsed);
}

#[test]
fn topic_equality_and_hash() {
    use std::collections::HashMap;
    let t1 = Topic::parse_str("topic://state/addr/key").unwrap();
    let t2 = Topic::parse_str("topic://state/addr/key").unwrap();
    assert_eq!(t1, t2);
    let mut map = HashMap::new();
    map.insert(t1, "val");
    assert_eq!(map[&t2], "val");
}

#[test]
fn topic_clone_is_equal_to_original() {
    let uri = "topic://state/3MAddr/key";
    let t = Topic::parse_str(uri).unwrap();
    let cloned = t.clone();
    assert_eq!(t, cloned);
}

#[test]
fn as_state_single_returns_none_for_non_state_topic() {
    let uri = "topic://balances/3MAddr";
    let topic = Topic::parse_str(uri).expect("valid non-state topic");
    assert!(topic.data().as_state_single().is_none());
}

#[test]
fn as_state_single_returns_none_for_multi_topic() {
    let uri = "topic://state?address__in[]=3MAddr&key__match_any[]=*";
    let topic = Topic::parse_str(uri).unwrap();
    assert!(topic.data().as_state_single().is_none());
}

#[test]
fn percent_encoded_ascii_key_preserved() {
    let uri = "topic://state/3MAddr/%25s%25s__staked__addr__key";
    let topic = Topic::parse_str(uri).unwrap();
    let StateSingle { key, .. } = topic.data().as_state_single().unwrap();
    assert_eq!(key, "%25s%25s__staked__addr__key");
}
