package org.whispersystems.curve25519.java;

public class fe_isnonzero {

//CONVERT #include "fe.h"
//CONVERT #include "crypto_verify_32.crypto_verify_32.h"

static final byte[] zero = new byte[32];

/**
 * Checks that f is not zero const time
 * Preconditions:
 * |f| bounded by 1.1*2^26,1.1*2^25,1.1*2^26,1.1*2^25,etc.
 * @param f
 * @return 0 if f == 0, any value between 1 and 255 if f != 0
 */
public static int fe_isnonzero(int[] f)
{
  byte[] s = new byte[32];
  fe_tobytes.fe_tobytes(s,f);
  return crypto_verify_32.crypto_verify_32(s,zero);
}


}
