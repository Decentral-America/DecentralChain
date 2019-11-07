package im.mak.waves.crypto.rsa;

import im.mak.waves.crypto.base.Base58;
import org.bouncycastle.jce.provider.BouncyCastleProvider;

import java.security.*;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.util.Arrays;
import java.util.Objects;

/**
 * Pair of RSA private and public keys to encrypt/decrypt or signing data.
 *
 * RSA signatures are supported in Ride language.
 */
@SuppressWarnings("WeakerAccess")
public class RsaKeyPair {

    /**
     * Create key pair from the known RSA private key.
     *
     * @param encodedPrivateKey base58-encoded bytes of the private key
     * @return pair of RSA private and public keys
     * @throws IllegalArgumentException if base58 is null
     */
    public static RsaKeyPair from(Base58 encodedPrivateKey) throws IllegalArgumentException {
        return new RsaKeyPair(encodedPrivateKey);
    }

    /**
     * Create key pair from the known RSA private key.
     *
     * @param privateKeyBytes bytes of the private key
     * @return pair of RSA private and public keys
     */
    public static RsaKeyPair from(byte[] privateKeyBytes) {
        return new RsaKeyPair(privateKeyBytes);
    }

    /**
     * Create pair of random RSA private and public keys.
     *
     * @return random RSA key pair
     */
    public static RsaKeyPair random() {
        return new RsaKeyPair();
    }

    private final BouncyCastleProvider bcp;
    private final PrivateKey privateKey;
    private final PublicKey publicKey;

    /**
     * Create key pair from the known RSA private key.
     *
     * @param encodedPrivateKey base58-encoded private key
     * @throws IllegalArgumentException if base58 is null
     */
    public RsaKeyPair(Base58 encodedPrivateKey) throws IllegalArgumentException {
        this(encodedPrivateKey.decoded());
    }

    /**
     * Create key pair from the known RSA private key.
     *
     * @param privateKeyBytes bytes of the private key
     */
    public RsaKeyPair(byte[] privateKeyBytes) {
        this.bcp = new BouncyCastleProvider();
        PKCS8EncodedKeySpec ks = new PKCS8EncodedKeySpec(privateKeyBytes);
        try {
            KeyFactory kf = KeyFactory.getInstance("RSA");
            this.privateKey = kf.generatePrivate(ks);
            RSAPrivateCrtKey privateCrtKey = (RSAPrivateCrtKey) this.privateKey;
            RSAPublicKeySpec publicKeySpec = new RSAPublicKeySpec(privateCrtKey.getModulus(), privateCrtKey.getPublicExponent());
            this.publicKey = kf.generatePublic(publicKeySpec);
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Create pair of random RSA private and public keys.
     */
    public RsaKeyPair() {
        this.bcp = new BouncyCastleProvider();

        KeyPairGenerator gen;
        try {
            gen = KeyPairGenerator.getInstance("RSA");
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
        gen.initialize(2048, new SecureRandom());

        KeyPair keys = gen.generateKeyPair();
        this.privateKey = keys.getPrivate();
        this.publicKey = keys.getPublic();
    }

    /**
     * Get the RSA private key.
     *
     * @return the private key
     */
    public byte[] privateKey() {
        return this.privateKey.getEncoded();
    }

    /**
     * Get the RSA public key.
     *
     * @return the public key
     */
    public byte[] publicKey() {
        return this.publicKey.getEncoded();
    }

    /**
     * Sign the message by the RSA private key with specified hashing algorithm.
     *
     * @param alg hashing algorithm
     * @param message message to sign
     * @return RSA signature
     * @see HashAlg
     */
    public byte[] sign(HashAlg alg, byte[] message) {
        try {
            Signature sig = initJSignature(alg);
            sig.initSign(this.privateKey);
            sig.update(message);
            return sig.sign();
        } catch (NoSuchAlgorithmException | InvalidKeyException | SignatureException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Check if the message is actually signed by the RSA private key with the specified hashing algorithm.
     *
     * @param alg hashing algorithm
     * @param message message bytes
     * @param signature signature to validate
     * @return true if the signature is valid
     * @see HashAlg
     */
    public boolean isSignatureValid(HashAlg alg, byte[] message, byte[] signature) {
        try {
            Signature sig = initJSignature(alg);
            sig.initVerify(this.publicKey);
            sig.update(message);
            return sig.verify(signature);
        } catch (NoSuchAlgorithmException | InvalidKeyException | SignatureException e) {
            throw new RuntimeException(e);
        }
    }

    private Signature initJSignature(HashAlg alg) throws NoSuchAlgorithmException {
        return Signature.getInstance(alg.value() + "withRSA", bcp);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RsaKeyPair keyPair = (RsaKeyPair) o;
        return Arrays.equals(this.privateKey(), keyPair.privateKey()) &&
                Arrays.equals(this.publicKey(), keyPair.publicKey());
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.privateKey(), this.publicKey());
    }

    @Override
    public String toString() {
        return "RsaKeyPair{" +
                "privateKey=" + Base58.encode(this.privateKey()) +
                ", publicKey=" + Base58.encode(this.publicKey()) +
                '}';
    }

}
