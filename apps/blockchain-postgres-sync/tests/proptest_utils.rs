//! Property tests for utility functions.

use app_lib::utils::{
    epoch_ms_to_naivedatetime, escape_unicode_null, into_base58, into_prefixed_base64,
};
use proptest::prelude::*;

// ─── into_base58 ────────────────────────────────────────────────────────────

proptest! {
    #[test]
    fn base58_roundtrips(data in proptest::collection::vec(any::<u8>(), 0..256)) {
        let encoded = into_base58(&data);
        let decoded = bs58::decode(&encoded).into_vec().expect("base58 decode should succeed");
        prop_assert_eq!(decoded, data);
    }

    #[test]
    fn base58_output_is_ascii(data in proptest::collection::vec(any::<u8>(), 0..256)) {
        let encoded = into_base58(&data);
        prop_assert!(encoded.is_ascii());
    }
}

// ─── into_prefixed_base64 ───────────────────────────────────────────────────

proptest! {
    #[test]
    fn prefixed_base64_empty_returns_empty(dummy in Just(vec![])) {
        let result = into_prefixed_base64(&dummy);
        prop_assert_eq!(result, "");
    }

    #[test]
    fn prefixed_base64_non_empty_has_prefix(data in proptest::collection::vec(any::<u8>(), 1..256)) {
        let result = into_prefixed_base64(&data);
        prop_assert!(result.starts_with("base64:"), "Expected 'base64:' prefix, got: {}", result);
    }
}

// ─── epoch_ms_to_naivedatetime ──────────────────────────────────────────────

proptest! {
    #[test]
    fn epoch_timestamp_does_not_panic(ts in 0i64..=4_102_444_800_000i64) {
        // Valid blockchain timestamps: 2009-01-03 to 2100-01-01 (ms)
        let dt = epoch_ms_to_naivedatetime(ts);
        // Result should be non-default and after Unix epoch
        let epoch = epoch_ms_to_naivedatetime(0);
        prop_assert!(dt >= epoch);
    }

    #[test]
    fn epoch_timestamp_preserves_milliseconds(ts in 1_000_000_000_000i64..=2_000_000_000_000i64) {
        let dt = epoch_ms_to_naivedatetime(ts);
        // Sub-second nanos should reflect original millis
        #[allow(clippy::cast_sign_loss)]
        let expected_ms = (ts % 1000) as u32;
        let actual_ms = dt.and_utc().timestamp_subsec_millis();
        prop_assert_eq!(actual_ms, expected_ms);
    }
}

// ─── escape_unicode_null ────────────────────────────────────────────────────

proptest! {
    #[test]
    fn escape_unicode_null_removes_null_chars(s in ".*") {
        let result = escape_unicode_null(&s);
        prop_assert!(!result.contains('\0'), "Output should not contain null chars");
    }

    #[test]
    fn escape_unicode_null_preserves_non_null_content(s in "[a-zA-Z0-9 ]{0,100}") {
        // Strings without null chars should pass through unchanged
        let result = escape_unicode_null(&s);
        prop_assert_eq!(result, s);
    }
}
