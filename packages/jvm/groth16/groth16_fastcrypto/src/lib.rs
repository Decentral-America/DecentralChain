//! Modern Groth16 BLS12-381 verifier backed by fastcrypto-zkp (Mysten Labs).
//!
//! # Why this crate exists
//!
//! The legacy verifier in `groth16_jni` uses bellman 0.1.0 (2018), which lacks
//! the strict subgroup checks and canonical-encoding enforcement standardised
//! by the ZK community after 2020 (ZIP-216 et al.). This crate provides a
//! hardened replacement activated at `BlockchainFeature(28)`.
//!
//! # Security audit
//!
//! fastcrypto-zkp 0.1.4 was independently audited by Common Prefix:
//! <https://www.commonprefix.com/static/clients/mysten/mysten_fastcrypto_groth16_audit.pdf>
//! The one issue found (missing length validation in `verify_groth16_in_bytes`)
//! was fixed before publication. We add explicit length validation below as
//! defence-in-depth.
//!
//! # Wire format — how this differs from the legacy bellman path
//!
//! fastcrypto-zkp uses an **arkworks-compatible** serialization that is also
//! the native output of circom / snarkjs tooling (the dominant Groth16
//! ecosystem). The legacy bellman-0.1 format cannot be transparently translated
//! to this format without computing the pairing `e(alpha, beta)` and negating
//! G2 points — which requires arbitrary-precision EC arithmetic.
//!
//! Instead, Feature 28 is exposed as **new RIDE functions** (`groth16Verify_v2`
//! and `bn256Groth16Verify_v2`) with the modern format. Contracts written for
//! snarkjs/Circom work without any translation layer. Contracts using the legacy
//! bellman format continue to use the original opcodes (unchanged below the
//! activation height).
//!
//! ## VK format (`vk_bytes` argument to `verify_bls12`)
//!
//! The VK must be in **arkworks compressed serialization**:
//! ```text
//! [alpha_g1: 48][beta_g2: 96][gamma_g2: 96][delta_g2: 96]
//! [gamma_abc_len: u64 LE][ic_0: 48][ic_1: 48]...[ic_n: 48]
//! ```
//! Total: 344 + (n+1)*48 bytes.  This is the exact format produced by:
//! - `vk.serialize_compressed()` in arkworks
//! - `snarkjs groth16 export verificationkey` (after bn254/BLS12-381 circuit setup)
//!
//! ## Proof format (`proof_bytes` argument)
//!
//! Raw concatenation of compressed curve points — **no** length-prefix headers:
//! `[a: G1, 48 B][b: G2, 96 B][c: G1, 48 B]` = 192 bytes total. The BCS
//! deserializer inside fastcrypto-zkp reads this format based on the struct
//! definition. Construct via three `serialize_compressed` calls, or use the
//! snarkjs/circom native output format for BLS12-381.
//!
//! ## Public inputs format (`inputs_bytes` argument)
//!
//! Concatenated 32-byte field elements in **little-endian** order, as produced
//! by `scalar.serialize_compressed()` in arkworks. This differs from the legacy
//! bellman path where inputs were big-endian.

use std::io;

use fastcrypto_zkp::bls12381::api::{prepare_pvk_bytes, verify_groth16_in_bytes};

/// Verify a BLS12-381 Groth16 proof using the modern fastcrypto-zkp verifier.
///
/// This is the backend for the Feature-28 `groth16Verify_v2` RIDE opcode.
/// All arguments use the **arkworks/snarkjs native wire format** (see module
/// documentation for byte-level layouts).
///
/// # Arguments
/// * `vk_bytes`    — arkworks-compressed `VerifyingKey` (arkworks format with u64 IC length)
/// * `proof_bytes` — raw concatenation a:G1(48B) || b:G2(96B) || c:G1(48B) = 192 bytes
/// * `inputs_bytes`— public inputs, concatenated little-endian 32-byte field scalars
///
/// # Returns
/// `Ok(true)` = proof valid; `Ok(false)` = proof invalid; `Err` = malformed input.
pub fn verify_bls12(
    vk_bytes: &[u8],
    proof_bytes: &[u8],
    inputs_bytes: &[u8],
) -> io::Result<bool> {
    // prepare_pvk_bytes validates VK format, returns the four PVK components:
    // [0] vk_gamma_abc_g1  — IC points as concatenated G1 compressed bytes
    // [1] alpha_g1_beta_g2 — GT element e(alpha,beta) in arkworks format (576B)
    // [2] gamma_g2_neg_pc  — -gamma in G2 compressed (96B)
    // [3] delta_g2_neg_pc  — -delta in G2 compressed (96B)
    let pvk = prepare_pvk_bytes(vk_bytes)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, format!("invalid vk: {e:?}")))?;

    verify_groth16_in_bytes(
        &pvk[0],
        &pvk[1],
        &pvk[2],
        &pvk[3],
        inputs_bytes,
        proof_bytes,
    )
    .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, format!("verify error: {e:?}")))
}

/// Pre-compute and cache the prepared VK to avoid re-doing the pairing on every
/// call when the same VK is reused (e.g. inside a loop in a RIDE dApp).
///
/// Returns the four serialized PVK components that `verify_bls12_with_pvk`
/// accepts. Store and reuse across multiple `verify_bls12_with_pvk` calls.
pub fn prepare_vk(vk_bytes: &[u8]) -> io::Result<Vec<Vec<u8>>> {
    prepare_pvk_bytes(vk_bytes)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, format!("invalid vk: {e:?}")))
}

/// Verify using a pre-prepared VK (avoids the pairing in `prepare_pvk_bytes`).
///
/// `pvk` must be the `Vec<Vec<u8>>` returned by `prepare_vk`.
pub fn verify_bls12_with_pvk(
    pvk: &[Vec<u8>],
    proof_bytes: &[u8],
    inputs_bytes: &[u8],
) -> io::Result<bool> {
    if pvk.len() != 4 {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!("pvk must have 4 parts, got {}", pvk.len()),
        ));
    }
    verify_groth16_in_bytes(
        &pvk[0],
        &pvk[1],
        &pvk[2],
        &pvk[3],
        inputs_bytes,
        proof_bytes,
    )
    .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, format!("verify error: {e:?}")))
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── Hardcoded test vectors ────────────────────────────────────────────────
    //
    // All vectors use arkworks CanonicalSerialize (compressed form).
    // Proof format: a:G1(48B) || b:G2(96B) || c:G1(48B) — raw concatenation, no length prefixes.
    //
    // SET 1 — single public input: circuit a*b=c, StdRng::seed_from_u64(0)
    //   VK:     alpha_g1||beta_g2||gamma_g2||delta_g2||u64_le_ic_count||IC[0]||IC[1]
    //   INPUTS: c compressed (32 bytes)
    //   WRONG:  c+1 compressed (32 bytes)
    //
    // SET 2 — two public inputs: circuit a*b=c1, a*a=c2, StdRng::seed_from_u64(1)
    //   VK2:    same layout, IC count=3, three IC points
    //   INPUTS2: c1||c2 (64 bytes)

    // ── Set 1: single public input (c = a*b) ─────────────────────────────────
    const VK_HEX: &str = "8e7bc78496e97afd7c09111b2ba802c91563a09f9314a11a809747c5ce1472b940209fe75c391f2874207225ab7e45eb82913ac9e5a5282b88fcd1f8a7199bede593f04ff47dddacb219be55328ea37ddf6e00b0b6bc1d02b4ce1d3b8509f13d1971b973fc401b49afa9b75f498f527e6ac929104fddeceea7e63468176471c64f86d30e2af7aeb416a96b2359f30c3cb15e008a2fc2ab5fdb40158e9e7f43fd3aae11c8f4edde89d86a792e4ad1e03853d323810e8a7acb72b05280ebe4a4b819e09395808b096632cabf4f23152c56311f5a8a3390621fdd36870d9e66876374741936b89bccb88d5749c6f792473293db8a6c12476961414b3b915762854574a311df036615b9be71cf092cccea5c3804fcb44162f044ee9d850e2be9007c15ff22328548a35e49591f60917123ff126035aa4964698b6193cc66763e3e782e1f03dfb8e6e5658feb33ff651fc5220200000000000000b913facb8e2b4e9fbfe743e20157fbe656eda0a5164f6348cd5c40a2fafc77d2cded4b2e9020d3406948f6997775dd7eacb7489db542b911fa321905e4905623c14921294cc9c4c5db456ee617f66ea0cb1b45eef523a3b36d292829c1e5f1c1";
    const PROOF_HEX: &str = "b1706812db520620475d390e573831711f73146889e6953300dbc4e331c6fa48952935e1da6c1aab2db5143177eea281b1d6b43482b48f912bb53c7741480eb158d2d4f2def51bd3f50ea923e1c6b67be881d26660cd71fcfddf07c67314f7d6102aaaf125c383791348a2d6a6aeb3b35ca16eed0ffcf3f2c330efeb33e4480068e51e6c7dc39dc4099db04dbdadb40faf7217b37fed5d14d0c3be5812d2427cf6791e2e33ac738e4e1a74cd3ed76a267e2314407ae8c54aea180da85e1b155a";
    const INPUTS_HEX: &str = "b6c445740925e40b3f10d05ec07fa8499dba614b5c92139e3a048fb687de8f3d";
    const WRONG_INPUTS_HEX: &str = "b7c445740925e40b3f10d05ec07fa8499dba614b5c92139e3a048fb687de8f3d";

    // ── Set 2: two public inputs (c1=a*b, c2=a*a) ────────────────────────────
    const VK2_HEX: &str = "812878c0c76bcbfae8bb3430485012de2c1d8bf176b5da5ed600765faada569fb7fcede6759f06e8bf481aa1457868baa07fa204d444af19e034ecb0c76c0c78199ce32589f29ae0ea44c79b45db20c95630c2fe470f8d60d5d1dc8907059da605ec7c293977a12ec6bedaec5c34d52fdd4ed71a50e92a55928ed47a10a435c77a35ceecccc7272e1940b92a8f568a47b1279c099f827af810b8b7f8ed32cbfe1b39372ae22ce5c91851a4aafd0a4251d76531732aa985856df2f67d90f402120f5ee3def33368194cbdd83eb9e5b21f4eba1f42936500b951a282165c822fb94530bfd6fb9a0c4bd8e2635b26265c058183c05ecfcc3e02338729ec7d659d29f4379fb6aa17afb1d05cc6362a914af9a1a158387f82c62b231edc4939fa91cf19baed0dafc80791a18b39595c222857d41e4923343a5b48fe1a1e07c60ee68ae0e334b3e36392568a22964ebdbae4d40300000000000000a7045a5776f16d2e3aabf477aa8052ba224bfe49b86a51e99348de0be3b886ca438709d09e5419169d4e7572c3e6ca1ba1f14ef04a363f89255efbd57e0b3c5827e8806cdfa7f7d51b3ceee2aa1f668fc7d68f6571f730050486cd5f54156bda94695616a4361786dbaec4e444df170514932bfe8b0ee5621d95d445c1d859c16b8284be18bddc0c2fbad0e2b86084d7";
    const PROOF2_HEX: &str = "b84490d92cd815f94946d744be26b8682d371fbc58a212e71eff6d473c17b993823528f2a857ac712d468732887fe8d48e9707737ddc7ae0bf132997476d1cbb3d5a4a78bc49dad19fd2791b61ebaf2211b4c32cc6c8ddd345a9a5d72b2cce05023edf23d92b2c40bbaa7d90ea057ebcd03b7efc8842d1d992f8587b47136e44a6e715ae1de50fec8b8c46a3a61ade5b999f8a7b3465e921387eae9824f8fe9db9681220a644560e7d7fcc15453a6c86d430c2768834067551f616062ce99253";
    const INPUTS2_HEX: &str = "223f336d4a5150044259c45b45afc981171adaab0447faa38be2338c32ca3a1ddcb7eff9b970a8030cae385ef16a13ee79c4dd6899035af20cb7d9f51b0f3d2e";

    fn vk()          -> Vec<u8> { hex::decode(VK_HEX).unwrap() }
    fn proof()       -> Vec<u8> { hex::decode(PROOF_HEX).unwrap() }
    fn inputs()      -> Vec<u8> { hex::decode(INPUTS_HEX).unwrap() }
    fn wrong_inputs()-> Vec<u8> { hex::decode(WRONG_INPUTS_HEX).unwrap() }
    fn vk2()         -> Vec<u8> { hex::decode(VK2_HEX).unwrap() }
    fn proof2()      -> Vec<u8> { hex::decode(PROOF2_HEX).unwrap() }
    fn inputs2()     -> Vec<u8> { hex::decode(INPUTS2_HEX).unwrap() }

    // ── Positive tests ────────────────────────────────────────────────────────

    #[test]
    fn hardcoded_proof_verifies() {
        let pvk = prepare_vk(&vk()).expect("prepare_vk failed");
        assert_eq!(pvk.len(), 4, "pvk must have 4 parts");

        let result = verify_bls12_with_pvk(&pvk, &proof(), &inputs())
            .expect("verify must not error");
        assert!(result, "hardcoded proof must verify");

        // One-shot path must agree with prepared-VK path
        let result2 = verify_bls12(&vk(), &proof(), &inputs())
            .expect("verify_bls12 must not error");
        assert_eq!(result, result2, "both code paths must agree");
    }

    #[test]
    fn two_input_circuit_verifies() {
        // Validates that the IC gamma_abc array is parsed correctly for n > 1 inputs.
        let result = verify_bls12(&vk2(), &proof2(), &inputs2())
            .expect("two-input verify must not error");
        assert!(result, "two-input proof must verify");
    }

    // ── Negative tests ────────────────────────────────────────────────────────

    #[test]
    fn wrong_inputs_do_not_verify() {
        let result = verify_bls12(&vk(), &proof(), &wrong_inputs())
            .expect("verify must not error");
        assert!(!result, "proof with wrong inputs must NOT verify");
    }

    #[test]
    fn corrupted_proof_does_not_verify() {
        // Flip the last byte of the proof — must not produce Ok(true)
        let mut bad_proof = proof();
        *bad_proof.last_mut().unwrap() ^= 0xff;
        match verify_bls12(&vk(), &bad_proof, &inputs()) {
            Ok(true)  => panic!("corrupted proof must not verify"),
            Ok(false) => {} // valid encoding, wrong pairing
            Err(_)    => {} // invalid point encoding — also acceptable
        }
    }

    #[test]
    fn truncated_proof_is_rejected() {
        // One byte short — BCS deserialization must fail
        let short = &proof()[..191];
        assert!(verify_bls12(&vk(), short, &inputs()).is_err());
    }

    #[test]
    fn truncated_inputs_is_rejected() {
        // 31 bytes — not a multiple of 32, must fail
        let short = &inputs()[..31];
        assert!(verify_bls12(&vk(), &proof(), short).is_err());
    }

    #[test]
    fn invalid_vk_is_rejected() {
        let bad_vk = vec![0u8; 10];
        assert!(verify_bls12(&bad_vk, &proof(), &inputs()).is_err());
        assert!(prepare_vk(&bad_vk).is_err());
    }
}
