package com.decentralchain.groth16;

public class Groth16JNILibrary {
    static {
        // Our layout: "META-INF/native/${platform}/${arch}/${library[-version]}"
        new JNILibrary("zwaves_jni", Groth16JNILibrary.class).load();
    }

    public static void init() {}
}
