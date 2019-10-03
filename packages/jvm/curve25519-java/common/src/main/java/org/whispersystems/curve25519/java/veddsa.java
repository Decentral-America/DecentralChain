package org.whispersystems.curve25519.java;

public class veddsa {
    final static int BLOCKLEN = 128; /* SHA512 */
    final static int HASHLEN = 64;  /* SHA512 */
    final static int POINTLEN = 32;
    final static int SCALARLEN = 32;
    final static int RANDLEN = 32;
    final static int MSTART = 2048;
    final static int MSGMAXLEN = 1048576;
    final static int BUFLEN = 1024;
    final static int VRFOUTPUTLEN = 32;

    final static byte[] B_bytes = {
            0x58, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
    };

    public static int legendre_is_nonsquare(int[] in)
    {
        int[] temp = new int[10];
        byte[] bytes = new byte[32];
        fe_pow22523.fe_pow22523(temp, in);  /* temp = in^((q-5)/8) */
        fe_sq.fe_sq(temp, temp);      /*        in^((q-5)/4) */
        fe_sq.fe_sq(temp, temp);      /*        in^((q-5)/2) */
        fe_mul.fe_mul(temp, temp, in); /*        in^((q-3)/2) */
        fe_mul.fe_mul(temp, temp, in); /*        in^((q-1)/2) */

        /* temp is now the Legendre symbol:
         * 1  = square
         * 0  = input is zero
         * -1 = nonsquare
         */
        fe_tobytes.fe_tobytes(bytes, temp);
        return 1 & bytes[31];
    }

    public static void elligator(int[] u, int[] r)
    {
        /* r = input
         * gen_x = -A/(1+2r^2)                # 2 is nonsquare
         * e = (gen_x^3 + Ax^2 + gen_x)^((q-1)/2) # legendre symbol
         * if e == 1 (square) or e == 0 (because gen_x == 0 and 2r^2 + 1 == 0)
         *   u = gen_x
         * if e == -1 (nonsquare)
         *   u = -gen_x - A
         */
        int[] A = new int[10], one = new int[10], twor2 = new int[10], twor2plus1 = new int[10], twor2plus1inv = new int[10];
        int[] x = new int[10], e = new int[10], Atemp = new int[10], uneg = new int[10];
        int nonsquare;

        fe_1.fe_1(one);
        fe_0.fe_0(A);
        A[0] = 486662;                         /* A = 486662 */

        fe_sq2.fe_sq2(twor2, r);                      /* 2r^2 */
        fe_add.fe_add(twor2plus1, twor2, one);        /* 1+2r^2 */
        fe_invert.fe_invert(twor2plus1inv, twor2plus1);  /* 1/(1+2r^2) */
        fe_mul.fe_mul(x, twor2plus1inv, A);           /* A/(1+2r^2) */
        fe_neg.fe_neg(x, x);                          /* gen_x = -A/(1+2r^2) */

        fe_mont_rhs(e, x);                     /* e = gen_x^3 + Ax^2 + gen_x */
        nonsquare = legendre_is_nonsquare(e);

        fe_0.fe_0(Atemp);
        fe_cmov.fe_cmov(Atemp, A, nonsquare);          /* 0, or A if nonsquare */
        fe_add.fe_add(u, x, Atemp);                   /* gen_x, or gen_x+A if nonsquare */
        fe_neg.fe_neg(uneg, u);                       /* -gen_x, or -gen_x-A if nonsquare */
        fe_cmov.fe_cmov(u, uneg, nonsquare);           /* gen_x, or -gen_x-A if nonsquare */
    }

    public static void fe_mont_rhs(int[] v2, int[] u) {
        int[] A = new int[10], one= new int[10];
        int[] u2= new int[10], Au= new int[10], inner= new int[10];

        fe_1.fe_1(one);
        fe_0.fe_0(A);
        A[0] = 486662;                     /* A = 486662 */

        fe_sq.fe_sq(u2, u);                      /* u^2 */
        fe_mul.fe_mul(Au, A, u);                  /* Au */
        fe_add.fe_add(inner, u2, Au);             /* u^2 + Au */
        fe_add.fe_add(inner, inner, one);         /* u^2 + Au + 1 */
        fe_mul.fe_mul(v2, u, inner);              /* u(u^2 + Au + 1) */
    }

    /* sqrt(-(A+2)) */
    private static byte[] A_bytes = {
        0x06, 0x7e, 0x45, (byte)0xff, (byte)0xaa, 0x04, 0x6e, (byte)0xcc,
            (byte)0x82, 0x1a, 0x7d, 0x4b, (byte)0xd1, (byte)0xd3, (byte)0xa1, (byte)0xc5,
                0x7e, 0x4f, (byte)0xfc, 0x03, (byte)0xdc, 0x08, 0x7b, (byte)0xd2,
            (byte)0xbb, 0x06, (byte)0xa0, 0x60, (byte)0xf4, (byte)0xed, 0x26, 0x0f
    };

    public static void ge_montx_to_p3(ge_p3 p, int[] u, byte ed_sign_bit)
    {
        int[] x = new int[10], y = new int[10], A = new int[10], v = new int[10], v2 = new int[10], iv = new int[10], nx = new int[10];

        fe_frombytes.fe_frombytes(A, A_bytes);

        /* given u, recover edwards y */
        /* given u, recover v */
        /* given u and v, recover edwards gen_x */

        fe_montx_to_edy.fe_montx_to_edy(y, u);       /* y = (u - 1) / (u + 1) */

        fe_mont_rhs(v2, u);          /* v^2 = u(u^2 + Au + 1) */
        fe_sqrt.fe_sqrt(v, v2);              /* v = sqrt(v^2) */

        fe_mul.fe_mul(x, u, A);             /* gen_x = u * sqrt(-(A+2)) */
        fe_invert.fe_invert(iv, v);            /* 1/v */
        fe_mul.fe_mul(x, x, iv);            /* gen_x = (u/v) * sqrt(-(A+2)) */

        fe_neg.fe_neg(nx, x);               /* negate gen_x to match sign bit */
        fe_cmov.fe_cmov(x, nx, fe_isnegative.fe_isnegative(x) ^ ed_sign_bit);

        fe_copy.fe_copy(p.X, x);
        fe_copy.fe_copy(p.Y, y);
        fe_1.fe_1(p.Z);
        fe_mul.fe_mul(p.T, p.X, p.Y);
    }


    private static void hash_to_point(Sha512 sha512provider, ge_p3 p, byte[] in)
    {
        byte[] hash = new byte[64];
        int[] h = new int[10], u = new int[10];
        ge_p3 p3 = new ge_p3();

        sha512provider.calculateDigest(hash, in, in.length);

        /* take the high bit as Edwards sign bit */
        byte sign_bit = (byte)((hash[31] & 0x80) >> 7);
        hash[31] &= 0x7F;
        fe_frombytes.fe_frombytes(h, hash);
        elligator(u, h);

        ge_montx_to_p3(p3, u, sign_bit);
        ge_scalarmult_cofactor.ge_scalarmult_cofactor(p, p3);
    }

    /* B: base point 
     * R: commitment (point), 
       r: private nonce (scalar)
       K: encoded public key
       k: private key (scalar)
       Z: 32-bytes random
       M: buffer containing message, message starts at M_start, continues for M_len
       r = hash(B || gen_labelset || Z || pad1 || k || pad2 || gen_labelset || K || extra || M) (mod q)
    */
    public static boolean generalized_commit(Sha512 sha512provider, byte[] R_bytes, byte[] r_scalar,
                                         byte[] labelset,
                                         byte[] extra, int extra_len,
                                         byte[] K_bytes, byte[] k_scalar,
                                         byte[] Z, byte[] msg,
                                         byte[] M_buf, int M_start, int M_len) {
        ge_p3 R_point = new ge_p3();
        byte[] hash = new byte[64];

        if (!gen_labelset.labelset_validate(labelset)) {
            return false;
        }
        if (R_bytes == null || r_scalar == null ||
                K_bytes == null || k_scalar == null ||
                Z == null) {
            return false;
        }
        if (extra == null || extra.length == 0) {
            return false;
        }
        if (gen_labelset.labelset_is_empty(labelset)) {
            return false;
        }

        int prefix_len = 0;
        prefix_len += POINTLEN + labelset.length + RANDLEN;
        int pad_len1 = ((BLOCKLEN - (prefix_len % BLOCKLEN)) % BLOCKLEN);
        prefix_len += pad_len1;
        prefix_len += SCALARLEN;
        int pad_len2 = ((BLOCKLEN - (prefix_len % BLOCKLEN)) % BLOCKLEN);
        prefix_len += pad_len2;
        prefix_len += labelset.length + POINTLEN + extra_len;
        if (prefix_len > M_start) {
            return false;
        }

        int startIndex = M_start - prefix_len;

        System.arraycopy(B_bytes, 0, M_buf, startIndex, POINTLEN);
        System.arraycopy(labelset, 0, M_buf, startIndex + POINTLEN, labelset.length);
        System.arraycopy(Z, 0, M_buf, startIndex + POINTLEN + labelset.length, RANDLEN);
        System.arraycopy(k_scalar, 0, M_buf, startIndex + POINTLEN + labelset.length + pad_len1 + RANDLEN, POINTLEN);
        System.arraycopy(labelset, 0, M_buf, startIndex + 2 * POINTLEN + labelset.length + pad_len1 + RANDLEN + pad_len2, labelset.length);
        System.arraycopy(K_bytes, 0, M_buf, startIndex + 2 * POINTLEN + 2 * labelset.length + pad_len1 + RANDLEN + pad_len2, POINTLEN);
        System.arraycopy(extra, 0, M_buf, startIndex + 3 * POINTLEN + 2 * labelset.length + pad_len1 + RANDLEN + pad_len2, extra_len);

        byte[] in = java.util.Arrays.copyOfRange(M_buf, startIndex, M_start + M_len);
        sha512provider.calculateDigest(hash, in, in.length);

        sc_reduce.sc_reduce(hash);
        ge_scalarmult_base.ge_scalarmult_base(R_point, hash);
        ge_p3_tobytes.ge_p3_tobytes(R_bytes, R_point);
        System.arraycopy(hash, 0, r_scalar, 0, SCALARLEN);
        return true;
    }



    /* if is_labelset_empty(gen_labelset):
           return hash(R || K || M) (mod q)
       else:
           return hash(B || gen_labelset || R || gen_labelset || K || extra || M) (mod q)
    */
    public static int generalized_challenge(Sha512 sha512provider, byte[] h_scalar,
                                            byte[] labelset,
                                            byte[] extra,
                                            byte[] R_bytes,
                                            byte[] K_bytes,
                                            byte[] M_buf, int M_start, int M_len) {

        byte[] hash = new byte[HASHLEN];

        if (h_scalar == null) return -1;

        if (!gen_labelset.labelset_validate(labelset)) return -1;
        if (R_bytes == null || K_bytes == null) return -1;
        if (extra != null && gen_labelset.labelset_is_empty(labelset)) return -1;

        int prefix_len;

        if (gen_labelset.labelset_is_empty(labelset)) {
            if (2 * POINTLEN > MSTART) return -1;
            prefix_len = 2 * POINTLEN;
            int startIndex = M_start - prefix_len;
            System.arraycopy(R_bytes, 0, M_buf, startIndex, POINTLEN);
            System.arraycopy(K_bytes, 0, M_buf, startIndex + POINTLEN, POINTLEN);
        } else {
            prefix_len = 3 * POINTLEN + 2 * labelset.length + extra.length;
            int startIndex = M_start - prefix_len;
            System.arraycopy(B_bytes, 0, M_buf, startIndex, POINTLEN);
            System.arraycopy(labelset, 0, M_buf, startIndex + POINTLEN, labelset.length);
            System.arraycopy(R_bytes, 0, M_buf, startIndex + POINTLEN + labelset.length, POINTLEN);
            System.arraycopy(labelset, 0, M_buf, startIndex + 2 * POINTLEN + labelset.length, labelset.length);
            System.arraycopy(K_bytes, 0, M_buf, startIndex + 2 * POINTLEN + 2 * labelset.length, POINTLEN);
            System.arraycopy(extra, 0, M_buf, startIndex + 3 * POINTLEN + 2 * labelset.length, extra.length);
        }

        byte[] in = java.util.Arrays.copyOfRange(M_buf, M_start - prefix_len, M_start + M_len);
        sha512provider.calculateDigest(hash, in, in.length);
        sc_reduce.sc_reduce(hash);
        System.arraycopy(hash, 0, h_scalar, 0, SCALARLEN);
        return 0;
    }

    /* return r + kh (mod q) */
    public static int generalized_prove(byte[] out_scalar, byte[] r_scalar, byte[] k_scalar, byte[] h_scalar) {
        sc_muladd.sc_muladd(out_scalar, h_scalar, k_scalar, r_scalar);
        return 0;
    }

    /* R = s*B - h*K */
    public static int generalized_solve_commitment(byte[] R_bytes_out, ge_p3 K_point_out,
                                                   ge_p3 B_point, byte[] s_scalar,
                                                   byte[] K_bytes, byte[] h_scalar) {
        ge_p3 Kneg_point = new ge_p3();
        ge_p2 R_calc_point_p2 = new ge_p2();

        ge_p3 sB = new ge_p3();
        ge_p3 hK = new ge_p3();
        ge_p3 R_calc_point_p3 = new ge_p3();

        if (ge_frombytes.ge_frombytes_negate_vartime(Kneg_point, K_bytes) != 0) {
            return -1;
        }

        if (B_point == null) {
            ge_double_scalarmult.ge_double_scalarmult_vartime(R_calc_point_p2, h_scalar, Kneg_point, s_scalar);
            ge_tobytes.ge_tobytes(R_bytes_out, R_calc_point_p2);
        } else {
            // s * Bv
            ge_scalarmult.ge_scalarmult(sB, s_scalar, B_point);

            // h * -K
            ge_scalarmult.ge_scalarmult(hK, h_scalar, Kneg_point);

            // R = sB - hK
            ge_p3_add.ge_p3_add(R_calc_point_p3, sB, hK);
            ge_p3_tobytes.ge_p3_tobytes(R_bytes_out, R_calc_point_p3);
        }

        if (K_point_out != null) {
            ge_neg.ge_neg(K_point_out, Kneg_point);
        }

        return 0;
    }

    public static boolean generalized_calculate_Bv(Sha512 sha512provider, ge_p3 Bv_point,
                                               byte[] labelset, byte[] K_bytes,
                                               byte[] M_buf, int M_start, int M_len) {
        if (!gen_labelset.labelset_validate(labelset))
            return false;
        if (Bv_point == null || K_bytes == null || M_buf == null)
            return false;

        int prefix_len = 2 * POINTLEN + labelset.length;
        if (prefix_len > M_start)
            return false;

        int startIndex = M_start - prefix_len;
        System.arraycopy(B_bytes, 0, M_buf, startIndex, POINTLEN);
        System.arraycopy(labelset, 0, M_buf, startIndex + POINTLEN, labelset.length);
        System.arraycopy(K_bytes, 0, M_buf, startIndex + POINTLEN + labelset.length, POINTLEN);

        byte[] in = java.util.Arrays.copyOfRange(M_buf, startIndex, M_start + M_len);
        System.arraycopy(M_buf, M_start, in, in.length - M_len, M_len);
        hash_to_point(sha512provider, Bv_point, in);
        return !ge_isneutral.ge_isneutral(Bv_point);
    }

    public static int generalized_calculate_vrf_output(Sha512 sha512provider,
                                                       byte[] vrf_output,
                                                       byte[] labelset,
                                                       ge_p3 cKv_point) {
        byte[] cKv_bytes = new byte[POINTLEN];
        byte[] hash = new byte[HASHLEN];

        if (vrf_output == null) return -1;
        Arrays.fill(vrf_output, (byte) 0);

        if (labelset.length + 2 * POINTLEN > BUFLEN)
            return -1;
        if (!gen_labelset.labelset_validate(labelset))
            return -1;
        if (cKv_point == null)
            return -1;

        ge_p3_tobytes.ge_p3_tobytes(cKv_bytes, cKv_point);

        byte[] buf = new byte[2 * POINTLEN + labelset.length];
        System.arraycopy(B_bytes, 0, buf, 0, POINTLEN);
        System.arraycopy(labelset, 0, buf, POINTLEN, labelset.length);
        System.arraycopy(cKv_bytes, 0, buf, POINTLEN + labelset.length, POINTLEN);

        sha512provider.calculateDigest(hash, buf, buf.length);
        System.arraycopy(hash, 0, vrf_output, 0, VRFOUTPUTLEN);
        return 0;
    }

    public static boolean generalized_veddsa_25519_sign(
            Sha512 sha512provider,
            byte[] signature_out,
            byte[] eddsa_25519_pubkey_bytes,
            byte[] eddsa_25519_privkey_scalar,
            byte[] msg,
            byte[] random,
            byte[] customization_label) {
        if (signature_out == null) {
            return false;
        }

        if (eddsa_25519_pubkey_bytes == null) {
            return false;
        }
        if (eddsa_25519_privkey_scalar == null) {
            return false;
        }
        if (customization_label == null || customization_label.length > gen_labelset.LABELMAXLEN) {
            return false;
        }
        if (msg == null || msg.length > MSGMAXLEN) {
            return false;
        }

        ge_p3 Bv_point = new ge_p3();
        ge_p3 Kv_point = new ge_p3();
        ge_p3 Rv_point = new ge_p3();

        byte[] Bv_bytes = new byte[POINTLEN];
        byte[] Kv_bytes = new byte[POINTLEN];
        byte[] Rv_bytes = new byte[POINTLEN];
        byte[] R_bytes = new byte[POINTLEN];
        byte[] r_scalar = new byte[SCALARLEN];
        byte[] h_scalar = new byte[SCALARLEN];
        byte[] s_scalar = new byte[SCALARLEN];
        byte[] extra = new byte[3 * POINTLEN];
        byte[] M_buf = new byte[msg.length + MSTART];
        String protocol_name = "VEdDSA_25519_SHA512_Elligator2";

        System.arraycopy(msg, 0, M_buf, MSTART, msg.length);

        byte[] labelset = gen_labelset.labelset_new(protocol_name, customization_label);

        //  labelset1 = add_label(labels, "1")
        //  Bv = hash(hash(labelset1 || K) || M)
        //  Kv = k * Bv
        labelset = gen_labelset.labelset_add(labelset, "1");
        generalized_calculate_Bv(sha512provider, Bv_point, labelset,
                eddsa_25519_pubkey_bytes, M_buf, MSTART, msg.length);
        ge_scalarmult.ge_scalarmult(Kv_point, eddsa_25519_privkey_scalar, Bv_point);
        ge_p3_tobytes.ge_p3_tobytes(Bv_bytes, Bv_point);
        ge_p3_tobytes.ge_p3_tobytes(Kv_bytes, Kv_point);

        //  labelset2 = add_label(labels, "2")
        //  R, r = commit(labelset2, (Bv || Kv), (K,k), Z, M)
        labelset[labelset.length - 1] = '2';
        System.arraycopy(Bv_bytes, 0, extra, 0, POINTLEN);
        System.arraycopy(Kv_bytes, 0, extra, POINTLEN, POINTLEN);
        if (!generalized_commit(sha512provider, R_bytes, r_scalar,
                labelset,
                extra, 2 * POINTLEN,
                eddsa_25519_pubkey_bytes, eddsa_25519_privkey_scalar,
                random, msg, M_buf, MSTART, msg.length)) {
            return false;
        }

        //  Rv = r * Bv
        ge_scalarmult.ge_scalarmult(Rv_point, r_scalar, Bv_point);
        ge_p3_tobytes.ge_p3_tobytes(Rv_bytes, Rv_point);

        //  labelset3 = add_label(labels, "3")
        //  h = challenge(labelset3, (Bv || Kv || Rv), R, K, M)
        labelset[labelset.length - 1] = '3';
//        memcpy(extra + 2*POINTLEN, Rv_bytes, POINTLEN);
        System.arraycopy(Rv_bytes, 0, extra, 2 * POINTLEN, POINTLEN);
        if (generalized_challenge(sha512provider, h_scalar,
                labelset, extra, R_bytes, eddsa_25519_pubkey_bytes, M_buf, MSTART, msg.length) != 0) {
            return false;
        }

        //  s = prove(r, k, h)
        if (generalized_prove(s_scalar, r_scalar, eddsa_25519_privkey_scalar, h_scalar) != 0) {
            return false;
        }

        //  return (Kv || h || s)
        System.arraycopy(Kv_bytes, 0, signature_out, 0, POINTLEN);
        System.arraycopy(h_scalar, 0, signature_out, POINTLEN, SCALARLEN);
        System.arraycopy(s_scalar, 0, signature_out, POINTLEN + SCALARLEN, SCALARLEN);

        Arrays.fill(r_scalar, (byte) 0);

        return true;
    }

    public static int generalized_veddsa_25519_verify(
            Sha512 sha512provider,
            byte[] vrf_output,
            byte[] signature,
            byte[] eddsa_25519_pubkey_bytes,
            byte[] msg,
            byte[] customization_label) {
        if (signature == null) return -1;
        if (eddsa_25519_pubkey_bytes == null) return -1;
        if (msg == null) return -1;
        if (customization_label == null) return -1;
        if (customization_label.length > gen_labelset.LABELMAXLEN) return -1;
        if (msg.length > MSGMAXLEN) return -1;

        ge_p3 Bv_point = new ge_p3();
        ge_p3 K_point = new ge_p3();
        ge_p3 Kv_point = new ge_p3();
        ge_p3 cK_point = new ge_p3();
        ge_p3 cKv_point = new ge_p3();

        byte[] Bv_bytes = new byte[POINTLEN];
        byte[] R_calc_bytes = new byte[POINTLEN];
        byte[] Rv_calc_bytes = new byte[POINTLEN];
        byte[] h_calc_scalar = new byte[SCALARLEN];
        byte[] extra = new byte[3 * POINTLEN];
        String protocol_name = "VEdDSA_25519_SHA512_Elligator2";

        byte[] M_buf = new byte[msg.length + MSTART];
        System.arraycopy(msg, 0, M_buf, MSTART, msg.length);

        byte[] Kv_bytes = new byte[POINTLEN];
        System.arraycopy(signature, 0, Kv_bytes, 0, POINTLEN);
        byte[] h_scalar = new byte[SCALARLEN];
        System.arraycopy(signature, POINTLEN, h_scalar, 0, SCALARLEN);
        byte[] s_scalar = new byte[SCALARLEN];
        System.arraycopy(signature, POINTLEN + SCALARLEN, s_scalar, 0, SCALARLEN);

        if (!point_isreduced.point_isreduced(eddsa_25519_pubkey_bytes)) return -1;
        if (!point_isreduced.point_isreduced(Kv_bytes)) return -1;
        if (!sc_isreduced.sc_isreduced(h_scalar)) return -1;
        if (!sc_isreduced.sc_isreduced(s_scalar)) return -1;

        //  gen_labelset = new_labelset(protocol_name, customization_label)
        byte[] labelset = gen_labelset.labelset_new(protocol_name, customization_label);

        //  labelset1 = add_label(labels, "1")
        //  Bv = hash(hash(labelset1 || K) || M)
        labelset = gen_labelset.labelset_add(labelset, "1");
        if (!generalized_calculate_Bv(sha512provider, Bv_point, labelset, eddsa_25519_pubkey_bytes, M_buf, MSTART, msg.length)) return -1;
        ge_p3_tobytes.ge_p3_tobytes(Bv_bytes, Bv_point);

        //  R = solve_commitment(B, s, K, h)
        if (generalized_solve_commitment(R_calc_bytes, K_point, null,
                s_scalar, eddsa_25519_pubkey_bytes, h_scalar) != 0) return -1;

        //  Rv = solve_commitment(Bv, s, Kv, h)
        if (generalized_solve_commitment(Rv_calc_bytes, Kv_point, Bv_point,
                s_scalar, Kv_bytes, h_scalar) != 0) return -1;

        ge_scalarmult_cofactor.ge_scalarmult_cofactor(cK_point, K_point);
        ge_scalarmult_cofactor.ge_scalarmult_cofactor(cKv_point, Kv_point);
        if (ge_isneutral.ge_isneutral(cK_point) || ge_isneutral.ge_isneutral(cKv_point) || ge_isneutral.ge_isneutral(Bv_point)) return -1;

        //  labelset3 = add_label(labels, "3")
        //  h = challenge(labelset3, (Bv || Kv || Rv), R, K, M)
        labelset[labelset.length - 1] = '3';
        System.arraycopy(Bv_bytes, 0, extra, 0, POINTLEN);
        System.arraycopy(Kv_bytes, 0, extra, POINTLEN, POINTLEN);
        System.arraycopy(Rv_calc_bytes, 0, extra, 2 * POINTLEN, POINTLEN);
        if (generalized_challenge(sha512provider, h_calc_scalar,
                labelset,
                extra,
                R_calc_bytes, eddsa_25519_pubkey_bytes, M_buf, MSTART, msg.length) != 0) return -1;

        // if bytes_equal(h, h')
        if (crypto_verify_32.crypto_verify_32(h_scalar, h_calc_scalar) != 0) return -1;

        //  labelset4 = add_label(labels, "4")
        //  v = hash(labelset4 || c*Kv)
        labelset[labelset.length - 1] = '4';

        return generalized_calculate_vrf_output(sha512provider, vrf_output, labelset, cKv_point);
    }
}
