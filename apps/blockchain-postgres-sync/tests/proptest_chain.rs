//! Property tests for cryptographic functions and address derivation.

use app_lib::chain::{Address, ChainId, PublicKeyHash, blake2b256, is_valid_base58, keccak256};
use proptest::prelude::*;

// ─── keccak256 ──────────────────────────────────────────────────────────────

proptest! {
    #[test]
    fn keccak256_always_returns_32_bytes(data in proptest::collection::vec(any::<u8>(), 0..1024)) {
        let hash = keccak256(&data);
        prop_assert_eq!(hash.len(), 32);
    }

    #[test]
    fn keccak256_is_deterministic(data in proptest::collection::vec(any::<u8>(), 0..512)) {
        let a = keccak256(&data);
        let b = keccak256(&data);
        prop_assert_eq!(a, b);
    }

    #[test]
    fn keccak256_different_inputs_produce_different_outputs(
        a in proptest::collection::vec(any::<u8>(), 1..256),
        b in proptest::collection::vec(any::<u8>(), 1..256),
    ) {
        prop_assume!(a != b);
        let ha = keccak256(&a);
        let hb = keccak256(&b);
        // Collision probability is astronomically low for 256-bit hashes
        prop_assert_ne!(ha, hb);
    }
}

// ─── blake2b256 ─────────────────────────────────────────────────────────────

proptest! {
    #[test]
    fn blake2b256_always_returns_32_bytes(data in proptest::collection::vec(any::<u8>(), 0..1024)) {
        let hash = blake2b256(&data);
        prop_assert_eq!(hash.len(), 32);
    }

    #[test]
    fn blake2b256_is_deterministic(data in proptest::collection::vec(any::<u8>(), 0..512)) {
        let a = blake2b256(&data);
        let b = blake2b256(&data);
        prop_assert_eq!(a, b);
    }
}

// ─── Address derivation ─────────────────────────────────────────────────────

proptest! {
    #[test]
    fn address_from_any_pubkey_is_valid_base58(
        pk in proptest::collection::vec(any::<u8>(), 32..=32),
        chain_id in any::<u8>(),
    ) {
        let addr: String = Address::from((pk.as_ref(), chain_id)).into();
        prop_assert!(is_valid_base58(&addr), "Address should be valid base58: {}", addr);
        // DCC addresses are always 35 base58 characters
        prop_assert_eq!(addr.len(), 35);
    }

    #[test]
    fn address_from_pkh_matches_from_pk(
        pk in proptest::collection::vec(any::<u8>(), 32..=32),
        chain_id in any::<u8>(),
    ) {
        let pkh_full = keccak256(&blake2b256(&pk));
        let from_pk: String = Address::from((pk.as_ref(), chain_id)).into();
        let from_pkh: String = Address::from((PublicKeyHash(&pkh_full[..20]), chain_id)).into();
        prop_assert_eq!(from_pk, from_pkh);
    }

    #[test]
    fn address_varies_with_chain_id(
        pk in proptest::collection::vec(any::<u8>(), 32..=32),
        c1 in any::<ChainId>(),
        c2 in any::<ChainId>(),
    ) {
        prop_assume!(c1 != c2);
        let a1: String = Address::from((pk.as_ref(), c1)).into();
        let a2: String = Address::from((pk.as_ref(), c2)).into();
        prop_assert_ne!(a1, a2);
    }
}
