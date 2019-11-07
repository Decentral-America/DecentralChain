package im.mak.waves.crypto.account;

import im.mak.waves.crypto.ChainId;
import im.mak.waves.crypto.base.Base58;
import org.whispersystems.curve25519.Curve25519;
import org.whispersystems.curve25519.java.curve_sigs;

import java.util.Arrays;

/**
 * Public key is used as sender of transactions and orders.
 */
@SuppressWarnings({"WeakerAccess", "unused"})
public class PublicKey {

    public static final int LENGTH = 32;
    public static final int SIGNATURE_LENGTH = 64;

    /**
     * Generate public key from the private key.
     *
     * @param privateKey public key
     * @return public key instance
     */
    public static PublicKey from(PrivateKey privateKey) {
        return new PublicKey(privateKey);
    }

    /**
     * Create public key instance from its base58 representation.
     *
     * @param encodedPublicKey public key bytes as base58
     * @return public key instance
     * @throws IllegalArgumentException if base58 arg is null
     */
    public static PublicKey as(Base58 encodedPublicKey) throws IllegalArgumentException {
        return new PublicKey(encodedPublicKey);
    }

    /**
     * Create public key instance from its base58 representation.
     *
     * @param base58Encoded public key bytes as base58-encoded string
     * @return public key instance
     * @throws IllegalArgumentException if base58 string is null
     */
    public static PublicKey as(String base58Encoded) throws IllegalArgumentException {
        return new PublicKey(base58Encoded);
    }

    /**
     * Create public key instance from its bytes.
     *
     * @param bytes public key bytes
     * @return public key instance
     * @throws IllegalArgumentException if the length of the byte array is different than expected
     */
    public static PublicKey as(byte[] bytes) throws IllegalArgumentException {
        return new PublicKey(bytes);
    }

    private static final Curve25519 cipher = Curve25519.getInstance(Curve25519.BEST);

    private final byte[] bytes;
    private String encoded;

    /**
     * Generate public key from the private key.
     *
     * @param privateKey public key
     */
    public PublicKey(PrivateKey privateKey) {
        this.bytes = new byte[LENGTH];
        curve_sigs.curve25519_keygen(this.bytes, privateKey.bytes());
    }

    /**
     * Create public key instance from its base58 representation.
     *
     * @param encodedPublicKey public key bytes as base58
     * @throws IllegalArgumentException if base58 arg is null
     */
    public PublicKey(Base58 encodedPublicKey) throws IllegalArgumentException {
        this(encodedPublicKey.decoded());
    }

    /**
     * Create public key instance from its base58 representation.
     *
     * @param base58Encoded public key bytes as base58-encoded string
     * @throws IllegalArgumentException if base58 string is null
     */
    public PublicKey(String base58Encoded) throws IllegalArgumentException {
        this(Base58.decode(base58Encoded));
    }

    /**
     * Create public key instance from its bytes.
     *
     * @param publicKeyBytes public key bytes
     * @throws IllegalArgumentException if the length of the byte array is different than expected
     */
    public PublicKey(byte[] publicKeyBytes) throws IllegalArgumentException {
        if (publicKeyBytes.length != LENGTH) throw new IllegalArgumentException("Public key has wrong size in bytes. "
                + "Expected: " + LENGTH + ", actual: " + publicKeyBytes.length);
        this.bytes = publicKeyBytes.clone();
    }

    /**
     * Get bytes of the public key.
     *
     * @return bytes of the public key
     */
    public byte[] bytes() {
        return this.bytes.clone();
    }

    /**
     * Get the public key encoded to base58.
     *
     * @return the base58-encoded public key
     */
    public Base58 base58() {
        return new Base58(this.bytes);
    }

    /**
     * Get an address generated from the public key.
     * Depends on the Id of a particular blockchain network.
     *
     * @param chainId blockchain network Id.
     * @return address
     * @see ChainId
     */
    public Address address(byte chainId) {
        return Address.from(this, chainId);
    }

    /**
     * Check if the message is actually signed by the private key of this public key.
     *
     * @param message message bytes
     * @param signature signature to validate
     * @return true if the signature is valid
     * @throws IllegalArgumentException if signature length is different from expected
     */
    public boolean isSignatureValid(byte[] message, byte[] signature) throws IllegalArgumentException {
        if (signature.length != SIGNATURE_LENGTH)
            throw new IllegalArgumentException("Signature has wrong size in bytes. "
                    + "Expected: " + SIGNATURE_LENGTH + ", actual: " + signature.length);
        return cipher.verifySignature(bytes, message, signature);
    }

    public boolean equals(byte[] anotherKey) {
        return Arrays.equals(this.bytes, anotherKey);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PublicKey publicKey = (PublicKey) o;
        return Arrays.equals(bytes, publicKey.bytes);
    }

    @Override
    public int hashCode() {
        return Arrays.hashCode(bytes);
    }

    @Override
    public String toString() {
        if (this.encoded == null) this.encoded = Base58.encode(bytes);
        return this.encoded;
    }

}
