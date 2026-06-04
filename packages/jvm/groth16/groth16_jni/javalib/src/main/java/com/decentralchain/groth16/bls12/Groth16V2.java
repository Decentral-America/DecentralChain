package com.decentralchain.groth16.bls12;

/**
 * Modern BLS12-381 Groth16 verifier backed by fastcrypto-zkp (Mysten Labs, audited).
 * Activated at BlockchainFeature(28, "Modern Groth16 verifier").
 *
 * <p>Wire format: arkworks compressed serialization — the native output of snarkjs
 * and circom tooling. This differs from the legacy Groth16.verify() format (bellman-0.1).
 *
 * <p>Security audit: fastcrypto-zkp was independently audited by Common Prefix.
 * See packages/jvm/groth16/groth16_fastcrypto/Cargo.toml for the audit reference.
 *
 * <p>JNI symbol: Java_com_decentralchain_groth16_bls12_Groth16V2_verify
 */
public class Groth16V2 {
    public static native boolean verify(byte[] vk, byte[] proof, byte[] inputs);

    static {
        com.decentralchain.groth16.Groth16JNILibrary.init();
    }
}
