import { ml_kem768_x25519 } from '@noble/post-quantum/hybrid.js';

/**
 * Generates a hybrid ML-KEM-768 + X25519 keypair for post-quantum key agreement.
 *
 * Implements the XWing hybrid KEM construction:
 *   draft-connolly-cfrg-xwing-kem-09 (XWing)
 *   draft-irtf-cfrg-hybrid-kems-07 (IETF CFRG Hybrid KEMs)
 *   FIPS-203 (ML-KEM, Aug 2024) + RFC 7748 (X25519)
 *
 * Security level: NIST Category 3 (~AES-192 equivalent).
 * Post-quantum secure against Shor's algorithm on fault-tolerant quantum computers.
 * Classical security preserved by X25519 component.
 *
 * Key sizes:
 *   publicKey:  1216 bytes (32 X25519 + 1184 ML-KEM-768)
 *   secretKey:    32 bytes (compact seed — X25519 + ML-KEM-768 keys derived during decapsulation)
 *
 * NIST IR 8547 prohibits classical-only ECDH after 2035 (ASD after 2030).
 * Use this keypair with hybridEncapsulate() / hybridDecapsulate() for quantum-
 * resistant E2E message encryption. See DCC-PQ epic for wallet integration.
 *
 * @note @noble/post-quantum v0.6.0 has undergone self-audit (Mar 2026) but has
 *       not yet received an independent third-party audit. Plan for re-audit
 *       when available. noble-ciphers and noble-hashes are independently audited.
 *
 * @param seed - Optional 32-byte seed for deterministic keypair generation.
 *               If omitted, crypto.getRandomValues() is used (recommended).
 * @returns { publicKey: Uint8Array (1216B), secretKey: Uint8Array (32B compact seed) }
 */
export function createHybridKeypair(seed?: Uint8Array): {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
} {
  return ml_kem768_x25519.keygen(seed);
}
