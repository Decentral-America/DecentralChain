package org.whispersystems.curve25519.java;

public class vxeddsa {
    final int HASHLEN = 64;
    final int  LABELSETMAXLEN = 512;
    final int  LABELMAXLEN = 128;
    final int  BLOCKLEN = 128; /* SHA512 */
    final int  POINTLEN = 32;
    final int  SCALARLEN = 32;
    final int  RANDLEN = 32;
    final int  SIGNATURELEN = 64;
    final int  MSTART = 2048;
    final int  MSGMAXLEN = 1048576;

    final byte[] B_bytes = {
            0x58, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
    };

//#include <string.h>
//#include "gen_eddsa.h"
//          #include "gen_labelset.h"
//          #include "gen_constants.h"
//          #include "gen_crypto_additions.h"
//          #include "crypto_hash_sha512.h"
//          #include "crypto_verify_32.h"
//          #include "zeroize.h"
//          #include "ge.h"
//          #include "sc.h"
//          #include "crypto_additions.h"
//          #include "utility.h"

//               todo ge_scalarmult.ge_scalarmult(sB, s_scalar, B_point);
//               todo ge_scalarmult.ge_scalarmult(hK, h_scalar, Kneg_point);
//               todo ge_p3_add.ge_p3_add(&R_calc_point_p3, sB, hK);
//               todo ge_neg.ge_neg(K_point_out, &Kneg_point);
//               todo labelset_validate(labelset, labelset_len)
//               todo buffer_add
//               todo if (!point_isreduced(eddsa_25519_pubkey_bytes))
//               todo if (!sc_isreduced(s_scalar))

    /* B: base point 
     * R: commitment (point), 
       r: private nonce (scalar)
       K: encoded public key
       k: private key (scalar)
       Z: 32-bytes random
       M: buffer containing message, message starts at M_start, continues for M_len
       r = hash(B || labelset || Z || pad1 || k || pad2 || labelset || K || extra || M) (mod q)
    */
    int generalized_commit(Sha512 sha512provider, byte[] R_bytes, byte[] r_scalar,
            byte[] labelset, int labelset_len,
            byte[] extra, int extra_len,
            byte[] K_bytes, byte[] k_scalar, 
            byte[] Z, byte[] M_buf, int M_start, int M_len)
    {
        ge_p3 R_point;
        byte[] hash = new byte[32];
        byte[] bufstart = null;
        byte[] bufptr = null;
        byte[] bufend = null;
        int prefix_len = 0;

//       todo if (labelset_validate(labelset, labelset_len) != 0) return -1;
        if (R_bytes == null || r_scalar == null ||
                K_bytes == null || k_scalar == null ||
                Z == null || M_buf == null) return -1;
        if (extra == null && extra_len != 0) return -1;
        if (extra != null && extra_len == 0) return -1;
//       todo if (extra != null && labelset_is_empty(labelset, labelset_len)) return -1;
        if (HASHLEN != 64) return -1;

        prefix_len = 0;
        prefix_len += POINTLEN + labelset_len + RANDLEN;
        prefix_len += ((BLOCKLEN - (prefix_len % BLOCKLEN)) % BLOCKLEN);
        prefix_len += SCALARLEN;
        prefix_len += ((BLOCKLEN - (prefix_len % BLOCKLEN)) % BLOCKLEN);
        prefix_len += labelset_len + POINTLEN + extra_len;
        if (prefix_len > M_start) return -1;

        bufstart = M_buf + M_start - prefix_len;
        bufptr = bufstart;
        bufend = M_buf + M_start;
        bufptr = buffer_add(bufptr, bufend, B_bytes, POINTLEN);
        bufptr = buffer_add(bufptr, bufend, labelset, labelset_len);
        bufptr = buffer_add(bufptr, bufend, Z, RANDLEN);
        bufptr = buffer_pad(bufstart, bufptr, bufend);
        bufptr = buffer_add(bufptr, bufend, k_scalar, SCALARLEN);
        bufptr = buffer_pad(bufstart, bufptr, bufend);
        bufptr = buffer_add(bufptr, bufend, labelset, labelset_len);
        bufptr = buffer_add(bufptr, bufend, K_bytes, POINTLEN);
        bufptr = buffer_add(bufptr, bufend, extra, extra_len);
        if (bufptr != bufend || bufptr != M_buf + M_start || bufptr - bufstart != prefix_len) return -1;

        sha512provider.calculateDigest(hash, M_buf + M_start - prefix_len, prefix_len + M_len);
        sc_reduce.sc_reduce(hash);
        ge_scalarmult_base.ge_scalarmult_base(&R_point, hash);
        ge_p3_tobytes.ge_p3_tobytes(R_bytes, &R_point);
        System.arraycopy(hash, 0, r_scalar, 0, SCALARLEN);
        return 0;
    }

    /* if is_labelset_empty(labelset):
           return hash(R || K || M) (mod q)
       else:
           return hash(B || labelset || R || labelset || K || extra || M) (mod q)
    */
    int generalized_challenge(Sha512 sha512provider, byte[] h_scalar,
              byte[] labelset, int labelset_len,
              byte[] extra, int extra_len,
              byte[] R_bytes,
              byte[] K_bytes,
              byte[] M_buf, int M_start, int M_len)
    {
        byte[] hash = new byte[HASHLEN];
        byte[] bufstart = null;
        byte[] bufptr = null;
        byte[] bufend = null;
        int prefix_len = 0;

        if (h_scalar == null) return -1;
        h_scalar = new byte[SCALARLEN];

//       todo if (labelset_validate(labelset, labelset_len) != 0) return -1;
        if (R_bytes == null || K_bytes == null || M_buf == null) return -1;
        if (extra == null && extra_len != 0) return -1;
        if (extra != null && extra_len == 0) return -1;
//       todo if (extra != null && labelset_is_empty(labelset, labelset_len)) return -1;

        if (labelset_is_empty(labelset, labelset_len)) {
            if (2*POINTLEN > M_start) return -1;
            if (extra != null || extra_len != 0) return -1;
            System.arraycopy(R_bytes, 0, M_buf, M_start - (2*POINTLEN), POINTLEN);
            System.arraycopy(K_bytes, 0, M_buf, M_start - (1*POINTLEN), POINTLEN);
            prefix_len = 2*POINTLEN;
        } else {
            prefix_len = 3*POINTLEN + 2*labelset_len + extra_len;
            if (prefix_len > M_start) return -1;

            bufstart = M_buf + M_start - prefix_len;
            bufptr = bufstart;
            bufend = M_buf + M_start;
            bufptr = buffer_add(bufptr, bufend, B_bytes, POINTLEN);
            bufptr = buffer_add(bufptr, bufend, labelset, labelset_len);
            bufptr = buffer_add(bufptr, bufend, R_bytes, POINTLEN);
            bufptr = buffer_add(bufptr, bufend, labelset, labelset_len);
            bufptr = buffer_add(bufptr, bufend, K_bytes, POINTLEN);
            bufptr = buffer_add(bufptr, bufend, extra, extra_len);

            if (bufptr == null) return -1;
            if (bufptr != bufend || bufptr != M_buf + M_start || bufptr - bufstart != prefix_len) return -1;
        }

        sha512provider.calculateDigest(hash, M_buf + M_start - prefix_len, prefix_len + M_len);
        sc_reduce.sc_reduce(hash);
        System.arraycopy(hash, 0, h_scalar, 0, SCALARLEN);
        return 0;
    }

    /* return r + kh (mod q) */
    int generalized_prove(byte[] out_scalar,
    byte[] r_scalar, byte[] k_scalar, byte[] h_scalar)
    {
        sc_muladd.sc_muladd(out_scalar, h_scalar, k_scalar, r_scalar);
        return 0;
    }

    /* R = s*B - h*K */
    int generalized_solve_commitment(byte[] R_bytes_out, ge_p3 K_point_out,
                                 ge_p3 B_point, byte[] s_scalar,
                                 byte[] K_bytes, byte[] h_scalar)
    {

        ge_p3 Kneg_point;
        ge_p2 R_calc_point_p2;

        ge_p3 sB;
        ge_p3 hK;
        ge_p3 R_calc_point_p3;

        if (ge_frombytes.ge_frombytes_negate_vartime(Kneg_point, K_bytes) != 0) return -1;

        if (B_point == null) {
            ge_double_scalarmult.ge_double_scalarmult_vartime (R_calc_point_p2, h_scalar, Kneg_point, s_scalar);
            ge_tobytes.ge_tobytes(R_bytes_out, R_calc_point_p2);
        }
        else {
            // s * Bv
            ge_scalarmult.ge_scalarmult(sB, s_scalar, B_point);

            // h * -K
            ge_scalarmult.ge_scalarmult(hK, h_scalar, Kneg_point);

            // R = sB - hK
            ge_p3_add.ge_p3_add(&R_calc_point_p3, sB, hK);
            ge_p3_tobytes.ge_p3_tobytes(R_bytes_out, R_calc_point_p3);
        }

        if (K_point_out) {
            ge_neg.ge_neg(K_point_out, &Kneg_point);
        }

        return 0;
    }

    static int generalized_calculate_Bv(ge_p3 Bv_point,
                              byte[] labelset, int labelset_len,
                              byte[] K_bytes,
                                        byte[] M_buf, int M_start, int M_len)
    {
        byte[] bufptr;
        int prefix_len = 0;

        if (labelset_validate(labelset, labelset_len) != 0)
            return -1;
        if (Bv_point == null || K_bytes == null || M_buf == null)
            return -1;

        prefix_len = 2*POINTLEN + labelset_len;
        if (prefix_len > M_start)
            return -1;

        bufptr = M_buf + M_start - prefix_len;
        bufptr = buffer_add(bufptr, M_buf + M_start, B_bytes, POINTLEN);
        bufptr = buffer_add(bufptr, M_buf + M_start, labelset, labelset_len);
        bufptr = buffer_add(bufptr, M_buf + M_start, K_bytes, POINTLEN);
        if (bufptr == null || bufptr != M_buf + M_start)
            return -1;

        hash_to_point(Bv_point, M_buf + M_start - prefix_len, prefix_len + M_len);
        if (ge_isneutral(Bv_point))
            return -1;
        return 0;
    }

    static int generalized_calculate_vrf_output(byte[] vrf_output,
                                     byte[] labelset, long labelset_len,
                                     const ge_p3* cKv_point)
    {
        byte[] buf[BUFLEN];
        byte[] bufptr = buf;
        byte[] bufend = buf + BUFLEN;
        byte[] cKv_bytes[POINTLEN];
        byte[] hash[HASHLEN];

        if (vrf_output == null)
            return -1;
        memset(vrf_output, 0, VRFOUTPUTLEN);

        if (labelset_len + 2*POINTLEN > BUFLEN)
            return -1;
        if (labelset_validate(labelset, labelset_len) != 0)
            return -1;
        if (cKv_point == null)
            return -1;
        if (VRFOUTPUTLEN > HASHLEN)
            return -1;

        ge_p3_tobytes(cKv_bytes, cKv_point);

        bufptr = buffer_add(bufptr, bufend, B_bytes, POINTLEN);
        bufptr = buffer_add(bufptr, bufend, labelset, labelset_len);
        bufptr = buffer_add(bufptr, bufend, cKv_bytes, POINTLEN);
        if (bufptr == null)
            return -1;
        if (bufptr - buf > BUFLEN)
            return -1;
        crypto_hash_sha512(hash, buf, bufptr - buf);
        memcpy(vrf_output, hash, VRFOUTPUTLEN);
        return 0;
    }

    int generalized_veddsa_25519_sign(
            byte[] signature_out,
                  byte[] eddsa_25519_pubkey_bytes,
                  byte[] eddsa_25519_privkey_scalar,
                  byte[] msg,
                  long msg_len,
                  byte[] random,
                  byte[] customization_label,
                  long customization_label_len)
    {
        byte[] labelset[LABELSETMAXLEN];
        int labelset_len = 0;
        ge_p3 Bv_point;
        ge_p3 Kv_point;
        ge_p3 Rv_point;
        byte[] Bv_bytes[POINTLEN];
        byte[] Kv_bytes[POINTLEN];
        byte[] Rv_bytes[POINTLEN];
        byte[] R_bytes[POINTLEN];
        byte[] r_scalar[SCALARLEN];
        byte[] h_scalar[SCALARLEN];
        byte[] s_scalar[SCALARLEN];
        byte[] extra[3*POINTLEN];
        byte[] M_buf = null;
        char* protocol_name = "VEdDSA_25519_SHA512_Elligator2";

        if (signature_out == null) return -1;
        memset(signature_out, 0, VRFSIGNATURELEN);

        if (eddsa_25519_pubkey_bytes == null) return -1;
        if (eddsa_25519_privkey_scalar == null) return -1;
        if (msg == null) return -1;
        if (customization_label == null && customization_label_len != 0) return -1;
        if (customization_label_len > LABELMAXLEN) return -1;
        if (msg_len > MSGMAXLEN) return -1;

        if ((M_buf = malloc(msg_len + MSTART)) == 0) { 
            return -1;
        }
        memcpy(M_buf + MSTART, msg, msg_len);

        //  labelset = new_labelset(protocol_name, customization_label)
        if (labelset_new(labelset, &labelset_len, LABELSETMAXLEN,
            protocol_name, strlen(protocol_name),
            customization_label, customization_label_len) != 0) return -1;

        //  labelset1 = add_label(labels, "1")
        //  Bv = hash(hash(labelset1 || K) || M)
        //  Kv = k * Bv
        labelset_add(labelset, &labelset_len, LABELSETMAXLEN, "1", 1);
        if (generalized_calculate_Bv(&Bv_point, labelset, labelset_len,
            eddsa_25519_pubkey_bytes, M_buf, MSTART, msg_len) != 0) return -1;
        ge_scalarmult(&Kv_point, eddsa_25519_privkey_scalar, &Bv_point);
        ge_p3_tobytes(Bv_bytes, &Bv_point);
        ge_p3_tobytes(Kv_bytes, &Kv_point);

        //  labelset2 = add_label(labels, "2")
        //  R, r = commit(labelset2, (Bv || Kv), (K,k), Z, M)
        labelset[labelset_len-1] = '2';
        memcpy(extra, Bv_bytes, POINTLEN);
        memcpy(extra + POINTLEN, Kv_bytes, POINTLEN);
        if (generalized_commit(R_bytes, r_scalar,
                labelset, labelset_len,
                extra, 2*POINTLEN,
                eddsa_25519_pubkey_bytes, eddsa_25519_privkey_scalar,
                random, M_buf, MSTART, msg_len) != 0) return -1;

        //  Rv = r * Bv
        ge_scalarmult(&Rv_point, r_scalar, &Bv_point);
        ge_p3_tobytes(Rv_bytes, &Rv_point);

        //  labelset3 = add_label(labels, "3")
        //  h = challenge(labelset3, (Bv || Kv || Rv), R, K, M)
        labelset[labelset_len-1] = '3';
        memcpy(extra + 2*POINTLEN, Rv_bytes, POINTLEN);
        if (generalized_challenge(h_scalar,
                labelset, labelset_len,
                extra, 3*POINTLEN,
                R_bytes, eddsa_25519_pubkey_bytes,
                M_buf, MSTART, msg_len) != 0) return -1;

        //  s = prove(r, k, h)
        if (generalized_prove(s_scalar, r_scalar, eddsa_25519_privkey_scalar, h_scalar) != 0) return -1;

        //  return (Kv || h || s)
        memcpy(signature_out, Kv_bytes, POINTLEN);
        memcpy(signature_out + POINTLEN, h_scalar, SCALARLEN);
        memcpy(signature_out + POINTLEN + SCALARLEN, s_scalar, SCALARLEN);

        zeroize(r_scalar, SCALARLEN);
        zeroize_stack();
        free(M_buf);
        return 0;

        err:
        zeroize(r_scalar, SCALARLEN);
        zeroize_stack();
        free(M_buf);
        return -1;
    }

    int generalized_veddsa_25519_verify(
            byte[] vrf_out,
                  byte[] signature,
                  byte[] eddsa_25519_pubkey_bytes,
                  byte[] msg,
                  long msg_len,
                  byte[] customization_label,
                  long customization_label_len)
    {
        byte[] labelset[LABELSETMAXLEN];
        int labelset_len = 0;
        byte[] Kv_bytes;
        byte[] h_scalar;
        byte[] s_scalar;
        ge_p3 Bv_point, K_point, Kv_point, cK_point, cKv_point;
        byte[] Bv_bytes[POINTLEN];
        byte[] R_calc_bytes[POINTLEN];
        byte[] Rv_calc_bytes[POINTLEN];
        byte[] h_calc_scalar[SCALARLEN];
        byte[] extra[3*POINTLEN];
        byte[] M_buf = null;
        String protocol_name = "VEdDSA_25519_SHA512_Elligator2";

        if (vrf_out == null) return -1;
        memset(vrf_out, 0, VRFOUTPUTLEN);

        if (signature == null) return -1;
        if (eddsa_25519_pubkey_bytes == null) return -1;
        if (msg == null) return -1;
        if (customization_label == null && customization_label_len != 0) return -1;
        if (customization_label_len > LABELMAXLEN) return -1;
        if (msg_len > MSGMAXLEN) return -1;

        if ((M_buf = malloc(msg_len + MSTART)) == 0) { return -1;
        }
        memcpy(M_buf + MSTART, msg, msg_len);

        Kv_bytes = signature;
        h_scalar = signature + POINTLEN;
        s_scalar = signature + POINTLEN + SCALARLEN;

        if (!point_isreduced(eddsa_25519_pubkey_bytes)) return -1;
        if (!point_isreduced(Kv_bytes)) return -1;
        if (!sc_isreduced(h_scalar)) return -1;
        if (!sc_isreduced(s_scalar)) return -1;

        //  labelset = new_labelset(protocol_name, customization_label)
        if (labelset_new(labelset, &labelset_len, LABELSETMAXLEN,
            protocol_name, strlen(protocol_name),
            customization_label, customization_label_len) != 0) return -1;

        //  labelset1 = add_label(labels, "1")
        //  Bv = hash(hash(labelset1 || K) || M)
        labelset_add(labelset, &labelset_len, LABELSETMAXLEN, "1", 1);
        if (generalized_calculate_Bv(&Bv_point, labelset, labelset_len,
            eddsa_25519_pubkey_bytes, M_buf, MSTART, msg_len) != 0) return -1;
        ge_p3_tobytes(Bv_bytes, &Bv_point);

        //  R = solve_commitment(B, s, K, h)
        if (generalized_solve_commitment(R_calc_bytes, &K_point, null,
            s_scalar, eddsa_25519_pubkey_bytes, h_scalar) != 0) return -1;

        //  Rv = solve_commitment(Bv, s, Kv, h)
        if (generalized_solve_commitment(Rv_calc_bytes, &Kv_point, &Bv_point,
            s_scalar, Kv_bytes, h_scalar) != 0) return -1;

        ge_scalarmult_cofactor.ge_scalarmult_cofactor(&cK_point, &K_point);
        ge_scalarmult_cofactor.ge_scalarmult_cofactor(&cKv_point, &Kv_point);
        if (ge_isneutral(&cK_point) || ge_isneutral(&cKv_point) || ge_isneutral(&Bv_point)) return -1;

        //  labelset3 = add_label(labels, "3")
        //  h = challenge(labelset3, (Bv || Kv || Rv), R, K, M)
        labelset[labelset_len-1] = '3';
        memcpy(extra, Bv_bytes, POINTLEN);
        memcpy(extra + POINTLEN, Kv_bytes, POINTLEN);
        memcpy(extra + 2*POINTLEN, Rv_calc_bytes, POINTLEN);
        if (generalized_challenge(h_calc_scalar,
                labelset, labelset_len,
                extra, 3*POINTLEN,
                R_calc_bytes, eddsa_25519_pubkey_bytes,
                M_buf, MSTART, msg_len) != 0) return -1;

        // if bytes_equal(h, h')
        if (crypto_verify_32(h_scalar, h_calc_scalar) != 0) return -1;

        //  labelset4 = add_label(labels, "4")
        //  v = hash(labelset4 || c*Kv)
        labelset[labelset_len-1] = '4';
        if (generalized_calculate_vrf_output(vrf_out, labelset, labelset_len, &cKv_point) != 0) return -1;

        return 0;
    }
}
