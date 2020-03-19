package org.whispersystems.curve25519.java;

import java.nio.ByteBuffer;
import java.security.MessageDigest;

import static org.whispersystems.curve25519.java.gen_x.POINTLEN;
import static org.whispersystems.curve25519.java.gen_x.SCALARLEN;

public class veddsa {
    static final int BLOCKLEN = 128; /* SHA512 */
    static final int HASHLEN = 64;  /* SHA512 */
    static final int RANDLEN = 32;
    static final int MSTART = 2048;
    static final int MSGMAXLEN = 1048576;
    static final int BUFLEN = 1024;
    static final int VRFOUTPUTLEN = 32;
    static final int LABELSETMAXLEN = 512;
    static final int LABELMAXLEN = Byte.MAX_VALUE;

    /**
     *  the byte string representing the base point of Ed25519
     */
    public static final byte[] B_bytes = {
            0x58, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
    };

    private static byte[] labelset_new(String protocol_name,
                                      byte[] customization_label, byte label) {
        if (LABELSETMAXLEN < 3 + protocol_name.length() + customization_label.length + 2)
            return null;
        if (protocol_name.length() > LABELMAXLEN)
            return null;
        if (customization_label.length > LABELMAXLEN)
            return null;

        byte[] protocol_name_bytes = protocol_name.getBytes();

        ByteBuffer bb = ByteBuffer.allocate(3 + protocol_name_bytes.length + customization_label.length + 2);
        bb.put((byte)3);
        bb.put((byte)protocol_name_bytes.length);
        bb.put(protocol_name_bytes);
        bb.put((byte)customization_label.length);
        bb.put(customization_label);
        assert bb.position() == 3 + protocol_name.length() + customization_label.length;
        bb.put((byte)1);
        bb.put(label);

        assert bb.position() < LABELSETMAXLEN;

        return bb.array();

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
    private static boolean generalized_commit(Sha512 sha512provider, byte[] R_bytes, byte[] r_scalar,
                                         byte[] labelset,
                                         byte[] extra, int extra_len,
                                         byte[] K_bytes, byte[] k_scalar,
                                         byte[] Z,
                                         byte[] message) {
        ge_p3 R_point = new ge_p3();
        byte[] hash = new byte[HASHLEN];

        if (R_bytes == null || R_bytes.length != POINTLEN) {
            return false;
        }
        if (r_scalar == null || r_scalar.length != SCALARLEN) {
            return false;
        }
        if (K_bytes == null || K_bytes.length != POINTLEN) {
            return false;
        }
        if (k_scalar == null || k_scalar.length != SCALARLEN) {
            return false;
        }
        if (Z == null || Z.length != POINTLEN) {
            return false;
        }
        if (extra == null || extra.length == 0) {
            return false;
        }

        int prefix_len = 0;
        prefix_len += POINTLEN + labelset.length + RANDLEN;
        int pad_len1 = ((BLOCKLEN - (prefix_len % BLOCKLEN)) % BLOCKLEN);
        prefix_len += pad_len1;
        prefix_len += SCALARLEN;
        int pad_len2 = ((BLOCKLEN - (prefix_len % BLOCKLEN)) % BLOCKLEN);

        MessageDigest md = sha512provider.initDigest();

        sha512provider.updateDigest(md, B_bytes, POINTLEN);
        sha512provider.updateDigest(md, labelset, labelset.length);
        sha512provider.updateDigest(md, Z, RANDLEN);
        sha512provider.updateDigest(md, new byte[pad_len1], pad_len1);
        sha512provider.updateDigest(md, k_scalar, SCALARLEN);
        sha512provider.updateDigest(md, new byte[pad_len2], pad_len2);
        sha512provider.updateDigest(md, labelset, labelset.length);
        sha512provider.updateDigest(md, K_bytes, POINTLEN);
        sha512provider.updateDigest(md, extra, extra_len);
        sha512provider.updateDigest(md, message, message.length);

        sha512provider.finishDigest(hash, md);

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
    private static boolean generalized_challenge(Sha512 sha512provider, byte[] h_scalar,
                                            byte[] labelset,
                                            byte[] extra,
                                            byte[] R_bytes,
                                            byte[] K_bytes,
                                            byte[] message) {

        byte[] hash = new byte[HASHLEN];

        if (h_scalar == null || h_scalar.length != SCALARLEN) return false;
        if (R_bytes == null || R_bytes.length != POINTLEN) return false;
        if (K_bytes == null || K_bytes.length != POINTLEN) return false;

        if (extra == null) return false;
        MessageDigest md = sha512provider.initDigest();

        sha512provider.updateDigest(md, B_bytes, POINTLEN);
        sha512provider.updateDigest(md, labelset, labelset.length);
        sha512provider.updateDigest(md, R_bytes, POINTLEN);
        sha512provider.updateDigest(md, labelset, labelset.length);
        sha512provider.updateDigest(md, K_bytes, POINTLEN);
        sha512provider.updateDigest(md, extra, extra.length);
        sha512provider.updateDigest(md, message, message.length);

        sha512provider.finishDigest(hash, md);
        sc_reduce.sc_reduce(hash);
        System.arraycopy(hash, 0, h_scalar, 0, SCALARLEN);
        return true;
    }

    /* return r + kh (mod q) */
    private static boolean generalized_prove(byte[] out_scalar, byte[] r_scalar, byte[] k_scalar, byte[] h_scalar) {
        if (out_scalar == null || out_scalar.length != SCALARLEN) {
            return false;
        }
        if (r_scalar == null || r_scalar.length != SCALARLEN) {
            return false;
        }
        if (k_scalar == null || k_scalar.length != SCALARLEN) {
            return false;
        }
        if (h_scalar == null || h_scalar.length != SCALARLEN) {
            return false;
        }
        sc_muladd.sc_muladd(out_scalar, h_scalar, k_scalar, r_scalar);
        return true;
    }

    /* R = s*B - h*K */
    private static boolean generalized_solve_commitment(byte[] R_bytes_out, ge_p3 K_point_out,
                                                   ge_p3 B_point, byte[] s_scalar,
                                                   byte[] K_bytes, byte[] h_scalar) {
        if (R_bytes_out == null || R_bytes_out.length != POINTLEN) {
            return false;
        }
        if (s_scalar == null || s_scalar.length != SCALARLEN) {
            return false;
        }
        if (K_bytes == null || K_bytes.length != POINTLEN) {
            return false;
        }
        if (h_scalar == null || h_scalar.length != SCALARLEN) {
            return false;
        }
        ge_p3 Kneg_point = new ge_p3();

        // check that they eddsa_25519_pubkey_bytes and Kv_bytes are on the curve
        if (ge_frombytes.ge_frombytes_negate_vartime(Kneg_point, K_bytes) != 0) {
            return false;
        }

        if (B_point == null) {
            ge_p2 R_calc_point_p2 = new ge_p2();
            ge_double_scalarmult.ge_double_scalarmult_vartime(R_calc_point_p2, h_scalar, Kneg_point, s_scalar);
            ge_tobytes.ge_tobytes(R_bytes_out, R_calc_point_p2);
        } else {
            ge_p3 sB = new ge_p3();
            ge_p3 hK = new ge_p3();
            ge_p3 R_calc_point_p3 = new ge_p3();

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

        return true;
    }

    private static boolean generalized_calculate_Bv(Sha512 sha512provider, ge_p3 Bv_point,
                                                    byte[] labelset, byte[] K_bytes,
                                                    byte[] M_buf, int M_start, int M_len) {
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
        elligator.hash_to_point(sha512provider, Bv_point, in);
        return true;
    }

    private static boolean generalized_calculate_vrf_output(Sha512 sha512provider,
                                                       byte[] vrf_output,
                                                       byte[] labelset,
                                                       ge_p3 cKv_point) {
        byte[] cKv_bytes = new byte[POINTLEN];
        byte[] hash = new byte[HASHLEN];

        if (vrf_output == null || vrf_output.length != VRFOUTPUTLEN) {
            return false;
        }

        if (labelset.length + 2 * POINTLEN > BUFLEN)
            return false;
        if (cKv_point == null)
            return false;

        ge_p3_tobytes.ge_p3_tobytes(cKv_bytes, cKv_point);

        MessageDigest md = sha512provider.initDigest();

        sha512provider.updateDigest(md, B_bytes, POINTLEN);
        sha512provider.updateDigest(md, labelset, labelset.length);
        sha512provider.updateDigest(md, cKv_bytes, cKv_bytes.length);

        sha512provider.finishDigest(hash, md);

        System.arraycopy(hash, 0, vrf_output, 0, VRFOUTPUTLEN);
        return true;
    }

    static boolean generalized_veddsa_25519_sign(
            Sha512 sha512provider,
            byte[] signature_out,
            byte[] eddsa_25519_pubkey_bytes,
            byte[] eddsa_25519_privkey_scalar,
            byte[] msg,
            byte[] random,
            byte[] customization_label) {
        if (signature_out == null || signature_out.length != POINTLEN+2*SCALARLEN) {
            return false;
        }

        if (eddsa_25519_pubkey_bytes == null) {
            return false;
        }
        if (eddsa_25519_privkey_scalar == null) {
            return false;
        }
        if (customization_label == null || customization_label.length > LABELMAXLEN) {
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

        //  labelset1 = add_label(labels, "1")
        byte[] labelset = labelset_new(protocol_name, customization_label, (byte)'1');

        if (labelset == null) {
            return false;
        }

        //  Bv = hash(B || labelset1 || K || M)
        generalized_calculate_Bv(sha512provider, Bv_point, labelset,
                eddsa_25519_pubkey_bytes, M_buf, MSTART, msg.length);
        //  Kv = k * Bv
        ge_scalarmult.ge_scalarmult(Kv_point, eddsa_25519_privkey_scalar, Bv_point);
        ge_p3_tobytes.ge_p3_tobytes(Bv_bytes, Bv_point);
        ge_p3_tobytes.ge_p3_tobytes(Kv_bytes, Kv_point);

        //  labelset2 = add_label(labels, "2")
        labelset[labelset.length - 1] = '2';
        System.arraycopy(Bv_bytes, 0, extra, 0, POINTLEN);
        System.arraycopy(Kv_bytes, 0, extra, POINTLEN, POINTLEN);
        //  R, r = commit(labelset2, (Bv || Kv), (K,k), Z, M)
        if (!generalized_commit(sha512provider, R_bytes, r_scalar,
                labelset,
                extra, 2 * POINTLEN,
                eddsa_25519_pubkey_bytes, eddsa_25519_privkey_scalar,
                random, msg)) {
            return false;
        }

        //  Rv = r * Bv
        ge_scalarmult.ge_scalarmult(Rv_point, r_scalar, Bv_point);
        ge_p3_tobytes.ge_p3_tobytes(Rv_bytes, Rv_point);

        //  labelset3 = add_label(labels, "3")
        labelset[labelset.length - 1] = '3';
        System.arraycopy(Rv_bytes, 0, extra, 2 * POINTLEN, POINTLEN);
        //  h = challenge(labelset3, (Bv || Kv || Rv), R, K, M)
        if (!generalized_challenge(sha512provider, h_scalar,
                labelset, extra, R_bytes, eddsa_25519_pubkey_bytes, msg)) {
            return false;
        }

        //  s = prove(r, k, h)
        if (!generalized_prove(s_scalar, r_scalar, eddsa_25519_privkey_scalar, h_scalar)) {
            return false;
        }

        //  return (Kv || h || s)
        System.arraycopy(Kv_bytes, 0, signature_out, 0, POINTLEN);
        System.arraycopy(h_scalar, 0, signature_out, POINTLEN, SCALARLEN);
        System.arraycopy(s_scalar, 0, signature_out, POINTLEN + SCALARLEN, SCALARLEN);

        return true;
    }

    static boolean generalized_veddsa_25519_verify(
            Sha512 sha512provider,
            byte[] vrf_output,
            byte[] signature,
            byte[] eddsa_25519_pubkey_bytes,
            byte[] msg,
            byte[] customization_label) {
        if (signature == null || signature.length != POINTLEN + 2 * SCALARLEN) return false;
        if (eddsa_25519_pubkey_bytes == null || eddsa_25519_pubkey_bytes.length != POINTLEN) return false;
        if (msg == null || msg.length > MSGMAXLEN) return false;
        if (customization_label == null || customization_label.length > LABELMAXLEN) return false;
        if (vrf_output == null || vrf_output.length != VRFOUTPUTLEN) return false;

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

        if (!point_isreduced.point_isreduced(eddsa_25519_pubkey_bytes)) return false;
        if (!point_isreduced.point_isreduced(Kv_bytes)) return false;
        if (!sc_isreduced.sc_isreduced(h_scalar)) return false;
        if (!sc_isreduced.sc_isreduced(s_scalar)) return false;

        //  labelset1 = add_label(labels, "1")
        byte[] labelset = labelset_new(protocol_name, customization_label, (byte) '1');

        if (labelset == null) {
            return false;
        }

        //  Bv = hash(B || labelset1 || K || M)
        if (!generalized_calculate_Bv(sha512provider, Bv_point, labelset, eddsa_25519_pubkey_bytes, M_buf, MSTART, msg.length)) return false;
        ge_p3_tobytes.ge_p3_tobytes(Bv_bytes, Bv_point);

        //  R = solve_commitment(B, s, K, h)
        if (!generalized_solve_commitment(R_calc_bytes, K_point, null,
                s_scalar, eddsa_25519_pubkey_bytes, h_scalar)) return false;

        //  Rv = solve_commitment(Bv, s, Kv, h)
        if (!generalized_solve_commitment(Rv_calc_bytes, Kv_point, Bv_point,
                s_scalar, Kv_bytes, h_scalar)) return false;

        ge_scalarmult_cofactor.ge_scalarmult_cofactor(cK_point, K_point);
        ge_scalarmult_cofactor.ge_scalarmult_cofactor(cKv_point, Kv_point);
        if (ge_isneutral.ge_isneutral(cK_point) || ge_isneutral.ge_isneutral(cKv_point) || ge_isneutral.ge_isneutral(Bv_point)) return false;

        //  labelset3 = add_label(labels, "3")
        //  h = challenge(labelset3, (Bv || Kv || Rv), R, K, M)
        labelset[labelset.length - 1] = '3';
        System.arraycopy(Bv_bytes, 0, extra, 0, POINTLEN);
        System.arraycopy(Kv_bytes, 0, extra, POINTLEN, POINTLEN);
        System.arraycopy(Rv_calc_bytes, 0, extra, 2 * POINTLEN, POINTLEN);
        if (!generalized_challenge(sha512provider, h_calc_scalar,
                labelset,
                extra,
                R_calc_bytes, eddsa_25519_pubkey_bytes, msg)) return false;

        // if bytes_equal(h, h')
        if (!java.util.Arrays.equals(h_scalar, h_calc_scalar)) return false;

        //  labelset4 = add_label(labels, "4")
        //  v = hash(labelset4 || c*Kv)
        labelset[labelset.length - 1] = '4';

        return generalized_calculate_vrf_output(sha512provider, vrf_output, labelset, cKv_point);
    }
}
