package org.whispersystems.curve25519.java;

import java.nio.ByteBuffer;

public class veddsa {
    final static int LABELSETMAXLEN = 512;
    final static int LABELMAXLEN = 128;
    final static int BLOCKLEN = 128; /* SHA512 */
    final static int HASHLEN = 64;  /* SHA512 */
    final static int POINTLEN = 32;
    final static int SCALARLEN = 32;
    final static int RANDLEN = 32;
    final static int SIGNATURELEN = 64;
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

    private static void bufferPad(ByteBuffer bb) {
        int padLen = (BLOCKLEN - (bb.position() % BLOCKLEN)) % BLOCKLEN;
        bb.put(new byte[padLen]);
    }

    /* B: base point 
     * R: commitment (point), 
       r: private nonce (scalar)
       K: encoded public key
       k: private key (scalar)
       Z: 32-bytes random
       M: buffer containing message, message starts at M_start, continues for M_len
       r = hash(B || labelset || Z || pad1 || k || pad2 || labelset || K || extra || M) (mod q)
    */
    public static int generalized_commit(Sha512 sha512provider, byte[] R_bytes, byte[] r_scalar,
                                         byte[] labelset, int labelset_len,
                                         byte[] extra, int extra_len,
                                         byte[] K_bytes, byte[] k_scalar,
                                         byte[] Z, byte[] M_buf, int M_start, int M_len) {
        ge_p3 R_point = new ge_p3();
        byte[] hash = new byte[32];

//       todo if (labelset_validate(labelset, labelset_len) != 0) return -1;
        if (R_bytes == null || r_scalar == null ||
                K_bytes == null || k_scalar == null ||
                Z == null || M_buf == null) return -1;
        if (extra == null && extra_len != 0) return -1;
        if (extra != null && extra_len == 0) return -1;
//       todo if (extra != null && labelset_is_empty(labelset, labelset_len)) return -1;
        if (HASHLEN != 64) return -1;

        int prefix_len = 0;
        prefix_len += POINTLEN + labelset_len + RANDLEN;
        prefix_len += ((BLOCKLEN - (prefix_len % BLOCKLEN)) % BLOCKLEN);
        prefix_len += SCALARLEN;
        prefix_len += ((BLOCKLEN - (prefix_len % BLOCKLEN)) % BLOCKLEN);
        prefix_len += labelset_len + POINTLEN + extra_len;
        if (prefix_len > M_start) return -1;

        ByteBuffer byteBuffer = ByteBuffer.allocate(prefix_len + M_len);
        byteBuffer.put(B_bytes);
        byteBuffer.put(labelset);
        byteBuffer.put(Z);
        bufferPad(byteBuffer);
        byteBuffer.put(k_scalar);
        bufferPad(byteBuffer);
        byteBuffer.put(labelset);
        byteBuffer.put(K_bytes);
        byteBuffer.put(extra);

        sha512provider.calculateDigest(hash, byteBuffer.array(), prefix_len + M_len);

        sc_reduce.sc_reduce(hash);
        ge_scalarmult_base.ge_scalarmult_base(R_point, hash);
        ge_p3_tobytes.ge_p3_tobytes(R_bytes, R_point);
        System.arraycopy(hash, 0, r_scalar, 0, SCALARLEN);
        // todo copy to M_buf?!
        return 0;
    }

    /* if is_labelset_empty(labelset):
           return hash(R || K || M) (mod q)
       else:
           return hash(B || labelset || R || labelset || K || extra || M) (mod q)
    */
    public static int generalized_challenge(Sha512 sha512provider, byte[] h_scalar,
                                            byte[] labelset,
                                            byte[] extra,
                                            byte[] R_bytes,
                                            byte[] K_bytes) {

        byte[] hash = new byte[HASHLEN];

        if (h_scalar == null) return -1;
        h_scalar = new byte[SCALARLEN];

//       todo if (labelset_validate(labelset, labelset_len) != 0) return -1;
        if (R_bytes == null || K_bytes == null || M_buf == null) return -1;
        if (extra == null && extra.length != 0) return -1;
        if (extra != null && extra.length == 0) return -1;
//       todo if (extra != null && labelset_is_empty(labelset, labelset_len)) return -1;

        ByteBuffer byteBuffer = ByteBuffer.allocate(MSTART);

        if (labelset_is_empty(labelset, labelset.length)) {
            if (2 * POINTLEN > MSTART) return -1;
            if (extra != null || extra.length != 0) return -1;
            byteBuffer.put(R_bytes);
            byteBuffer.put(K_bytes);
        } else {
//            prefix_len = 3 * POINTLEN + 2 * labelset.length + extra.length;

            byteBuffer.put(B_bytes);
            byteBuffer.put(labelset);
            byteBuffer.put(R_bytes);
            byteBuffer.put(labelset);
            byteBuffer.put(K_bytes);
            byteBuffer.put(extra);
        }

        sha512provider.calculateDigest(hash, byteBuffer.compact().array(), byteBuffer.position());
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
        ge_p3 Kneg_point;
        ge_p2 R_calc_point_p2;

        ge_p3 sB;
        ge_p3 hK;
        ge_p3 R_calc_point_p3;

        if (ge_frombytes.ge_frombytes_negate_vartime(Kneg_point, K_bytes) != 0) return -1;

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

        if (K_point_out) {
            ge_neg.ge_neg(K_point_out, Kneg_point);
        }

        return 0;
    }

    public static int generalized_calculate_Bv(ge_p3 Bv_point,
                                               byte[] labelset, byte[] K_bytes,
                                               byte[] M_buf, int M_start, int M_len) {
        byte[] bufptr;
        int prefix_len = 0;

        if (labelset_validate(labelset) != 0)
            return -1;
        if (Bv_point == null || K_bytes == null || M_buf == null)
            return -1;

        prefix_len = 2 * POINTLEN + labelset.length;
        if (prefix_len > M_start)
            throw new IllegalArgumentException();

        ByteBuffer byteBuffer = ByteBuffer.allocate(2 * POINTLEN + labelset.length);
        byteBuffer.put(B_bytes);
        byteBuffer.put(labelset);
        byteBuffer.put(K_bytes);

        // todo hash_to_point
        hash_to_point(Bv_point, M_buf + M_start - prefix_len, prefix_len + M_len);
        // todo ge_isneutral
//        if (ge_isneutral.ge_isneutral(Bv_point))
//            return -1;
        return 0;
    }

    public static byte[] generalized_calculate_vrf_output(Sha512 sha512provider,
                                                       byte[] labelset,
                                                       ge_p3 cKv_point) {
        byte[] cKv_bytes = new byte[POINTLEN];
        byte[] hash = new byte[HASHLEN];

        if (labelset.length + 2 * POINTLEN > BUFLEN)
            throw new IllegalArgumentException();
        if (labelset_validate(labelset) != 0)
            throw new IllegalArgumentException();
        if (cKv_point == null)
            throw new IllegalArgumentException();
        if (VRFOUTPUTLEN > HASHLEN)
            throw new IllegalArgumentException();

        ge_p3_tobytes.ge_p3_tobytes(cKv_bytes, cKv_point);

        ByteBuffer byteBuffer = ByteBuffer.allocate(BUFLEN);

        byteBuffer.put(B_bytes);
        byteBuffer.put(labelset);
        byteBuffer.put(cKv_bytes);

        sha512provider.calculateDigest(hash, byteBuffer.compact().array(), byteBuffer.position());
        byte[] vrf_output = new byte[VRFOUTPUTLEN];
        System.arraycopy(hash, 0, vrf_output, 0, VRFOUTPUTLEN);
        return vrf_output;
    }

    public static int generalized_veddsa_25519_sign(
            Sha512 sha512provider,
            byte[] signature_out,
            byte[] eddsa_25519_pubkey_bytes,
            byte[] eddsa_25519_privkey_scalar,
            byte[] msg,
            int msg_len,
            byte[] random,
            byte[] customization_label,
            int customization_label_len) {
        int labelset_len = 0;

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
        byte[] M_buf = new byte[msg_len + MSTART];
        String protocol_name = "VEdDSA_25519_SHA512_Elligator2";

        if (signature_out == null) return -1;

        if (eddsa_25519_pubkey_bytes == null) return -1;
        if (eddsa_25519_privkey_scalar == null) return -1;
        if (msg == null) return -1;
        if (customization_label == null && customization_label_len != 0) return -1;
        if (customization_label_len > LABELMAXLEN) return -1;
        if (msg_len > MSGMAXLEN) return -1;

        // memcpy(M_buf + MSTART, msg, msg_len);
        System.arraycopy(msg, 0, M_buf, MSTART, msg_len);

        //  labelset = new_labelset(protocol_name, customization_label)
        byte[] labelset = labelset_new(protocol_name, customization_label);

        //  labelset1 = add_label(labels, "1")
        //  Bv = hash(hash(labelset1 || K) || M)
        //  Kv = k * Bv
        labelset_add(labelset, labelset_len, LABELSETMAXLEN, "1", 1);
        generalized_calculate_Bv(Bv_point, labelset,
                eddsa_25519_pubkey_bytes, M_buf, MSTART, msg_len)
        ge_scalarmult.ge_scalarmult(Kv_point, eddsa_25519_privkey_scalar, Bv_point);
        ge_p3_tobytes.ge_p3_tobytes(Bv_bytes, Bv_point);
        ge_p3_tobytes.ge_p3_tobytes(Kv_bytes, Kv_point);

        //  labelset2 = add_label(labels, "2")
        //  R, r = commit(labelset2, (Bv || Kv), (K,k), Z, M)
        labelset[labelset_len - 1] = '2';
//        memcpy(extra, Bv_bytes, POINTLEN);
        System.arraycopy(Bv_bytes, 0, extra, 0, POINTLEN);
//        memcpy(extra + POINTLEN, Kv_bytes, POINTLEN);
        System.arraycopy(Kv_bytes, 0, extra, POINTLEN, POINTLEN);
        if (generalized_commit(sha512provider, R_bytes, r_scalar,
                labelset, labelset_len,
                extra, 2 * POINTLEN,
                eddsa_25519_pubkey_bytes, eddsa_25519_privkey_scalar,
                random, M_buf, MSTART, msg_len) != 0) return -1;

        //  Rv = r * Bv
        ge_scalarmult.ge_scalarmult(Rv_point, r_scalar, Bv_point);
        ge_p3_tobytes.ge_p3_tobytes(Rv_bytes, Rv_point);

        //  labelset3 = add_label(labels, "3")
        //  h = challenge(labelset3, (Bv || Kv || Rv), R, K, M)
        labelset[labelset_len - 1] = '3';
//        memcpy(extra + 2*POINTLEN, Rv_bytes, POINTLEN);
        System.arraycopy(Rv_bytes, 0, extra, 2 * POINTLEN, POINTLEN);
        if (generalized_challenge(sha512provider, h_scalar,
                labelset, extra, R_bytes, eddsa_25519_pubkey_bytes) != 0) return -1;

        //  s = prove(r, k, h)
        if (generalized_prove(s_scalar, r_scalar, eddsa_25519_privkey_scalar, h_scalar) != 0) return -1;

        //  return (Kv || h || s)
        System.arraycopy(Kv_bytes, 0, signature_out, 0, POINTLEN);
        System.arraycopy(h_scalar, 0, signature_out, POINTLEN, SCALARLEN);
        System.arraycopy(s_scalar, 0, signature_out, POINTLEN + SCALARLEN, SCALARLEN);

        Arrays.fill(r_scalar, (byte) 0);

        return 0;
    }

    public static byte[] labelset_new(String protocol_name,
                                   byte[] customization_label) {
//        unsigned char* bufptr;

//        *labelset_len = 0;
        if (LABELSETMAXLEN < 3 + protocol_name.length() + customization_label.length)
            throw new IllegalArgumentException();
        if (protocol_name == null)
            throw new IllegalArgumentException();
        if (customization_label == null)
            throw new IllegalArgumentException();
        if (protocol_name.length() > LABELMAXLEN)
            throw new IllegalArgumentException();
        if (customization_label.length > LABELMAXLEN)
            throw new IllegalArgumentException();

        ByteBuffer byteBuffer = ByteBuffer.allocate(LABELSETMAXLEN);

//        bufptr = labelset;
//        *bufptr++ = 2;
        byteBuffer.put((byte)2);
//        *bufptr++ = protocol_name_len;
        byteBuffer.put((byte)protocol_name.length());
//        bufptr = buffer_add(bufptr, labelset + labelset_maxlen, protocol_name, protocol_name_len);
        byteBuffer.put(protocol_name.getBytes());
//        if (bufptr != NULL && bufptr < labelset + labelset_maxlen)
//            *bufptr++ = customization_label_len;
        // todo ?!
        if (byteBuffer.position() < LABELSETMAXLEN) {
            byteBuffer.put((byte)customization_label.length);
        }

//        bufptr = buffer_add(bufptr, labelset + labelset_maxlen, customization_label, customization_label_len);
        byteBuffer.put(customization_label);

        if (byteBuffer.position() == 3 + protocol_name.length() + customization_label.length) {
            return byteBuffer.compact().array();
        } else {
            throw new IllegalStateException();
        }
    }

    public static boolean generalized_veddsa_25519_verify(
            Sha512 sha512provider,
            byte[] vrf_out,
            byte[] signature,
            byte[] eddsa_25519_pubkey_bytes,
            byte[] msg,
            int msg_len,
            byte[] customization_label,
            int customization_label_len) {
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
        byte[] M_buf = new byte[msg_len + MSTART];
        String protocol_name = "VEdDSA_25519_SHA512_Elligator2";

        if (vrf_out == null) return -1;

        if (signature == null) return -1;
        if (eddsa_25519_pubkey_bytes == null) return -1;
        if (msg == null) return -1;
        if (customization_label == null && customization_label_len != 0) return -1;
        if (customization_label_len > LABELMAXLEN) return -1;
        if (msg_len > MSGMAXLEN) return -1;

        System.arraycopy(msg, 0, M_buf, MSTART, msg_len);

//        Kv_bytes = signature;
        byte[] Kv_bytes = new byte[POINTLEN];
        System.arraycopy(signature, 0, Kv_bytes, 0, POINTLEN);
//        h_scalar = signature + POINTLEN;
        byte[] h_scalar = new byte[SCALARLEN];
        System.arraycopy(signature, POINTLEN, h_scalar, 0, SCALARLEN);
//        s_scalar = signature + POINTLEN + SCALARLEN;
        byte[] s_scalar = new byte[SCALARLEN];
        System.arraycopy(signature, POINTLEN + SCALARLEN, s_scalar, 0, SCALARLEN);

        // todo isreduced
//        if (!point_isreduced(eddsa_25519_pubkey_bytes)) return -1;
//        if (!point_isreduced(Kv_bytes)) return -1;
//        if (!sc_isreduced(h_scalar)) return -1;
//        if (!sc_isreduced(s_scalar)) return -1;

        //  labelset = new_labelset(protocol_name, customization_label)

        byte [] labelset = labelset_new(protocol_name, customization_label);

        //  labelset1 = add_label(labels, "1")
        //  Bv = hash(hash(labelset1 || K) || M)
        labelset_add(labelset, LABELSETMAXLEN, "1", 1);
        if (generalized_calculate_Bv(Bv_point, labelset, eddsa_25519_pubkey_bytes, M_buf, MSTART, msg_len) != 0) return -1;
        ge_p3_tobytes.ge_p3_tobytes(Bv_bytes, Bv_point);

        //  R = solve_commitment(B, s, K, h)
        if (generalized_solve_commitment(R_calc_bytes, K_point, null,
                s_scalar, eddsa_25519_pubkey_bytes, h_scalar) != 0) return -1;

        //  Rv = solve_commitment(Bv, s, Kv, h)
        if (generalized_solve_commitment(Rv_calc_bytes, Kv_point, Bv_point,
                s_scalar, Kv_bytes, h_scalar) != 0) return -1;

        ge_scalarmult_cofactor.ge_scalarmult_cofactor(cK_point, K_point);
        ge_scalarmult_cofactor.ge_scalarmult_cofactor(cKv_point, Kv_point);
        // todo ge_isneutral
//        if (ge_isneutral(cK_point) || ge_isneutral(cKv_point) || ge_isneutral(Bv_point)) return -1;

        //  labelset3 = add_label(labels, "3")
        //  h = challenge(labelset3, (Bv || Kv || Rv), R, K, M)
        labelset[labelset.length - 1] = '3';
        System.arraycopy(Bv_bytes, 0, extra, 0, POINTLEN);
        System.arraycopy(Kv_bytes, 0, extra, POINTLEN, POINTLEN);
        System.arraycopy(Rv_calc_bytes, 0, extra, 2 * POINTLEN, POINTLEN);
        // todo try catch?
        if (generalized_challenge(sha512provider, h_calc_scalar,
                labelset,
                extra,
                R_calc_bytes, eddsa_25519_pubkey_bytes) != 0) return false;

        // todo try catch?
        // if bytes_equal(h, h')
        if (crypto_verify_32.crypto_verify_32(h_scalar, h_calc_scalar) != 0) return false;

        //  labelset4 = add_label(labels, "4")
        //  v = hash(labelset4 || c*Kv)
        labelset[labelset.length - 1] = '4';

        // todo try catch?
        generalized_calculate_vrf_output(sha512provider, labelset, cKv_point);

        return true;
    }
}
