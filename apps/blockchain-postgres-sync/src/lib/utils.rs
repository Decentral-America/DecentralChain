use base64::prelude::*;
use chrono::{DateTime, NaiveDateTime, Utc};

pub fn into_base58(b: impl AsRef<[u8]>) -> String {
    bs58::encode(b.as_ref()).into_string()
}

pub fn into_prefixed_base64(b: impl AsRef<[u8]>) -> String {
    let b = b.as_ref();
    if b.is_empty() {
        String::new()
    } else {
        String::from("base64:") + &BASE64_STANDARD.encode(b)
    }
}

pub fn epoch_ms_to_naivedatetime(ts: i64) -> NaiveDateTime {
    DateTime::<Utc>::from_timestamp(ts / 1000, (ts % 1000) as u32 * 1_000_000)
        .unwrap_or_else(|| panic!("invalid timestamp {ts}"))
        .naive_utc()
}

pub fn escape_unicode_null(s: impl AsRef<str>) -> String {
    s.as_ref().replace("\0", "\\0")
}

#[cfg(test)]
mod tests {
    use super::*;

    // ─── into_base58 ─────────────────────────────────────────────────────────

    #[test]
    fn into_base58_empty_bytes_returns_empty_string() {
        // bs58 encodes empty input as ""
        assert_eq!(into_base58(b""), "");
    }

    #[test]
    fn into_base58_single_zero_byte() {
        // bs58 encodes a single 0x00 byte as "1"
        assert_eq!(into_base58([0u8]), "1");
    }

    #[test]
    fn into_base58_known_vector() {
        // "hello world" in base58
        let encoded = into_base58(b"hello world");
        assert!(!encoded.is_empty());
        // Decode back to verify round-trip
        let decoded = bs58::decode(&encoded).into_vec().unwrap();
        assert_eq!(decoded, b"hello world");
    }

    #[test]
    fn into_base58_roundtrip_binary_data() {
        let data: Vec<u8> = (0u8..32).collect();
        let encoded = into_base58(&data);
        let decoded = bs58::decode(&encoded).into_vec().unwrap();
        assert_eq!(decoded, data);
    }

    // ─── into_prefixed_base64 ────────────────────────────────────────────────

    #[test]
    fn into_prefixed_base64_empty_returns_empty() {
        assert_eq!(into_prefixed_base64(b""), "");
    }

    #[test]
    fn into_prefixed_base64_non_empty_has_prefix() {
        let result = into_prefixed_base64(b"test");
        assert!(result.starts_with("base64:"), "missing prefix: {result}");
    }

    #[test]
    fn into_prefixed_base64_decodes_correctly() {
        let data = b"DecentralChain";
        let prefixed = into_prefixed_base64(data);
        let b64_part = prefixed.strip_prefix("base64:").unwrap();
        use base64::prelude::*;
        let decoded = BASE64_STANDARD.decode(b64_part).unwrap();
        assert_eq!(decoded, data);
    }

    #[test]
    fn into_prefixed_base64_binary_roundtrip() {
        let data: Vec<u8> = (0u8..=255).collect();
        let prefixed = into_prefixed_base64(&data);
        let b64_part = prefixed.strip_prefix("base64:").unwrap();
        use base64::prelude::*;
        let decoded = BASE64_STANDARD.decode(b64_part).unwrap();
        assert_eq!(decoded, data);
    }

    // ─── epoch_ms_to_naivedatetime ───────────────────────────────────────────

    #[test]
    fn epoch_ms_zero_is_unix_epoch() {
        let dt = epoch_ms_to_naivedatetime(0);
        assert_eq!(dt.and_utc().timestamp(), 0);
        assert_eq!(dt.and_utc().timestamp_subsec_millis(), 0);
    }

    #[test]
    fn epoch_ms_preserves_milliseconds() {
        // 1_000_500 ms = 1000 s + 500 ms
        let dt = epoch_ms_to_naivedatetime(1_000_500);
        assert_eq!(dt.and_utc().timestamp(), 1000);
        assert_eq!(dt.and_utc().timestamp_subsec_millis(), 500);
    }

    #[test]
    fn epoch_ms_known_timestamp() {
        // 2020-01-01 00:00:00 UTC = 1577836800000 ms
        let dt = epoch_ms_to_naivedatetime(1_577_836_800_000);
        assert_eq!(dt.and_utc().timestamp(), 1_577_836_800);
    }

    // ─── escape_unicode_null ─────────────────────────────────────────────────

    #[test]
    fn escape_unicode_null_no_nulls_unchanged() {
        let s = "hello world";
        assert_eq!(escape_unicode_null(s), s);
    }

    #[test]
    fn escape_unicode_null_replaces_null_byte() {
        let result = escape_unicode_null("abc\0def");
        assert_eq!(result, r"abc\0def");
    }

    #[test]
    fn escape_unicode_null_multiple_nulls() {
        let result = escape_unicode_null("\0\0\0");
        assert_eq!(result, r"\0\0\0");
    }

    #[test]
    fn escape_unicode_null_empty_string() {
        assert_eq!(escape_unicode_null(""), "");
    }

    #[test]
    fn escape_unicode_null_null_only() {
        assert_eq!(escape_unicode_null("\0"), "\\0");
    }
}
