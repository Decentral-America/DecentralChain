package com.decentralchain.groth16.bls12;

public class Groth16 {
    public static native boolean verify(byte[] vk, byte[] proof, byte[] inputs);

    static {
        com.decentralchain.groth16.Groth16JNILibrary.init();
    }
}
