package org.whispersystems.curve25519.java;

public class crypto_verify_32 {

    /**
     * const time equality check of x and y byte arrays of length 32
     * @param x first byte array
     * @param y second byte array
     * @return 0 if equals, other value if not
     */
    public static int crypto_verify_32(byte[] x, byte[] y) {
        int differentbits = 0;
        for (int count = 0; count < 32; count++) {
            differentbits |= (x[count] ^ y[count]);
        }
        return differentbits;
    }
}
