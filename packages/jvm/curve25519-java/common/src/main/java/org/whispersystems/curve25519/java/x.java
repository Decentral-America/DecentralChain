package org.whispersystems.curve25519.java;

public class x {
    public static final int SCALARLEN = 32;
    public static final int POINTLEN = 32;

    public static int convert_25519_pubkey(byte[] ed_pubkey_bytes, byte[] x25519_pubkey_bytes) {
        int[] u = new int[10];
        int[] y = new int[10];

        int[] mont_x_minus_one = new int[10];
        int[] mont_x_plus_one = new int[10];
        int[] inv_mont_x_plus_one = new int[10];
        int[] one = new int[10];

  /* Convert the X25519 public key into an Ed25519 public key.

     y = (u - 1) / (u + 1)

     NOTE: u=-1 is converted to y=0 since fe_invert is mod-exp
  */

// todo       if (!fe_isreduced(x25519_pubkey_bytes))
//            return -1;

        fe_frombytes.fe_frombytes(u, x25519_pubkey_bytes);
        fe_1.fe_1(one);
        fe_sub.fe_sub(mont_x_minus_one, u, one);
        fe_add.fe_add(mont_x_plus_one, u, one);
        fe_invert.fe_invert(inv_mont_x_plus_one, mont_x_plus_one);
        fe_mul.fe_mul(y, mont_x_minus_one, inv_mont_x_plus_one);
        fe_tobytes.fe_tobytes(ed_pubkey_bytes, y);
        return 0;
    }

    // todo find the same
    public static int calculate_25519_keypair(byte[] K_bytes, byte[] k_scalar,
                                              byte[] x25519_privkey_scalar) {
        byte[] kneg = new byte[SCALARLEN];
        ge_p3 ed_pubkey_point = new ge_p3(); /* Ed25519 pubkey point */

        /* Convert the Curve25519 privkey to an Ed25519 public key */
        ge_scalarmult_base.ge_scalarmult_base(ed_pubkey_point, x25519_privkey_scalar);
        ge_p3_tobytes.ge_p3_tobytes(K_bytes, ed_pubkey_point);

        /* Force Edwards sign bit to zero */
        byte sign_bit = (byte) (K_bytes[31] & 0x80);
//       todo is the same? sign_bit = (K_bytes[31] & 0x80) >> 7;
        System.arraycopy(x25519_privkey_scalar, 0, k_scalar, 0, 32);
        sc_neg.sc_neg(kneg, k_scalar);
        sc_cmov.sc_cmov(k_scalar, kneg, sign_bit);
        K_bytes[31] &= 0x7F;

        Arrays.fill(kneg, (byte) 0);
        return 0;
    }

    public static int generalized_xeddsa_25519_sign(byte[] signature_out,
                                                    byte[] x25519_privkey_scalar,
                                                    byte[] msg, int msg_len,
                                                    byte[] random,
                                                    byte[] customization_label,
                                                    int customization_label_len) {
        byte[] K_bytes = new byte[POINTLEN];
        byte[] k_scalar = new byte[SCALARLEN];
        int retval = -1;

        if (calculate_25519_keypair(K_bytes, k_scalar, x25519_privkey_scalar) != 0)
            return -1;

        retval = veddsa.generalized_veddsa_25519_sign(signature_out,
                K_bytes, k_scalar,
                msg, msg_len, random,
                customization_label, customization_label_len);

        Arrays.fill(k_scalar, (byte)0);
        return retval;
    }

    public static int generalized_xveddsa_25519_sign(
            byte[] signature_out,
            byte[] x25519_privkey_scalar,
            byte[] msg,
            int msg_len,
            byte[] random,
            byte[] customization_label,
            int customization_label_len) {
        byte[] K_bytes = new byte[POINTLEN];
        byte[] k_scalar = new byte[SCALARLEN];
        int retval = -1;

        if (calculate_25519_keypair(K_bytes, k_scalar, x25519_privkey_scalar) != 0)
            return -1;

        retval = veddsa.generalized_veddsa_25519_sign(signature_out, K_bytes, k_scalar,
                msg, msg_len, random,
                customization_label, customization_label_len);
        Arrays.fill(k_scalar, (byte) 0);
        return retval;
    }

    public static int generalized_xveddsa_25519_verify(
            byte[] vrf_out,
            byte[] signature,
            byte[] x25519_pubkey_bytes,
            byte[] msg,
            int msg_len,
            byte[] customization_label,
            int customization_label_len) {
        byte[] K_bytes = new byte[POINTLEN];

        if (convert_25519_pubkey(K_bytes, x25519_pubkey_bytes) != 0)
            return -1;

        return veddsa.generalized_veddsa_25519_verify(vrf_out, signature, K_bytes, msg, msg_len,
                customization_label, customization_label_len);
    }

}
