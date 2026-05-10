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
