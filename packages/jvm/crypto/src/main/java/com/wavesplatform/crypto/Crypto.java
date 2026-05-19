package com.wavesplatform.crypto;

import com.wavesplatform.crypto.internal.Dictionary;
import org.whispersystems.curve25519.Curve25519;
import org.whispersystems.curve25519.java.curve_sigs;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Arrays;

public abstract class Crypto {

    private static final Curve25519 cipher = Curve25519.getInstance(Curve25519.BEST);

    /**
     * Generates random seed phrase.
     *
     * @param wordsNumber seed length in number of words
     * @return String random seed phrase
     */
    public static String getRandomSeedPhrase(int wordsNumber) {
        int dictSize = Dictionary.BIP39_ENGLISH.length;
        String[] seedPhrase = new String[wordsNumber];
        try {
            SecureRandom random = SecureRandom.getInstanceStrong();
            for (int i = 0; i < wordsNumber; i++)
                seedPhrase[i] = Dictionary.BIP39_ENGLISH[random.nextInt(dictSize)];
            return String.join(" ", seedPhrase);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Failed to get random number generator", e);
        }
    }

    /**
     * Generates random 15-word seed phrase.
     *
     * @return String random seed phrase
     */
    public static String getRandomSeedPhrase() {
        return getRandomSeedPhrase(15);
    }

    /**
     * Generates random seed phrase.
     *
     * @param length length of seed bytes
     * @return byte[] random seed bytes
     */
    public static byte[] getRandomSeedBytes(int length) {
        byte[] bytes = new byte[length];
        try {
            SecureRandom.getInstanceStrong().nextBytes(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Failed to get random number generator", e);
        }
        return bytes;
    }

    /**
     * Generates random seed bytes.
     *
     * @return byte[] random seed bytes
     */
    public static byte[] getRandomSeedBytes() {
        return getRandomSeedBytes(255);
    }

    public static byte[] getAccountSeed(byte[] seedPhrase, int nonce) {
        return Hash.secureHash(Bytes.concat(Bytes.fromInt(nonce), seedPhrase));
    }

    public static byte[] getAccountSeed(byte[] seedPhrase) {
        return getAccountSeed(seedPhrase, 0);
    }

    public static byte[] getAccountSeed(String seedPhrase, int nonce) {
        return getAccountSeed(seedPhrase.getBytes(StandardCharsets.UTF_8), nonce);
    }

    public static byte[] getAccountSeed(String seedPhrase) {
        return getAccountSeed(seedPhrase.getBytes(StandardCharsets.UTF_8));
    }

    public static byte[] getPrivateKey(byte[] accountSeed) {
        byte[] hashedAccountSeed = Hash.sha256(accountSeed);

        byte[] privateKey = Arrays.copyOf(hashedAccountSeed, 32);
        privateKey[0] &= 248;
        privateKey[31] &= 127;
        privateKey[31] |= 64;

        return privateKey;
    }

    public static byte[] getPublicKey(byte[] privateKey) {
        byte[] bytes = new byte[32];
        curve_sigs.curve25519_keygen(bytes, privateKey);
        return bytes;
    }

    public static byte[] getPublicKeyHash(byte[] publicKey) {
        return Arrays.copyOfRange(Hash.secureHash(publicKey), 0, 20);
    }

    public static byte[] getAddressChecksum(byte chainId, byte[] publicKeyHash) {
        byte[] hash = Hash.secureHash(Bytes.concat(Bytes.of((byte) 1, chainId), publicKeyHash));
        return Bytes.take(hash, 4);
    }

    public static byte[] getAddress(byte chainId, byte[] publicKeyHash) {
        ByteBuffer buf = ByteBuffer.allocate(26);
        buf.put((byte) 1)
                .put(chainId)
                .put(publicKeyHash)
                .put(getAddressChecksum(chainId, publicKeyHash));
        return buf.array();
    }

    public static byte[] sign(byte[] privateKey, byte[] message) {
        return cipher.calculateSignature(privateKey, message);
    }

    /**
     * Check if the message is actually signed by the private key of this public key.
     *
     * @param publicKey public key bytes
     * @param message message bytes
     * @param signature signature to validate
     * @return true if the proof is valid
     */
    public static boolean isProofValid(byte[] publicKey, byte[] message, byte[] signature) {
        return cipher.verifySignature(publicKey, message, signature);
    }

}
