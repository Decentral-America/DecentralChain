import { ml_kem768_x25519 } from '@noble/post-quantum/hybrid.js';

/**
 * Encapsulates a 32-byte shared secret to a recipient's hybrid public key.
 *
 * This is the SENDER-side operation of the XWing hybrid KEM.
 *
 * Protocol:
 *   1. Recipient generates a keypair: createHybridKeypair() → { publicKey, secretKey }
 *   2. Recipient shares their publicKey with the sender.
 *   3. Sender calls hybridEncapsulate(recipientPublicKey) → { cipherText, sharedSecret }
 *   4. Sender uses sharedSecret with encryptMessage() to encrypt their message.
 *   5. Sender transmits: cipherText (1120 bytes) prepended to the encrypted message.
 *   6. Recipient calls hybridDecapsulate(cipherText, secretKey) → same sharedSecret.
 *   7. Recipient decrypts with decryptMessage(sharedSecret, payload).
 *
 * Implements XWing (draft-connolly-cfrg-xwing-kem-09), FIPS-203 + RFC 7748.
 *
 * Unlike X25519 DH, KEM is asymmetric: the sender generates ephemeral keys and
 * the cipherText MUST be transmitted to the recipient. The sharedSecret is never
 * transmitted. The cipherText cannot be used to recover the sharedSecret without
 * the recipient's secretKey.
 *
 * WARNING (from noble): Unlike ECDH, decapsulate() does NOT throw on wrong
 * cipherText — it returns a different shared secret. Authenticate messages
 * with the Poly1305 tag in encryptMessage() / decryptMessage().
 *
 * @param recipientPublicKey - 1216-byte hybrid public key from createHybridKeypair()
 * @returns {
 *   cipherText:   Uint8Array (1120 bytes) — transmit to recipient
 *   sharedSecret: Uint8Array (32 bytes)  — derive encryption key from this
 * }
 */
export function hybridEncapsulate(recipientPublicKey: Uint8Array): {
  cipherText: Uint8Array;
  sharedSecret: Uint8Array;
} {
  return ml_kem768_x25519.encapsulate(recipientPublicKey);
}
