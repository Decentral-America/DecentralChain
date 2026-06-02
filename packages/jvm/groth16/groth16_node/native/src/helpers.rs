use lazy_static::lazy_static;
use neon::prelude::*;
use neon::types::buffer::TypedArray;
use pairing::bls12_381::{Bls12, Fr};
use pairing::{Field, PrimeField, PrimeFieldRepr};

use std::io::Cursor;

use bellman::groth16::Proof;
use groth16_circuit::circuit::Transfer;
use groth16_primitives::serialization::read_fr_repr_be;
use groth16_primitives::transactions::NoteData;
use arrayvec::ArrayVec;

use groth16_primitives::verifier;
use sapling_crypto::jubjub::JubjubBls12;

lazy_static! {
    pub static ref JUBJUB_PARAMS: JubjubBls12 = JubjubBls12::new();
}

pub fn read_obj_fr(cx: &mut FunctionContext, obj: Handle<JsObject>, key: &str) -> NeonResult<Fr> {
    let value = obj.get(cx, key)?;
    read_val_fr(cx, value)
}

pub fn read_val_fr(cx: &mut FunctionContext, val: Handle<JsValue>) -> NeonResult<Fr> {
    let buff_field = val
        .downcast::<JsBuffer, _>(cx)
        .or_else(|_| cx.throw_error("could not downcast value to Buffer"))?;
    let repr = {
        let slice = buff_field.as_slice(cx);
        read_fr_repr_be::<Fr>(slice)
    }
    .or_else(|_| cx.throw_error("Buffer must be uint256 BE number"))?;
    Fr::from_repr(repr).or_else(|_| cx.throw_error("Wrong field element"))
}

pub fn read_buf_fr(cx: &mut FunctionContext, buff_field: Handle<JsBuffer>) -> NeonResult<Fr> {
    let repr = {
        let slice = buff_field.as_slice(cx);
        read_fr_repr_be::<Fr>(slice)
    }
    .or_else(|_| cx.throw_error("Buffer must be uint256 BE number"))?;
    Fr::from_repr(repr).or_else(|_| cx.throw_error("Wrong field element"))
}

pub fn parse_note_data(cx: &mut FunctionContext, note_obj: Handle<JsObject>) -> NeonResult<NoteData<Bls12>> {
    Ok(NoteData::<Bls12> {
        asset_id: read_obj_fr(cx, note_obj, "asset_id")?,
        amount: read_obj_fr(cx, note_obj, "amount")?,
        native_amount: read_obj_fr(cx, note_obj, "native_amount")?,
        txid: read_obj_fr(cx, note_obj, "txid")?,
        owner: read_obj_fr(cx, note_obj, "owner")?,
    })
}

pub fn fr_to_js<'a>(cx: &mut FunctionContext<'a>, fr: &Fr) -> JsResult<'a, JsBuffer> {
    let mut buff = Cursor::new(Vec::<u8>::new());
    fr.into_repr().write_be(&mut buff).unwrap();
    JsBuffer::from_slice(cx, buff.get_ref())
}

pub fn proof_to_js<'a>(cx: &mut FunctionContext<'a>, proof: &Proof<Bls12>) -> JsResult<'a, JsBuffer> {
    let mut proof_cur = Cursor::new(Vec::<u8>::new());
    proof.write(&mut proof_cur).unwrap();
    JsBuffer::from_slice(cx, proof_cur.get_ref())
}

pub fn verifier_to_js<'a>(cx: &mut FunctionContext<'a>, verifier: &verifier::TruncatedVerifyingKey<Bls12>) -> JsResult<'a, JsBuffer> {
    let mut verifier_cur = Cursor::new(Vec::<u8>::new());
    verifier.write(&mut verifier_cur).unwrap();
    JsBuffer::from_slice(cx, verifier_cur.get_ref())
}

pub fn parse_pair<'a, U: Value>(cx: &mut FunctionContext<'a>, value: Handle<'a, JsValue>) -> NeonResult<[Handle<'a, U>; 2]> {
    let value = value
        .downcast::<JsArray, _>(cx)
        .or_else(|_| cx.throw_error("Could not downcast value to Array"))?
        .to_vec(cx)?;
    if value.len() != 2 {
        return cx.throw_error("in_note length should be 2");
    }

    let value = value
        .into_iter()
        .map(|item| item.downcast::<U, _>(cx).or_else(|_| cx.throw_error("downcast pair item error")))
        .collect::<NeonResult<ArrayVec<[Handle<'a, U>; 2]>>>()?;
    match value.into_inner() {
        Ok(arr) => Ok(arr),
        Err(_) => cx.throw_error("Array was not completely filled"),
    }
}
