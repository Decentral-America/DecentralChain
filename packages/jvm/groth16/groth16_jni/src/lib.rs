use std::panic;

use jni::{
    errors::ThrowRuntimeExAndDefault,
    objects::{JByteArray, JClass},
    sys::jboolean,
    Env, EnvUnowned,
};

pub mod bls12;
pub mod bn256;

// ── Panic safety ──────────────────────────────────────────────────────────────
//
// Every JNI entry point runs inside `EnvUnowned::with_env` (jni >= 0.22), which
// wraps the closure in std::panic::catch_unwind and maps any JNI error (e.g. a
// null array argument) to a `java.lang.RuntimeException` via
// `ThrowRuntimeExAndDefault` instead of aborting the JVM. The verifier call
// itself is additionally wrapped in its own catch_unwind so that a panic while
// verifying (e.g. arithmetic overflow on a malformed proof) still maps to
// `false` (reject) exactly as before, rather than to an exception.
//
// Unwinding a Rust panic across an FFI boundary into the JVM is Undefined
// Behaviour. catch_unwind intercepts the panic on the Rust side and returns
// false/0 to Java; the node logs a JNI error and stays alive. Without this,
// a panic (e.g. arithmetic overflow on a malformed proof) would abort() the
// entire JVM process — killing a running blockchain node.
//
// The workspace Cargo.toml sets panic = 'unwind' so the unwinding machinery is
// compiled in. catch_unwind only catches panics; genuine bugs should still be
// visible via the false return value (the node's verify logic will reject the tx).

// ── Feature-28 modern verifier (fastcrypto-zkp backed, arkworks wire format) ──
//
// Java class: com.decentralchain.groth16.bls12.Groth16V2
// Activated at BlockchainFeature(28, "Modern Groth16 verifier").
// Wire format: arkworks compressed serialization (native snarkjs/circom output).
// See groth16_fastcrypto/src/lib.rs for the full format specification.
#[no_mangle]
pub extern "system" fn Java_com_decentralchain_groth16_bls12_Groth16V2_verify<'local>(
    env: EnvUnowned<'local>,
    _class: JClass<'local>,
    jvk: JByteArray<'local>,
    jproof: JByteArray<'local>,
    jinputs: JByteArray<'local>,
) -> jboolean {
    verify_jni(env, &jvk, &jproof, &jinputs, |vk, proof, inputs| {
        groth16_fastcrypto::verify_bls12(vk, proof, inputs).unwrap_or(false)
    })
}

#[no_mangle]
pub extern "system" fn Java_com_decentralchain_groth16_bls12_Groth16_verify<'local>(
    env: EnvUnowned<'local>,
    _class: JClass<'local>,
    jvk: JByteArray<'local>,
    jproof: JByteArray<'local>,
    jinputs: JByteArray<'local>,
) -> jboolean {
    verify_jni(env, &jvk, &jproof, &jinputs, |vk, proof, inputs| {
        bls12::groth16_verify(vk, proof, inputs).unwrap_or(0u8) != 0
    })
}

#[no_mangle]
pub extern "system" fn Java_com_decentralchain_groth16_bn256_Groth16_verify<'local>(
    env: EnvUnowned<'local>,
    _class: JClass<'local>,
    jvk: JByteArray<'local>,
    jproof: JByteArray<'local>,
    jinputs: JByteArray<'local>,
) -> jboolean {
    verify_jni(env, &jvk, &jproof, &jinputs, |vk, proof, inputs| {
        bn256::groth16_verify(vk, proof, inputs).unwrap_or(0u8) != 0
    })
}

/// Copies the three Java byte arrays into Rust and runs `verify` on them.
///
/// - JNI failures while reading the arrays (null argument, concurrent resize)
///   surface to Java as a `RuntimeException` (previously an `unwrap()` panic
///   inside an `extern "system"` fn, which aborts the whole JVM).
/// - A panic inside `verify` is caught and reported as `false` (proof
///   rejected), preserving the historical verifier semantics.
fn verify_jni<'local>(
    mut env: EnvUnowned<'local>,
    jvk: &JByteArray<'local>,
    jproof: &JByteArray<'local>,
    jinputs: &JByteArray<'local>,
    verify: fn(&[u8], &[u8], &[u8]) -> bool,
) -> jboolean {
    env.with_env(|env: &mut Env<'local>| -> jni::errors::Result<jboolean> {
        let vk = env.convert_byte_array(jvk)?;
        let proof = env.convert_byte_array(jproof)?;
        let inputs = env.convert_byte_array(jinputs)?;

        Ok(panic::catch_unwind(|| verify(&vk, &proof, &inputs)).unwrap_or(false))
    })
    .resolve::<ThrowRuntimeExAndDefault>()
}
