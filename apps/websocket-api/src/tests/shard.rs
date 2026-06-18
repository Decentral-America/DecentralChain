//! Integration tests for shard routing logic.

use std::sync::Mutex;

use crate::shard::Sharded;

#[test]
fn shard_count_must_be_positive() {
    // Verify the panic guard — calling Sharded::new(0) should panic.
    let result = std::panic::catch_unwind(|| Sharded::<Vec<u8>>::new(0));
    assert!(result.is_err(), "new(0) must panic");
}

#[test]
fn same_key_always_routes_to_same_shard() {
    let s = Sharded::<Mutex<Vec<u32>>>::new(8);
    let key = "test_address_3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr";
    s.get(&key).lock().unwrap().push(1);
    let val = s.get(&key).lock().unwrap().clone();
    assert_eq!(val, vec![1u32]);
}

#[test]
fn routing_is_deterministic_across_many_lookups() {
    let s = Sharded::<Mutex<u32>>::new(16);
    let key = 42usize;
    *s.get(&key).lock().unwrap() = 0;
    for _ in 0..100 {
        *s.get(&key).lock().unwrap() += 1;
    }
    assert_eq!(*s.get(&key).lock().unwrap(), 100);
}

#[test]
fn iteration_visits_exactly_shard_count_buckets() {
    let shards = 5u8;
    let s = Sharded::<Vec<u8>>::new(shards);
    let count = (&s).into_iter().count();
    assert_eq!(count, usize::from(shards));
}

#[test]
fn different_keys_may_map_to_different_shards() {
    // With 2 shards and many distinct keys, both shards should be populated.
    let s = Sharded::<Mutex<Vec<usize>>>::new(2);
    let keys: Vec<usize> = (0..64).collect();
    let mut shard_ptrs: std::collections::HashSet<*const Mutex<Vec<usize>>> =
        std::collections::HashSet::new();
    for k in &keys {
        shard_ptrs.insert(s.get(k) as *const _);
    }
    assert_eq!(shard_ptrs.len(), 2, "both shards should be used");
}

#[test]
fn single_shard_routes_all_keys_to_same_bucket() {
    let s = Sharded::<Mutex<u32>>::new(1);
    *s.get(&"a").lock().unwrap() += 1;
    *s.get(&42usize).lock().unwrap() += 1;
    *s.get(&99u8).lock().unwrap() += 1;
    assert_eq!(*s.get(&"a").lock().unwrap(), 3);
}

#[test]
fn sharded_default_container_starts_empty() {
    let s = Sharded::<Vec<u8>>::new(4);
    for bucket in &s {
        assert!(bucket.is_empty());
    }
}
