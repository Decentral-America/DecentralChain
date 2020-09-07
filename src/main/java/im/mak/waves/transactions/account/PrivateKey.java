package im.mak.waves.transactions.account;

import com.google.common.base.Suppliers;
import im.mak.waves.crypto.Crypto;
import im.mak.waves.crypto.base.Base58;
import im.mak.waves.transactions.common.Base58String;
import im.mak.waves.transactions.WavesConfig;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.function.Supplier;

/**
 * Private key is used to sign any data.
 */
@SuppressWarnings({"WeakerAccess", "unused"})
public class PrivateKey extends Base58String {

    public static final int LENGTH = 32;

    /**
     * Generate private key from seed phrase.
     *
     * @param seedPhraseBytes seed phrase bytes
     * @return private key instance
     */
    public static PrivateKey fromSeed(byte[] seedPhraseBytes, int nonce) {
        return new PrivateKey(Crypto.getPrivateKey(Crypto.getAccountSeed(seedPhraseBytes, nonce)));
    }

    /**
     * Generate private key from seed phrase.
     *
     * @param seedPhraseBytes seed phrase bytes
     * @return private key instance
     */
    public static PrivateKey fromSeed(byte[] seedPhraseBytes) {
        return fromSeed(seedPhraseBytes, 0);
    }

    /**
     * Generate private key from seed phrase.
     *
     * @param seedPhrase seed phrase
     * @return private key instance
     */
    public static PrivateKey fromSeed(String seedPhrase, int nonce) {
        return fromSeed(seedPhrase.getBytes(StandardCharsets.UTF_8), nonce);
    }

    /**
     * Generate private key from seed phrase.
     *
     * @param seedPhrase seed phrase bytes
     * @return private key instance
     */
    public static PrivateKey fromSeed(String seedPhrase) {
        return fromSeed(seedPhrase.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Create private key instance from its base58 representation.
     *
     * @param base58Encoded private key bytes as base58
     * @return private key instance
     */
    public static PrivateKey as(String base58Encoded) {
        return new PrivateKey(base58Encoded);
    }

    /**
     * Create private key instance from its bytes.
     *
     * @param bytes private key bytes
     * @return private key instance
     */
    public static PrivateKey as(byte[] bytes) {
        return new PrivateKey(bytes);
    }

    private final Supplier<PublicKey> publicKey;

    /**
     * Create private key instance from its base58 representation.
     *
     * @param base58Encoded private key bytes as base58-encoded string
     */
    public PrivateKey(String base58Encoded) {
        this(Base58.decode(base58Encoded));
    }

    /**
     * Create private key instance from its bytes.
     *
     * @param privateKey private key bytes
     */
    public PrivateKey(byte[] privateKey) {
        super(privateKey);

        if (privateKey.length != LENGTH)
            throw new IllegalArgumentException("Private key has wrong size in bytes. "
                + "Expected: " + LENGTH + ", actual: " + privateKey.length);

        this.publicKey = Suppliers.memoize(() -> PublicKey.from(this))::get;
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
        return this.publicKey.get();
    }

    /**
     * Get an address generated from the public key of this private key.
     * Depends on the Id of a particular blockchain network.
     *
     * @param chainId blockchain network Id.
     * @return address
     */
    public Address address(byte chainId) {
        return this.publicKey().address(chainId);
    }

    /**
     * Get an address generated from the public key of this private key.
     * Depends on the Id of a particular blockchain network.
     *
     * @return address
     */
    public Address address() {
        return address(WavesConfig.chainId());
    }

    /**
     * Sign the message with the private key.
     *
     * @param message message bytes
     * @return signature
     */
    public byte[] sign(byte[] message) {
        return Crypto.sign(this.bytes, message);
    }

    /**
     * Check if the message is actually signed by the private key.
     *
     * @param message message bytes
     * @param signature signature to validate
     * @return true if the signature is valid
     */
    public boolean isSignatureValid(byte[] message, byte[] signature) {
        return this.publicKey().isSignatureValid(message, signature);
    }

    public boolean equals(byte[] anotherKey) {
        return Arrays.equals(this.bytes, anotherKey);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PrivateKey that = (PrivateKey) o;
        return Arrays.equals(bytes, that.bytes);
    }

    @Override
    public int hashCode() {
        return Arrays.hashCode(bytes);
    }

    @Override
    public String toString() {
        return encoded();
    }

}
