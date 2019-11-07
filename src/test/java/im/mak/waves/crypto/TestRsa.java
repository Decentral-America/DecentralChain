package im.mak.waves.crypto;

import im.mak.waves.crypto.rsa.RsaKeyPair;
import im.mak.waves.crypto.rsa.RsaPublicKey;
import org.junit.jupiter.api.Test;

import java.util.Collections;

import static im.mak.waves.crypto.rsa.HashAlg.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;

@SuppressWarnings("WeakerAccess")
class TestRsa {

    static RsaKeyPair keyPair = RsaKeyPair.random();
    static RsaKeyPair samePair = RsaKeyPair.from(keyPair.privateKey());
    static RsaKeyPair differentPair = RsaKeyPair.random();
    static RsaPublicKey publicKey = RsaPublicKey.from(keyPair);
    static RsaPublicKey samePublicKey = RsaPublicKey.from(keyPair.publicKey());
    static RsaPublicKey differentPublicKey = RsaPublicKey.from(differentPair.publicKey());

    static byte[] source245b = (String.join("", Collections.nCopies(122, "ё")) + "b").getBytes();
    static byte[] source32kb = (String.join("", Collections.nCopies(16382, "ё")) + "bbb").getBytes();

    static byte [] noalgSign = keyPair.sign(NOALG, source245b);
    static byte [] md5Sign = keyPair.sign(MD5, source32kb);
    static byte [] sha1Sign = keyPair.sign(SHA1, source32kb);
    static byte [] sha224Sign = keyPair.sign(SHA224, source32kb);
    static byte [] sha256Sign = keyPair.sign(SHA256, source32kb);
    static byte [] sha384Sign = keyPair.sign(SHA384, source32kb);
    static byte [] sha512Sign = keyPair.sign(SHA512, source32kb);
    static byte [] sha3_224Sign = keyPair.sign(SHA3_224, source32kb);
    static byte [] sha3_256Sign = keyPair.sign(SHA3_256, source32kb);
    static byte [] sha3_384Sign = keyPair.sign(SHA3_384, source32kb);
    static byte [] sha3_512Sign = keyPair.sign(SHA3_512, source32kb);

    @Test
    void keyPairs() {
        assertThat(keyPair).isEqualTo(samePair);
        assertThat(keyPair.privateKey()).isEqualTo(samePair.privateKey());
        assertThat(keyPair).isNotEqualTo(differentPair);
        assertThat(keyPair.privateKey()).isNotEqualTo(differentPair.privateKey());
    }

    @Test
    void publicKeys() {
        assertAll(
                () -> assertThat(keyPair.publicKey()).isEqualTo(RsaPublicKey.from(keyPair).bytes()),
                () -> assertThat(keyPair.publicKey()).isEqualTo(RsaPublicKey.from(keyPair.publicKey()).bytes()),
                () -> assertThat(publicKey).isEqualTo(samePublicKey),
                () -> assertThat(publicKey).isNotEqualTo(differentPublicKey)
        );
    }

    @Test
    void canCheckSignaturesByPair() {
        checkSignatures(keyPair);
    }

    @Test
    void canCheckSignaturesByPublicKey() {
        checkSignatures(publicKey);
    }

    @Test
    void canCheckSignaturesBySamePair() {
        checkSignatures(samePair);
    }

    @Test
    void canCheckSignaturesBySamePublicKey() {
        checkSignatures(samePublicKey);
    }

    @Test
    void cantCheckSignaturesByDifferentPair() {
        assertAll(
                () -> assertThat(differentPair.isSignatureValid(NOALG, source245b, noalgSign)).isFalse(),
                () -> assertThat(differentPair.isSignatureValid(MD5, source32kb, md5Sign)).isFalse(),
                () -> assertThat(differentPair.isSignatureValid(SHA1, source32kb, sha1Sign)).isFalse(),
                () -> assertThat(differentPair.isSignatureValid(SHA224, source32kb, sha224Sign)).isFalse(),
                () -> assertThat(differentPair.isSignatureValid(SHA256, source32kb, sha256Sign)).isFalse(),
                () -> assertThat(differentPair.isSignatureValid(SHA384, source32kb, sha384Sign)).isFalse(),
                () -> assertThat(differentPair.isSignatureValid(SHA512, source32kb, sha512Sign)).isFalse(),
                () -> assertThat(differentPair.isSignatureValid(SHA3_224, source32kb, sha3_224Sign)).isFalse(),
                () -> assertThat(differentPair.isSignatureValid(SHA3_256, source32kb, sha3_256Sign)).isFalse(),
                () -> assertThat(differentPair.isSignatureValid(SHA3_384, source32kb, sha3_384Sign)).isFalse(),
                () -> assertThat(differentPair.isSignatureValid(SHA3_512, source32kb, sha3_512Sign)).isFalse()
        );
    }

    @Test
    void cantCheckSignaturesByDifferentPublicKey() {
        assertAll(
                () -> assertThat(differentPublicKey.isSignatureValid(NOALG, source245b, noalgSign)).isFalse(),
                () -> assertThat(differentPublicKey.isSignatureValid(MD5, source32kb, md5Sign)).isFalse(),
                () -> assertThat(differentPublicKey.isSignatureValid(SHA1, source32kb, sha1Sign)).isFalse(),
                () -> assertThat(differentPublicKey.isSignatureValid(SHA224, source32kb, sha224Sign)).isFalse(),
                () -> assertThat(differentPublicKey.isSignatureValid(SHA256, source32kb, sha256Sign)).isFalse(),
                () -> assertThat(differentPublicKey.isSignatureValid(SHA384, source32kb, sha384Sign)).isFalse(),
                () -> assertThat(differentPublicKey.isSignatureValid(SHA512, source32kb, sha512Sign)).isFalse(),
                () -> assertThat(differentPublicKey.isSignatureValid(SHA3_224, source32kb, sha3_224Sign)).isFalse(),
                () -> assertThat(differentPublicKey.isSignatureValid(SHA3_256, source32kb, sha3_256Sign)).isFalse(),
                () -> assertThat(differentPublicKey.isSignatureValid(SHA3_384, source32kb, sha3_384Sign)).isFalse(),
                () -> assertThat(differentPublicKey.isSignatureValid(SHA3_512, source32kb, sha3_512Sign)).isFalse()
        );
    }

    private void checkSignatures(RsaKeyPair keyPair) {
        assertAll(
                () -> assertThat(keyPair.isSignatureValid(NOALG, source245b, noalgSign)).isTrue(),
                () -> assertThat(keyPair.isSignatureValid(MD5, source32kb, md5Sign)).isTrue(),
                () -> assertThat(keyPair.isSignatureValid(SHA1, source32kb, sha1Sign)).isTrue(),
                () -> assertThat(keyPair.isSignatureValid(SHA224, source32kb, sha224Sign)).isTrue(),
                () -> assertThat(keyPair.isSignatureValid(SHA256, source32kb, sha256Sign)).isTrue(),
                () -> assertThat(keyPair.isSignatureValid(SHA384, source32kb, sha384Sign)).isTrue(),
                () -> assertThat(keyPair.isSignatureValid(SHA512, source32kb, sha512Sign)).isTrue(),
                () -> assertThat(keyPair.isSignatureValid(SHA3_224, source32kb, sha3_224Sign)).isTrue(),
                () -> assertThat(keyPair.isSignatureValid(SHA3_256, source32kb, sha3_256Sign)).isTrue(),
                () -> assertThat(keyPair.isSignatureValid(SHA3_384, source32kb, sha3_384Sign)).isTrue(),
                () -> assertThat(keyPair.isSignatureValid(SHA3_512, source32kb, sha3_512Sign)).isTrue(),

                () -> assertThat(keyPair.isSignatureValid(NOALG, source245b, sha1Sign)).isFalse(),
                () -> assertThat(keyPair.isSignatureValid(MD5, source32kb, noalgSign)).isFalse(),
                () -> assertThat(keyPair.isSignatureValid(SHA1, source32kb, md5Sign)).isFalse(),
                () -> assertThat(keyPair.isSignatureValid(SHA224, source32kb, sha512Sign)).isFalse(),
                () -> assertThat(keyPair.isSignatureValid(SHA256, source32kb, sha224Sign)).isFalse(),
                () -> assertThat(keyPair.isSignatureValid(SHA384, source32kb, sha256Sign)).isFalse(),
                () -> assertThat(keyPair.isSignatureValid(SHA512, source32kb, sha384Sign)).isFalse(),
                () -> assertThat(keyPair.isSignatureValid(SHA3_224, source32kb, sha3_512Sign)).isFalse(),
                () -> assertThat(keyPair.isSignatureValid(SHA3_256, source32kb, sha3_224Sign)).isFalse(),
                () -> assertThat(keyPair.isSignatureValid(SHA3_384, source32kb, sha3_256Sign)).isFalse(),
                () -> assertThat(keyPair.isSignatureValid(SHA3_512, source32kb, sha3_384Sign)).isFalse()
        );
    }

    private void checkSignatures(RsaPublicKey publicKey) {
        assertAll(
                () -> assertThat(publicKey.isSignatureValid(NOALG, source245b, noalgSign)).isTrue(),
                () -> assertThat(publicKey.isSignatureValid(MD5, source32kb, md5Sign)).isTrue(),
                () -> assertThat(publicKey.isSignatureValid(SHA1, source32kb, sha1Sign)).isTrue(),
                () -> assertThat(publicKey.isSignatureValid(SHA224, source32kb, sha224Sign)).isTrue(),
                () -> assertThat(publicKey.isSignatureValid(SHA256, source32kb, sha256Sign)).isTrue(),
                () -> assertThat(publicKey.isSignatureValid(SHA384, source32kb, sha384Sign)).isTrue(),
                () -> assertThat(publicKey.isSignatureValid(SHA512, source32kb, sha512Sign)).isTrue(),
                () -> assertThat(publicKey.isSignatureValid(SHA3_224, source32kb, sha3_224Sign)).isTrue(),
                () -> assertThat(publicKey.isSignatureValid(SHA3_256, source32kb, sha3_256Sign)).isTrue(),
                () -> assertThat(publicKey.isSignatureValid(SHA3_384, source32kb, sha3_384Sign)).isTrue(),
                () -> assertThat(publicKey.isSignatureValid(SHA3_512, source32kb, sha3_512Sign)).isTrue(),

                () -> assertThat(publicKey.isSignatureValid(NOALG, source245b, sha1Sign)).isFalse(),
                () -> assertThat(publicKey.isSignatureValid(MD5, source32kb, noalgSign)).isFalse(),
                () -> assertThat(publicKey.isSignatureValid(SHA1, source32kb, md5Sign)).isFalse(),
                () -> assertThat(publicKey.isSignatureValid(SHA224, source32kb, sha512Sign)).isFalse(),
                () -> assertThat(publicKey.isSignatureValid(SHA256, source32kb, sha224Sign)).isFalse(),
                () -> assertThat(publicKey.isSignatureValid(SHA384, source32kb, sha256Sign)).isFalse(),
                () -> assertThat(publicKey.isSignatureValid(SHA512, source32kb, sha384Sign)).isFalse(),
                () -> assertThat(publicKey.isSignatureValid(SHA3_224, source32kb, sha3_512Sign)).isFalse(),
                () -> assertThat(publicKey.isSignatureValid(SHA3_256, source32kb, sha3_224Sign)).isFalse(),
                () -> assertThat(publicKey.isSignatureValid(SHA3_384, source32kb, sha3_256Sign)).isFalse(),
                () -> assertThat(publicKey.isSignatureValid(SHA3_512, source32kb, sha3_384Sign)).isFalse()
        );
    }

}
