/**
 * Copyright (C) 2014-2016 Open Whisper Systems
 * <p>
 * Licensed according to the LICENSE file in this repository.
 */

package org.whispersystems.curve25519;

/**
 * A tuple that contains a Curve25519 public and private key.
 *
 * @author Moxie Marlinspike
 */
public class Curve25519KeyPair {

    private final byte[] publicKey;
    private final byte[] privateKey;

    Curve25519KeyPair(byte[] publicKey, byte[] privateKey) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }

    /**
     * Returns a defensive copy of the Curve25519 public key.
     * Callers cannot mutate the internal key material through the returned array.
     *
     * @return A copy of the Curve25519 public key.
     */
    public byte[] getPublicKey() {
        return java.util.Arrays.copyOf(publicKey, publicKey.length);
    }

    /**
     * Returns a defensive copy of the Curve25519 private key.
     * Callers cannot mutate the internal key material through the returned array.
     * Callers are responsible for zeroing the returned copy when done.
     *
     * @return A copy of the Curve25519 private key.
     */
    public byte[] getPrivateKey() {
        return java.util.Arrays.copyOf(privateKey, privateKey.length);
    }
}
