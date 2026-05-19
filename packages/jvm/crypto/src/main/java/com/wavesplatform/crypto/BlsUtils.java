package com.wavesplatform.crypto;

import supranational.blst.*;

import java.nio.charset.StandardCharsets;

public class BlsUtils {
    private static final String DST = "BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_NUL_";
    private static final byte[] BLS_KEYGEN_SALT = "BLS-SIG-KEYGEN-SALT-".getBytes(StandardCharsets.UTF_8);

    public static SecretKey mkBlsSecretKey(byte[] seed) {
        SecretKey sk = new SecretKey();
        sk.keygen_v5(seed, BLS_KEYGEN_SALT);
        return sk;
    }

    public static byte[] mkBlsPublicKey(SecretKey sk) {
        return new P1(sk).compress();
    }

    public static byte[] sign(SecretKey sk, byte[] message) {
        return new P2()
                .hash_to(message, DST)
                .sign_with(sk)
                .compress();
    }

    public static boolean verify(byte[] sigBytes, byte[] message, byte[] pkBytes) {
        P2_Affine sig = new P2_Affine(sigBytes);
        P1_Affine pk  = new P1_Affine(pkBytes);

        Pairing ctx = new Pairing(true, DST);
        ctx.aggregate(pk, sig, message);
        ctx.commit();
        return ctx.finalverify();
    }
}