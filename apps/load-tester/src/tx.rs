/*!
 * Transaction building and pre-signing.
 *
 * Implements DCC Transfer v3 Protobuf serialization, bit-exact with the
 * pywaves-ce txSigner.signType04WavesTx implementation:
 *
 *   transaction = Transaction {
 *     chain_id: ord(chain_id)          // field 1, varint
 *     sender_public_key: pubkey_bytes  // field 2, bytes
 *     fee: Amount { amount: fee }      // field 3, nested message
 *     timestamp: ts                    // field 4, varint
 *     version: 3                       // field 5, varint
 *     transfer: TransferTransactionData { // field 104, nested message
 *       recipient: Recipient { public_key_hash: addr[2..22] }
 *       amount: Amount { amount: amount }
 *       attachment: b""
 *     }
 *   }
 *   sign_bytes = transaction.SerializeToString()
 */

use prost::Message;
use serde_json::{json, Value};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::crypto;

// ── Protobuf message definitions (inlined to avoid build.rs complexity) ──────

/// waves.Amount
#[derive(prost::Message)]
struct ProtoAmount {
    #[prost(bytes, optional, tag = "1")]
    asset_id: Option<Vec<u8>>,
    #[prost(int64, tag = "2")]
    amount: i64,
}

/// waves.Recipient (only public_key_hash variant used for addresses)
#[derive(prost::Message)]
struct ProtoRecipient {
    /// oneof recipient { public_key_hash (field 1), alias (field 2) }
    /// We always use field 1.
    #[prost(bytes, optional, tag = "1")]
    public_key_hash: Option<Vec<u8>>,
}

/// waves.TransferTransactionData
#[derive(prost::Message)]
struct ProtoTransferData {
    #[prost(message, optional, tag = "1")]
    recipient: Option<ProtoRecipient>,
    #[prost(message, optional, tag = "2")]
    amount: Option<ProtoAmount>,
    #[prost(bytes, tag = "3")]
    attachment: Vec<u8>,
}

/// waves.Transaction (subset of fields used for Transfer v3)
#[derive(prost::Message)]
struct ProtoTransaction {
    #[prost(int32, tag = "1")]
    chain_id: i32,
    #[prost(bytes, tag = "2")]
    sender_public_key: Vec<u8>,
    #[prost(message, optional, tag = "3")]
    fee: Option<ProtoAmount>,
    #[prost(int64, tag = "4")]
    timestamp: i64,
    #[prost(int32, tag = "5")]
    version: i32,
    /// Transfer uses oneof field 104 in the full DCC proto
    #[prost(message, optional, tag = "104")]
    transfer: Option<ProtoTransferData>,
}

// ── Public API ────────────────────────────────────────────────────────────────

/// A fully signed, JSON-serializable transaction ready to broadcast.
pub struct SignedTx {
    pub body: Value,
}

/// Pre-sign `count` Transfer (Type 4, Version 3) TXs distributed across
/// `sender_count` accounts derived from `seed` (nonce 0, 1, 2, …).
///
/// Multiple senders are essential at high TPS: each DCC node enforces a
/// per-account UTX pool limit. Distributing across N senders multiplies the
/// effective ceiling by N without modifying node config.
///
/// The returned Vec interleaves senders round-robin so the worker pool
/// distributes TXs evenly across all senders automatically.
pub fn presign_batch(
    seed:         &str,
    chain_id:     &str,
    recipient:    Option<&str>,
    count:        usize,
    sender_count: usize,
) -> anyhow::Result<Vec<SignedTx>> {
    let chain_byte = chain_id.as_bytes().first().copied()
        .ok_or_else(|| anyhow::anyhow!("chain_id must not be empty"))?;

    let sender_count = sender_count.max(1);

    // Derive all sender accounts from seed with nonces 0..sender_count
    let senders: Vec<([u8; 32], Vec<u8>, String)> = (0..sender_count)
        .map(|nonce| {
            use sha2::{Digest, Sha256};
            use sha3::Keccak256;
            use blake2::Blake2b;
            use digest::consts::U32;

            type Blake2b256 = Blake2b<U32>;

            // 3-step seed hash with nonce
            let nonce_bytes = (nonce as u32).to_be_bytes();
            let mut h = Blake2b256::new();
            h.update(nonce_bytes);
            h.update(seed.as_bytes());
            let blake = h.finalize();
            let mut k = Keccak256::new();
            k.update(blake);
            let keccak = k.finalize();
            let hash: [u8; 32] = Sha256::digest(keccak).into();

            // Use ed25519-axolotl KeyPair for public key derivation
            use ed25519_axolotl::crypto::keys::KeyPair;
            let kp = KeyPair::new(Some(hash.iter().map(|&b| b as u32).collect()));
            let priv_key: [u8; 32] = kp.prvk.iter().map(|&x| x as u8).collect::<Vec<_>>().try_into()
                .expect("ed25519 private key must be 32 bytes");
            let pub_key_bytes: Vec<u8> = kp.pubk.iter().map(|&x| x as u8).collect();
            let addr = crypto::build_address(&pub_key_bytes, chain_byte);
            (priv_key, pub_key_bytes, addr)
        })
        .collect();

    // First sender's address as fallback recipient
    let first_addr = senders.first().map(|(_, _, a)| a.clone()).unwrap_or_default();
    let to = recipient.unwrap_or(&first_addr).to_owned();

    // Decode recipient address: base58 → bytes, take bytes [2..22] as pk_hash
    let recipient_bytes = bs58::decode(&to).into_vec()
        .map_err(|e| anyhow::anyhow!("Invalid recipient address '{}': {}", to, e))?;
    anyhow::ensure!(
        recipient_bytes.len() >= 22,
        "Recipient address too short: {} bytes (expected ≥ 22)",
        recipient_bytes.len()
    );
    let pk_hash = recipient_bytes[2..22].to_vec();

    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| anyhow::anyhow!("System clock error: {}", e))?
        .as_millis() as u64;

    let mut txs = Vec::with_capacity(count);

    for i in 0..count {
        // Round-robin across senders — distributes UTX load evenly
        let sender_idx              = i % sender_count;
        let (priv_key, pub_key_bytes, sender_addr) = &senders[sender_idx];
        let pub_key_b58             = bs58::encode(pub_key_bytes).into_string();

        // Each sender uses its own timestamp sequence to avoid cross-sender collisions
        let per_sender_idx          = i / sender_count;
        let ts                      = now_ms + per_sender_idx as u64;

        let proto_tx = ProtoTransaction {
            chain_id:          chain_byte as i32,
            sender_public_key: pub_key_bytes.clone(),
            fee:               Some(ProtoAmount { asset_id: None, amount: 100_000 }),
            timestamp:         ts as i64,
            version:           3,
            transfer: Some(ProtoTransferData {
                recipient:  Some(ProtoRecipient { public_key_hash: Some(pk_hash.clone()) }),
                amount:     Some(ProtoAmount { asset_id: None, amount: 100_000 }),
                attachment: Vec::new(),
            }),
        };

        let sign_bytes = proto_tx.encode_to_vec();
        let sig_bytes  = crypto::sign(priv_key, &sign_bytes);
        let sig_b58    = bs58::encode(&sig_bytes).into_string();

        txs.push(SignedTx {
            body: json!({
                "type":            4,
                "version":         3,
                "senderPublicKey": pub_key_b58,
                "sender":          sender_addr,
                "recipient":       to,
                "amount":          100_000,
                "fee":             100_000,
                "feeAssetId":      serde_json::Value::Null,
                "assetId":         serde_json::Value::Null,
                "attachment":      "",
                "timestamp":       ts,
                "proofs":          [sig_b58],
            }),
        });
    }

    Ok(txs)
}
