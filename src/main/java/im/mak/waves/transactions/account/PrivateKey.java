package im.mak.waves.transactions.account;

import im.mak.waves.crypto.Hash;
import im.mak.waves.crypto.base.Base58;
import org.whispersystems.curve25519.Curve25519;

import java.util.Arrays;

/**
 * Private key is used to sign any data.
 */
@SuppressWarnings({"WeakerAccess", "unused"})
public class PrivateKey {

    public static final int LENGTH = 32;

    /**
     * Generate private key from the seed.
     *
     * @param seed seed instance
     * @return private key instance
     */
    public static im.mak.waves.transactions.account.PrivateKey from(Seed seed) {
        return new im.mak.waves.transactions.account.PrivateKey(seed);
    }

    /**
     * Create private key instance from its base58 representation.
     *
     * @param base58Encoded private key bytes as base58
     * @return private key instance
     * @throws IllegalArgumentException if base58 string is null
     */
    public static im.mak.waves.transactions.account.PrivateKey as(String base58Encoded) throws IllegalArgumentException {
        return new im.mak.waves.transactions.account.PrivateKey(base58Encoded);
    }

    /**
     * Create private key instance from its bytes.
     *
     * @param bytes private key bytes
     * @return private key instance
     * @throws IllegalArgumentException if the length of the byte array is different than expected
     */
    public static im.mak.waves.transactions.account.PrivateKey as(byte[] bytes) throws IllegalArgumentException {
        return new im.mak.waves.transactions.account.PrivateKey(bytes);
    }

    private static final Curve25519 cipher = Curve25519.getInstance(Curve25519.BEST);

    private final byte[] bytes;
    private String encoded;
    private PublicKey publicKey;

    /**
     * Generate private key from the seed.
     *
     * @param seed seed instance
     */
    public PrivateKey(Seed seed) {
        // account seed from seed & nonce
        byte[] accountSeed = Hash.secureHash(seed.bytesWithNonce());

        // private key from account seed
        byte[] hashedSeed = Hash.sha256(accountSeed);
        this.bytes = Arrays.copyOf(hashedSeed, LENGTH);
        this.bytes[0] &= 248;
        this.bytes[31] &= 127;
        this.bytes[31] |= 64;
    }

    /**
     * Create private key instance from its base58 representation.
     *
     * @param base58Encoded private key bytes as base58-encoded string
     * @throws IllegalArgumentException if base58 string is null
     */
    public PrivateKey(String base58Encoded) throws IllegalArgumentException {
        this(Base58.decode(base58Encoded));
    }

    /**
     * Create private key instance from its bytes.
     *
     * @param privateKeyBytes private key bytes
     * @throws IllegalArgumentException if the length of the byte array is different than expected
     */
    public PrivateKey(byte[] privateKeyBytes) throws IllegalArgumentException {
        if (privateKeyBytes.length != LENGTH) throw new IllegalArgumentException("Private key has wrong size in bytes. "
                + "Expected: " + LENGTH + ", actual: " + privateKeyBytes.length);
        this.bytes = privateKeyBytes.clone();
    }

    /**
     * Get bytes of the private key.
     *
     * @return bytes of the private key
     */
    public byte[] bytes() {
        return this.bytes.clone();
    }

    /**
     * Get a public key generated from the private key.
     *
     * @return generated public key
     */
    public PublicKey publicKey() {
        if (this.publicKey == null) this.publicKey = PublicKey.from(this);
        return this.publicKey;
    }

    /**
     * Get an address generated from the public key of this private key.
     * Depends on the Id of a particular blockchain network.
     *
     * @param chainId blockchain network Id.
     * @return address
     * @see ChainId
     */
    public Address address(byte chainId) {
        return this.publicKey().address(chainId);
    }

    /**
     * Sign the message with the private key.
     *
     * @param message message bytes
     * @return signature
     */
    public byte[] sign(byte[] message) {
        return cipher.calculateSignature(this.bytes, message);
    }

    /**
     * Check if the message is actually signed by the private key.
     *
     * @param message message bytes
     * @param signature signature to validate
     * @return true if the signature is valid
     * @throws IllegalArgumentException if signature length is different from expected
     */
    public boolean isSignatureValid(byte[] message, byte[] signature) throws IllegalArgumentException {
        return this.publicKey().isSignatureValid(message, signature);
    }

    public boolean equals(byte[] anotherKey) {
        return Arrays.equals(this.bytes, anotherKey);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        im.mak.waves.transactions.account.PrivateKey that = (im.mak.waves.transactions.account.PrivateKey) o;
        return Arrays.equals(bytes, that.bytes);
    }

    @Override
    public int hashCode() {
        return Arrays.hashCode(bytes);
    }

    /**
     * Get the private key encoded to base58.
     *
     * @return the base58-encoded private key
     */
    @Override
    public String toString() {
        if (this.encoded == null) this.encoded = Base58.encode(bytes);
        return this.encoded;
    }

}
