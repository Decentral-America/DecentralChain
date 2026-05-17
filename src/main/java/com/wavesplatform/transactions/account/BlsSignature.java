package com.wavesplatform.transactions.account;

import com.wavesplatform.transactions.common.Base58String;

import java.util.Arrays;

public class BlsSignature extends Base58String {
    public static final int BYTES_LENGTH = 96;
    public BlsSignature(byte[] blsSignature) throws IllegalArgumentException {
        super(blsSignature);
        if (blsSignature.length != BYTES_LENGTH )
            throw new IllegalArgumentException("BLSPublic key has wrong size in bytes. "
                    + "Expected: " + BYTES_LENGTH + ", actual: " + blsSignature.length);
    }

    public BlsSignature(String blsSignature) {
        super(blsSignature);
        Base58String bls = new Base58String(blsSignature);

        if ( bls.bytes().length != BYTES_LENGTH)
            throw new IllegalArgumentException("BlsSignature key has wrong size in bytes. "
                    + "Expected: " + BYTES_LENGTH + ", actual: " +  bls.bytes().length);
    }

    public static BlsSignature as(byte[] bytes) {
        return new BlsSignature(bytes);
    }

    public static BlsSignature as(String base58Encoded) {
        return new BlsSignature(base58Encoded);
    }

    public boolean equals(byte[] anotherKey) {
        return Arrays.equals(this.bytes, anotherKey);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BlsSignature blsSig = (BlsSignature) o;
        return Arrays.equals(bytes, blsSig.bytes);
    }
}
