use ed25519_axolotl::utils::extras::{curve25519_sign, curve25519_sign_open};
use ed25519_compact::x25519;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn create_private_key(hashed_seed: &[u8]) -> Box<[u8]> {
    let mut private_key = [0u8; 32];
    private_key.copy_from_slice(hashed_seed);
    private_key[0] &= 248;
    private_key[31] &= 127;
    private_key[31] |= 64;

    x25519::SecretKey::new(private_key)
        .to_vec()
        .into_boxed_slice()
}

#[wasm_bindgen]
pub fn create_public_key(private_key: &[u8]) -> Box<[u8]> {
    let sk = x25519::SecretKey::from_slice(private_key).unwrap();

    sk.recover_public_key().unwrap().to_vec().into_boxed_slice()
}

#[wasm_bindgen]
pub fn create_shared_key(private_key: &[u8], public_key: &[u8]) -> Box<[u8]> {
    let sk = x25519::SecretKey::from_slice(private_key).unwrap();
    let pk = x25519::PublicKey::from_slice(public_key).unwrap();

    pk.dh(&sk).unwrap().to_vec().into_boxed_slice()
}

#[wasm_bindgen]
pub fn md5(input: &[u8]) -> Box<[u8]> {
    let mut ctx = md5_rs::Context::new();
    ctx.read(input);
    ctx.finish().to_vec().into_boxed_slice()
}

#[wasm_bindgen]
pub fn sign_bytes(private_key: Vec<u8>, message: Vec<u8>, random: Vec<u8>) -> Vec<u8> {
    let mut m = vec![0; 128 + message.len()];

    curve25519_sign(
        &mut m,
        message.into_iter().map(|n| n as u32).collect(),
        private_key.into_iter().map(|n| n as u32).collect(),
        random.into_iter().map(|n| n as u32).collect(),
    );

    m[..64]
        .to_owned()
        .into_iter()
        .map(|n| n as u8)
        .collect::<Vec<u8>>()
}

#[wasm_bindgen]
pub fn verify_signature(public_key: Vec<u8>, message: Vec<u8>, signature: Vec<u8>) -> bool {
    let mut sm: Vec<u32> = vec![0; 64 + message.len()];
    let mut m: Vec<u32> = vec![0; 64 + message.len()];

    for i in 0..64 {
        sm[i] = signature[i] as u32;
    }

    for i in 0..message.len() {
        sm[64 + i] = message[i] as u32
    }

    curve25519_sign_open(
        &mut m,
        &mut sm,
        public_key.into_iter().map(|n| n as u32).collect(),
    ) >= 0
}
