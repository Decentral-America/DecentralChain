package im.mak.waves.crypto.rsa;

import im.mak.waves.crypto.base.Base58;
import org.bouncycastle.jce.provider.BouncyCastleProvider;

import java.security.*;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;
import java.util.Arrays;
import java.util.Objects;

/**
 * RSA public key to encrypt data or verify that data is actually signed by the private key of the public key.
 *
 * RSA signatures are supported in Ride language.
 */
@SuppressWarnings("WeakerAccess")
public class RsaPublicKey {

    /**
     * Get public key from the known RSA key pair.
     *
     * @param keyPair known RSA key pair
     * @return RSA public key
     */
    public static RsaPublicKey from(RsaKeyPair keyPair) {
        return new RsaPublicKey(keyPair);
    }

    /**
     * Create the public key from its bytes.
     *
     * @param publicKeyBytes bytes of the public key
     * @return RSA public key
     */
    public static RsaPublicKey from(byte[] publicKeyBytes) {
        return new RsaPublicKey(publicKeyBytes);
    }

    private final BouncyCastleProvider bcp;
    private final PublicKey key;

    /**
     * Get public key from the known RSA key pair.
     *
     * @param keyPair known RSA key pair
     */
    public RsaPublicKey(RsaKeyPair keyPair) {
        this(keyPair.publicKey());
    }

    /**
     * Create the public key from its bytes.
     *
     * @param publicKeyBytes bytes of the public key
     */
    public RsaPublicKey(byte[] publicKeyBytes) {
        this.bcp = new BouncyCastleProvider();
        X509EncodedKeySpec ks = new X509EncodedKeySpec(publicKeyBytes);
        try {
            KeyFactory kf = KeyFactory.getInstance("RSA");
            this.key = kf.generatePublic(ks);
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Get bytes of the public key.
     *
     * @return bytes of the public key
     */
    public byte[] bytes() {
        return this.key.getEncoded();
    }

    /**
     * Check if the message is actually signed by the RSA private key of the public key
     * with the specified hashing algorithm.
     *
     * @param alg hashing algorithm
     * @param message message bytes
     * @param signature signature to validate
     * @return true if the signature is valid
     * @see HashAlg
     */
    public boolean isSignatureValid(HashAlg alg, byte[] message, byte[] signature) {
        try {
            Signature sig = Signature.getInstance(alg.value() + "withRSA", bcp);
            sig.initVerify(this.key);
            sig.update(message);
            return sig.verify(signature);
        } catch (NoSuchAlgorithmException | InvalidKeyException | SignatureException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RsaPublicKey publicKey = (RsaPublicKey) o;
        return Arrays.equals(key.getEncoded(), publicKey.key.getEncoded());
    }

    @Override
    public int hashCode() {
        return Objects.hash(key);
    }

    @Override
    public String toString() {
        return Base58.encode(this.bytes());
    }

}
