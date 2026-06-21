/*!
 * DCC cryptographic primitives — bit-exact match to packages/sdk/crypto.
 *
 * Uses ed25519-axolotl v1.7, the same crate as packages/sdk/crypto/Cargo.toml.
 * The axolotl library uses Vec<u32> (values 0-255) for all byte arrays.
 *
 * Key derivation chain (from ts-lib-crypto address-keys-seed.ts):
 *   seed_hash = sha256(keccak256(blake2b256(nonce_bytes + seed.utf8)))
 *
 * Then pass seed_hash to KeyPair::new — it applies the Curve25519 clamping
 * and computes the public key via crypto_scalarmult_base + sign-bit removal.
 */

use blake2::Blake2b;
use digest::consts::U32;
use sha3::Keccak256;
use sha2::{Digest as _, Sha256};
use ed25519_axolotl::crypto::keys::KeyPair;
use ed25519_axolotl::crypto::signatures::fast_signature;

type Blake2b256 = Blake2b<U32>;

// ── Internal helpers ──────────────────────────────────────────────────────────

fn to_u32_vec(bytes: &[u8]) -> Vec<u32> {
    bytes.iter().map(|&b| b as u32).collect()
}

fn from_u32_vec(v: &[u32]) -> Vec<u8> {
    v.iter().map(|&x| x as u8).collect()
}

/// 3-step DCC seed hash: sha256(keccak256(blake2b256(nonce_bytes + seed.utf8)))
#[allow(dead_code)] // used by derive_account, which is test-only
fn build_seed_hash(seed: &str, nonce: u32) -> [u8; 32] {
    let nonce_bytes = nonce.to_be_bytes();

    let mut h = Blake2b256::new();
    h.update(nonce_bytes);
    h.update(seed.as_bytes());
    let blake = h.finalize();

    let mut k = Keccak256::new();
    k.update(blake);
    let keccak = k.finalize();

    Sha256::digest(keccak).into()
}

// ── Public API ────────────────────────────────────────────────────────────────

/// Derive a DCC account.
/// Returns (clamped_private_key_32_bytes, public_key_base58, address_base58).
#[allow(dead_code)] // used in integration tests only
pub fn derive_account(seed: &str, chain_id: u8) -> ([u8; 32], String, String) {
    let hash   = build_seed_hash(seed, 0);
    let kp     = KeyPair::new(Some(to_u32_vec(&hash)));

    let priv_key: [u8; 32] = from_u32_vec(&kp.prvk).try_into()
        .expect("ed25519 private key must be 32 bytes");
    let pub_key_bytes       = from_u32_vec(&kp.pubk);

    let pub_key_b58 = bs58::encode(&pub_key_bytes).into_string();
    let addr_b58    = build_address(&pub_key_bytes, chain_id);

    (priv_key, pub_key_b58, addr_b58)
}

/// Sign `message` bytes. Returns 64-byte signature as Vec<u8>.
pub fn sign(priv_key: &[u8; 32], message: &[u8]) -> Vec<u8> {
    let random_zeros = vec![0u32; 64];   // deterministic signing — safe for load testing
    let sig_u32 = fast_signature(
        to_u32_vec(priv_key),
        to_u32_vec(message),
        Some(random_zeros),
    );
    from_u32_vec(&sig_u32)
}

/// Build a DCC address from raw public key bytes and chain ID.
/// Mirrors buildAddress() in ts-lib-crypto/src/crypto/address-keys-seed.ts.
pub fn build_address(pub_key: &[u8], chain_id: u8) -> String {
    // _hashChain(pubkey) = keccak256(blake2b256(pubkey)) → take first 20 bytes
    let mut bk = Blake2b256::new();
    bk.update(pub_key);
    let blake = bk.finalize();

    let mut k = Keccak256::new();
    k.update(blake);
    let keccak = k.finalize();

    let mut raw = vec![0x01u8, chain_id];
    raw.extend_from_slice(&keccak[..20]);

    // checksum = _hashChain(rawAddress)[0..4]
    let mut bk2 = Blake2b256::new();
    bk2.update(&raw);
    let blake2 = bk2.finalize();

    let mut k2 = Keccak256::new();
    k2.update(blake2);
    let keccak2 = k2.finalize();

    raw.extend_from_slice(&keccak2[..4]);
    bs58::encode(&raw).into_string()
}

/// Compute API key hash: Base58(keccak256(blake2b256(key.utf8_bytes)))
#[allow(dead_code)] // used in integration tests only
pub fn api_key_hash(key: &str) -> String {
    let mut h = Blake2b256::new();
    h.update(key.as_bytes());
    let blake = h.finalize();

    let mut k = Keccak256::new();
    k.update(blake);
    bs58::encode(k.finalize().as_slice()).into_string()
}
