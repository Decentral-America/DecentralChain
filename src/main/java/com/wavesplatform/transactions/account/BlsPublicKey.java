package com.wavesplatform.transactions.account;

import com.wavesplatform.transactions.common.Base58String;

import java.util.Arrays;

public class BlsPublicKey extends Base58String {

    public static final int BYTES_LENGTH = 48;
    public BlsPublicKey(byte[] blsPublicKey) throws IllegalArgumentException {
        super(blsPublicKey);
        if (blsPublicKey.length != BYTES_LENGTH )
            throw new IllegalArgumentException("BLSPublic key has wrong size in bytes. "
                    + "Expected: " + BYTES_LENGTH + ", actual: " + blsPublicKey.length);
    }

    public BlsPublicKey(String blsPublicKey) {
        super(blsPublicKey);
        Base58String bls = new Base58String(blsPublicKey);

        if ( bls.bytes().length != BYTES_LENGTH)
            throw new IllegalArgumentException("BLSPublic key has wrong size in bytes. "
                    + "Expected: " + BYTES_LENGTH + ", actual: " +  bls.bytes().length);
    }

    public static BlsPublicKey as(byte[] bytes) {
        return new BlsPublicKey(bytes);
    }

    public static BlsPublicKey as(String base58Encoded) {
        return new BlsPublicKey(base58Encoded);
    }

    public boolean equals(byte[] anotherKey) {
        return Arrays.equals(this.bytes, anotherKey);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BlsPublicKey bls = (BlsPublicKey) o;
        return Arrays.equals(bytes, bls.bytes);
    }
}
