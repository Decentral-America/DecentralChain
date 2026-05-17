package supranational.blst;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

/**
 * Smoke-tests for the blst-java JNI bindings.
 *
 * These tests verify that:
 *   1. The JNI native library loads correctly on the current platform.
 *   2. Key generation, public key derivation, and BLS signing produce
 *      non-null, correctly-sized serialized output.
 *   3. A full sign-then-verify round-trip succeeds without exceptions.
 *
 * The test vectors are minimal — the cryptographic correctness of blst is
 * validated by the upstream supranational/blst test suite. These tests
 * guard integration: that the JNI glue, native library packaging, and
 * class-loader extraction all work correctly end-to-end.
 */
class BlstSmokeTest {

    private static final String DST = "BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_";
    private static final byte[] MSG = "Hello DCC".getBytes();

    /**
     * Secret key material — 32 bytes of deterministic test input.
     * NOT a real key; used only for deterministic unit-test output.
     */
    private static final byte[] IKM = new byte[]{
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10,
        0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
        0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F, 0x20
    };

    @Test
    void nativeLibraryLoads() {
        // If the JNI library failed to load the static initializer in blstJNI
        // would have thrown; reaching this line confirms successful loading.
        assertDoesNotThrow(() -> new SecretKey());
    }

    @Test
    void secretKeyGeneration() {
        SecretKey sk = new SecretKey();
        sk.keygen(IKM);

        // SecretKey uses to_bendian() for serialization (big-endian scalar)
        byte[] skBytes = sk.to_bendian();
        assertThat(skBytes).isNotNull().hasSize(32);
    }

    @Test
    void publicKeyDerivation() {
        SecretKey sk = new SecretKey();
        sk.keygen(IKM);

        P1 pk = new P1(sk);
        byte[] pkBytes = pk.compress();

        // Compressed G1 point = 48 bytes
        assertThat(pkBytes).isNotNull().hasSize(48);
    }

    @Test
    void signatureGeneration() {
        SecretKey sk = new SecretKey();
        sk.keygen(IKM);

        byte[] sig = new P2().hash_to(MSG, DST, null).sign_with(sk).compress();

        // Compressed G2 point = 96 bytes
        assertThat(sig).isNotNull().hasSize(96);
    }

    @Test
    void signVerifyRoundTrip() {
        SecretKey sk = new SecretKey();
        sk.keygen(IKM);

        P1 pkPoint = new P1(sk);
        byte[] pkForWire = pkPoint.compress();

        byte[] sigForWire = new P2().hash_to(MSG, DST, pkForWire)
                                    .sign_with(sk)
                                    .compress();

        // Deserialize and verify
        P2_Affine sig = new P2_Affine(sigForWire);
        P1_Affine pk  = new P1_Affine(pkForWire);

        assertThat(pk.in_group()).isTrue();

        Pairing ctx = new Pairing(true, DST);
        BLST_ERROR err = ctx.aggregate(pk, sig, MSG, pkForWire);
        assertThat(err).isEqualTo(BLST_ERROR.BLST_SUCCESS);

        ctx.commit();
        assertThat(ctx.finalverify()).isTrue();
    }

    @Test
    void pointSerializeDeserializeRoundTrip() {
        SecretKey sk = new SecretKey();
        sk.keygen(IKM);

        P1 pk = new P1(sk);
        byte[] compressed = pk.compress();

        P1_Affine restored = new P1_Affine(compressed);
        assertThat(restored.in_group()).isTrue();
        assertThat(restored.is_inf()).isFalse();
    }
}
