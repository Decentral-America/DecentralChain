use std::mem;
use std::panic;

use jni::{
    objects::JClass,
    sys::{jboolean, jbyteArray},
    JNIEnv,
};

pub mod bls12;
pub mod bn256;

// ── Panic safety ──────────────────────────────────────────────────────────────
//
// Every JNI entry point is wrapped in std::panic::catch_unwind.
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
pub extern "system" fn Java_com_decentralchain_groth16_bls12_Groth16V2_verify(
    env: JNIEnv,
    _class: JClass,
    jvk: jbyteArray,
    jproof: jbyteArray,
    jinputs: jbyteArray,
) -> jboolean {
    let vk     = parse_jni_bytes(&env, jvk);
    let proof  = parse_jni_bytes(&env, jproof);
    let inputs = parse_jni_bytes(&env, jinputs);

    panic::catch_unwind(|| {
        groth16_fastcrypto::verify_bls12(&vk, &proof, &inputs).unwrap_or(false) as jboolean
    })
    .unwrap_or(0)
}

#[no_mangle]
pub extern "system" fn Java_com_decentralchain_groth16_bls12_Groth16_verify(
    env: JNIEnv,
    _class: JClass,
    jvk: jbyteArray,
    jproof: jbyteArray,
    jinputs: jbyteArray,
) -> jboolean {
    let vk    = parse_jni_bytes(&env, jvk);
    let proof = parse_jni_bytes(&env, jproof);
    let inputs = parse_jni_bytes(&env, jinputs);

    panic::catch_unwind(|| {
        bls12::groth16_verify(&vk, &proof, &inputs).unwrap_or(0u8)
    })
    .unwrap_or(0)
}

#[no_mangle]
pub extern "system" fn Java_com_decentralchain_groth16_bn256_Groth16_verify(
    env: JNIEnv,
    _class: JClass,
    jvk: jbyteArray,
    jproof: jbyteArray,
    jinputs: jbyteArray,
) -> jboolean {
    let vk    = parse_jni_bytes(&env, jvk);
    let proof = parse_jni_bytes(&env, jproof);
    let inputs = parse_jni_bytes(&env, jinputs);

    panic::catch_unwind(|| {
        bn256::groth16_verify(&vk, &proof, &inputs).unwrap_or(0u8)
    })
    .unwrap_or(0)
}

fn parse_jni_bytes(env: &JNIEnv, jv: jbyteArray) -> Vec<u8> {
    let v_len = env.get_array_length(jv).unwrap() as usize;
    let mut v = vec![0i8; v_len];
    env.get_byte_array_region(jv, 0, &mut v[..]).unwrap();

    unsafe {
        let ptr = v.as_mut_ptr();
        let len = v.len();
        let cap = v.capacity();
        mem::forget(v);
        Vec::from_raw_parts(ptr as *mut u8, len, cap)
    }
}
