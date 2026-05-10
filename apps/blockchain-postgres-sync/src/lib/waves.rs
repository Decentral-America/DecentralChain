use crate::utils::into_base58;
use bytes::{BufMut, BytesMut};
use regex::Regex;
use std::sync::LazyLock;

#[allow(clippy::unwrap_used)] // constant regex literal — failure is a code bug, not runtime input
pub static ASSET_ORACLE_DATA_ENTRY_KEY_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^(.*)_<([a-zA-Z\d]+)>$").unwrap());

pub type ChainId = u8;

pub const DCC_ID: &str = "DCC";

#[must_use]
pub fn keccak256(message: &[u8]) -> [u8; 32] {
    use sha3::{Digest, Keccak256};

    let mut hasher = Keccak256::new();
    hasher.update(message);
    hasher.finalize().into()
}

#[must_use]
pub fn blake2b256(message: &[u8]) -> [u8; 32] {
    use blake2::{digest::consts::U32, Blake2b, Digest};

    let mut hasher = Blake2b::<U32>::new();
    hasher.update(message);
    let res = hasher.finalize();
    res.into()
}

pub struct Address(String);
pub struct PublicKeyHash<'b>(pub &'b [u8]);

impl From<(&[u8], ChainId)> for Address {
    fn from((pk, chain_id): (&[u8], ChainId)) -> Self {
        let pkh = keccak256(&blake2b256(pk));

        let mut addr = BytesMut::with_capacity(26); // VERSION + CHAIN_ID + PKH + checksum

        addr.put_u8(1); // address version is always 1
        addr.put_u8(chain_id);
        addr.put_slice(&pkh[..20]);

        let chks = &keccak256(&blake2b256(&addr[..22]))[..4];

        addr.put_slice(chks);

        Self(into_base58(addr))
    }
}

impl From<(PublicKeyHash<'_>, ChainId)> for Address {
    fn from((PublicKeyHash(hash), chain_id): (PublicKeyHash, ChainId)) -> Self {
        let mut addr = BytesMut::with_capacity(26);

        addr.put_u8(1);
        addr.put_u8(chain_id);
        addr.put_slice(hash);

        let chks = &keccak256(&blake2b256(&addr[..22]))[..4];

        addr.put_slice(chks);

        Self(into_base58(addr))
    }
}

impl From<Address> for String {
    fn from(v: Address) -> Self {
        v.0
    }
}

#[must_use]
pub fn is_valid_base58(src: &str) -> bool {
    bs58::decode(src).into_vec().is_ok()
}

pub fn extract_asset_id(asset_id: impl AsRef<[u8]>) -> String {
    if asset_id.as_ref().is_empty() {
        DCC_ID.to_string()
    } else {
        into_base58(asset_id)
    }
}

pub fn is_dcc_asset_id(input: impl AsRef<[u8]>) -> bool {
    extract_asset_id(input) == DCC_ID
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    // ─── is_valid_base58 ──────────────────────────────────────────────────────

    #[test]
    fn should_validate_base58_string() {
        let test_cases = vec![
            ("3PC9BfRwJWWiw9AREE2B3eWzCks3CYtg4yo", true),
            ("not-valid-string", false),
        ];

        for (key, expected) in test_cases {
            let actual = is_valid_base58(key);
            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn is_valid_base58_empty_string_is_valid() {
        // Empty decodes to empty bytes — valid
        assert!(is_valid_base58(""));
    }

    #[test]
    fn is_valid_base58_rejects_zero_character() {
        // '0' (zero) is not in the base58 alphabet
        assert!(!is_valid_base58("0"));
    }

    #[test]
    fn is_valid_base58_rejects_upper_i() {
        // 'I' (capital I) is not in the base58 alphabet
        assert!(!is_valid_base58("I"));
    }

    // ─── extract_asset_id ─────────────────────────────────────────────────────

    #[test]
    fn extract_asset_id_empty_bytes_returns_dcc() {
        assert_eq!(extract_asset_id(b""), DCC_ID);
    }

    #[test]
    fn extract_asset_id_non_empty_encodes_as_base58() {
        let data = [1u8, 2, 3, 4];
        let result = extract_asset_id(data);
        assert_ne!(result, DCC_ID);
        assert!(is_valid_base58(&result));
    }

    // ─── is_dcc_asset_id ──────────────────────────────────────────────────────

    #[test]
    fn is_dcc_asset_id_true_for_empty() {
        assert!(is_dcc_asset_id(b""));
    }

    #[test]
    fn is_dcc_asset_id_false_for_non_empty() {
        assert!(!is_dcc_asset_id([1u8, 2, 3]));
    }

    // ─── keccak256 ────────────────────────────────────────────────────────────

    #[test]
    fn keccak256_empty_input_known_vector() {
        // keccak256("") = c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
        let result = keccak256(b"");
        let expected: [u8; 32] =
            hex::decode("c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")
                .unwrap()
                .try_into()
                .unwrap();
        assert_eq!(result, expected);
    }

    #[test]
    fn keccak256_produces_32_bytes() {
        let result = keccak256(b"hello");
        assert_eq!(result.len(), 32);
    }

    #[test]
    fn keccak256_deterministic() {
        let a = keccak256(b"test data");
        let b = keccak256(b"test data");
        assert_eq!(a, b);
    }

    // ─── blake2b256 ───────────────────────────────────────────────────────────

    #[test]
    fn blake2b256_produces_32_bytes() {
        let result = blake2b256(b"hello");
        assert_eq!(result.len(), 32);
    }

    #[test]
    fn blake2b256_deterministic() {
        let a = blake2b256(b"test data");
        let b = blake2b256(b"test data");
        assert_eq!(a, b);
    }

    #[test]
    fn blake2b256_different_inputs_differ() {
        let a = blake2b256(b"input a");
        let b = blake2b256(b"input b");
        assert_ne!(a, b);
    }

    // ─── Address derivation ───────────────────────────────────────────────────

    #[test]
    fn address_from_public_key_is_valid_base58() {
        // 32-byte dummy public key
        let pk = [0u8; 32];
        let chain_id: ChainId = 84; // DCC testnet — 'T' (byte 84)
        let addr_str: String = Address::from((pk.as_ref(), chain_id)).into();
        assert!(is_valid_base58(&addr_str));
        // Waves/DCC addresses are 35 chars in base58
        assert_eq!(addr_str.len(), 35);
    }

    #[test]
    fn address_deterministic() {
        let pk = [42u8; 32];
        let chain_id: ChainId = 84;
        let a: String = Address::from((pk.as_ref(), chain_id)).into();
        let b: String = Address::from((pk.as_ref(), chain_id)).into();
        assert_eq!(a, b);
    }

    #[test]
    fn address_from_pkh_matches_from_public_key() {
        let pk = [7u8; 32];
        let chain_id: ChainId = 84;

        // Derive PKH the same way Address::from does
        let pkh_full = keccak256(&blake2b256(&pk));
        let pkh_slice = &pkh_full[..20];

        let from_pk: String = Address::from((pk.as_ref(), chain_id)).into();
        let from_pkh: String = Address::from((PublicKeyHash(pkh_slice), chain_id)).into();
        assert_eq!(from_pk, from_pkh);
    }
}
