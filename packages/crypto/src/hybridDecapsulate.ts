import { ml_kem768_x25519 } from '@noble/post-quantum/hybrid.js';

/**
 * Decapsulates a 32-byte shared secret using the recipient's hybrid secret key.
 *
 * This is the RECIPIENT-side operation of the XWing hybrid KEM.
 *
 * Given the KEM cipherText produced by hybridEncapsulate(), the recipient
 * recovers the identical 32-byte sharedSecret. Use it with decryptMessage()
 * to decrypt the accompanying message.
 *
 * Implements XWing (draft-connolly-cfrg-xwing-kem-09), FIPS-203 + RFC 7748.
 *
 * WARNING (from noble): This function does NOT throw on incorrect cipherText.
 * If cipherText was encapsulated to a different public key, decapsulate() will
 * silently return a DIFFERENT shared secret — decryption will then fail at the
 * Poly1305 authentication step in decryptMessage(). This is expected KEM behavior.
 * Never use the sharedSecret without Poly1305 or AEAD authentication.
 *
 * @param cipherText - 1120-byte KEM ciphertext from hybridEncapsulate()
 * @param secretKey  - 32-byte compact XWing seed from createHybridKeypair().
 *                     XWing encodes the secretKey as a 32-byte seed from which
 *                     both the ML-KEM-768 and X25519 private keys are re-derived
 *                     during decapsulation (draft-connolly-cfrg-xwing-kem-09 §3).
 *                     NOT the concatenated 2432-byte expanded form.
 * @returns 32-byte shared secret (identical to sender's hybridEncapsulate sharedSecret
 *          when cipherText was correctly encapsulated to this secretKey's public key)
 */
export function hybridDecapsulate(cipherText: Uint8Array, secretKey: Uint8Array): Uint8Array {
  return ml_kem768_x25519.decapsulate(cipherText, secretKey);
}
