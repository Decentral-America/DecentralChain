package im.mak.waves.crypto.account;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.base.Base58;
import im.mak.waves.crypto.ChainId;

import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Objects;

/**
 * Seed is a set of bytes that private and public keys are deterministically generated from.
 */
@SuppressWarnings({"unused", "WeakerAccess"})
public class Seed {

    /**
     * Create instance from seed phrase.
     *
     * @param encodedPhrase base58-encoded seed phrase for keys generation
     * @return Seed instance
     * @throws IllegalArgumentException if phrase is null
     */
    public static Seed from(Base58 encodedPhrase) throws IllegalArgumentException {
        return new Seed(encodedPhrase);
    }

    /**
     * Create instance from seed phrase and nonce.
     *
     * @param encodedPhrase base58-encoded seed phrase for keys generation
     * @param nonce number addition to the phrase. Default is 0 (zero)
     * @return Seed instance
     * @throws IllegalArgumentException if phrase is null
     */
    public static Seed from(Base58 encodedPhrase, int nonce) throws IllegalArgumentException {
        return new Seed(encodedPhrase, nonce);
    }

    /**
     * Create instance from seed phrase.
     *
     * @param phrase seed phrase for keys generation
     * @return Seed instance
     * @throws IllegalArgumentException if phrase string is null
     */
    public static Seed from(String phrase) throws IllegalArgumentException {
        return new Seed(phrase);
    }

    /**
     * Create instance from seed phrase and nonce.
     *
     * @param phrase seed phrase for keys generation
     * @param nonce number addition to the phrase. Default is 0 (zero)
     * @return Seed instance
     * @throws IllegalArgumentException if phrase string is null
     */
    public static Seed from(String phrase, int nonce) throws IllegalArgumentException {
        return new Seed(phrase, nonce);
    }

    /**
     * Create instance from bytes of seed phrase.
     *
     * @param phraseBytes bytes of seed phrase for keys generation
     * @return Seed instance
     */
    public static Seed from(byte[] phraseBytes) {
        return new Seed(phraseBytes);
    }

    /**
     * Create instance from bytes of seed phrase and nonce.
     *
     * @param phraseBytes bytes of seed phrase for keys generation
     * @param nonce number addition to the phrase. Default is 0 (zero)
     * @return Seed instance
     */
    public static Seed from(byte[] phraseBytes, int nonce) {
        return new Seed(phraseBytes, nonce);
    }

    /**
     * Create instance from random readable seed phrase.
     *
     * @return Seed instance
     */
    public static Seed random() {
        return random(0);
    }

    /**
     * Create instance from random readable seed phrase and nonce.
     *
     * @param nonce number addition to the phrase. Default is 0 (zero)
     * @return Seed instance
     */
    public static Seed random(int nonce) {
        return randomBytes(nonce);
    }

    /**
     * Create instance from bytes of random seed phrase.
     *
     * @return Seed instance
     */
    public static Seed randomBytes() {
        return randomBytes(0);
    }

    /**
     * Create instance from bytes of random seed phrase and nonce.
     *
     * @param nonce number addition to the phrase. Default is 0 (zero)
     * @return Seed instance
     */
    public static Seed randomBytes(int nonce) {
        byte[] bytes = new byte[120];
        try {
            SecureRandom.getInstanceStrong().nextBytes(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to get random number generator", e);
        }
        return Seed.from(bytes, 0);
    }

    private final byte[] bytes;
    private final int nonce;
    private String encoded;
    private PrivateKey privateKey;

    /**
     * Create instance from seed phrase.
     *
     * @param phrase seed phrase for keys generation
     * @throws IllegalArgumentException if phrase string is null
     */
    public Seed(String phrase) throws IllegalArgumentException {
        this(phrase, 0);
    }

    /**
     * Create instance from seed phrase and nonce.
     *
     * @param phrase seed phrase for keys generation
     * @param nonce number addition to the phrase. Default is 0 (zero)
     * @throws IllegalArgumentException if phrase string is null
     */
    public Seed(String phrase, int nonce) throws IllegalArgumentException {
        this(Bytes.fromUtf8(phrase), nonce);
    }

    /**
     * Create instance from seed phrase.
     *
     * @param encodedPhrase base58-encoded seed phrase for keys generation
     * @throws IllegalArgumentException if phrase is null
     */
    public Seed(Base58 encodedPhrase) throws IllegalArgumentException {
        this(encodedPhrase, 0);
    }

    /**
     * Create instance from seed phrase and nonce.
     *
     * @param encodedPhrase base58-encoded seed phrase for keys generation
     * @param nonce number addition to the phrase. Default is 0 (zero)
     * @throws IllegalArgumentException if phrase is null
     */
    public Seed(Base58 encodedPhrase, int nonce) throws IllegalArgumentException {
        this(encodedPhrase.decoded(), nonce);
    }

    /**
     * Create instance from bytes of seed phrase.
     *
     * @param phraseBytes bytes of seed phrase for keys generation
     */
    public Seed(byte[] phraseBytes) {
        this(phraseBytes, 0);
    }

    /**
     * Create instance from bytes of seed phrase and nonce.
     *
     * @param phraseBytes bytes of seed phrase for keys generation
     * @param nonce number addition to the phrase. Default is 0 (zero)
     */
    public Seed(byte[] phraseBytes, int nonce) {
        this.bytes = phraseBytes.clone();
        this.nonce = nonce;
    }

    /**
     * Get bytes of the seed phrase.
     *
     * @return bytes of the seed phrase
     */
    public byte[] bytes() {
        return bytes.clone();
    }

    /**
     * Get nonce of the seed instance.
     *
     * @return nonce of the seed
     */
    public int nonce() {
        return nonce;
    }

    /**
     * Get bytes of nonce and phrase of the seed instance.
     *
     * @return bytes of nonce and phrase of the seed
     */
    public byte[] bytesWithNonce() {
        return Bytes.concat(Bytes.fromInt(nonce()), bytes());
    }

    /**
     * Get the seed phrase as UTF-8 string.
     *
     * @return seed phrase as UTF-8 string
     */
    public String phrase() {
        return Bytes.toUtf8(bytes);
    }

    /**
     * Get the seed phrase encoded to base58.
     *
     * @return the base58-encoded seed phrase
     */
    public Base58 base58() {
        return new Base58(this.bytes);
    }

    /**
     * Get a private key generated from the seed.
     *
     * @return private key from the seed
     */
    public PrivateKey privateKey() {
        if (this.privateKey == null) this.privateKey = PrivateKey.from(this);
        return this.privateKey;
    }

    /**
     * Get a public key generated from the private key of this seed.
     *
     * @return generated public key
     */
    public PublicKey publicKey() {
        return this.privateKey().publicKey();
    }

    /**
     * Get an address generated from the public key of this seed.
     * Depends on the Id of a particular blockchain network.
     *
     * @param chainId blockchain network Id.
     * @return address
     * @see ChainId
     */
    public Address address(byte chainId) {
        return this.privateKey().address(chainId);
    }

    /**
     * Sign the message with the private key of the seed.
     *
     * @param message message bytes
     * @return signature
     */
    public byte[] sign(byte[] message) {
        return this.privateKey().sign(message);
    }

    /**
     * Check if the message is actually signed by the private key of this seed.
     *
     * @param message message bytes
     * @param signature signature to validate
     * @return true if the signature is valid
     */
    public boolean isSignatureValid(byte[] message, byte[] signature) throws IllegalArgumentException {
        return this.publicKey().isSignatureValid(message, signature);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Seed seed = (Seed) o;
        return nonce == seed.nonce &&
                Arrays.equals(bytes, seed.bytes);
    }

    @Override
    public int hashCode() {
        int result = Objects.hash(nonce);
        result = 31 * result + Arrays.hashCode(bytes);
        return result;
    }

    @Override
    public String toString() {
        if (this.encoded == null) this.encoded = Base58.encode(bytes);
        return this.encoded;
    }

}
