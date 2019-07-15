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

        if (labelset_validate(labelset, labelset_len) != 0) return -1;
        if (R_bytes == null || r_scalar == null ||
                K_bytes == null || k_scalar == null ||
                Z == null || M_buf == null)
    return -1;
        if (extra == null && extra_len != 0)
    return -1;
        if (extra != null && extra_len == 0)
    return -1;
        if (extra != null && labelset_is_empty(labelset, labelset_len))
    return -1;
        if (HASHLEN != 64)
    return -1;

        prefix_len = 0;
        prefix_len += POINTLEN + labelset_len + RANDLEN;
        prefix_len += ((BLOCKLEN - (prefix_len % BLOCKLEN)) % BLOCKLEN);
        prefix_len += SCALARLEN;
        prefix_len += ((BLOCKLEN - (prefix_len % BLOCKLEN)) % BLOCKLEN);
        prefix_len += labelset_len + POINTLEN + extra_len;
        if (prefix_len > M_start)
    return -1;

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
        if (bufptr != bufend || bufptr != M_buf + M_start || bufptr - bufstart != prefix_len)
    return -1;

        sha512provider.calculateDigest(hash, M_buf + M_start - prefix_len, prefix_len + M_len);
        sc_reduce.sc_reduce(hash);
        ge_scalarmult_base(&R_point, hash);
        ge_p3_tobytes(R_bytes, &R_point);
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

        if (labelset_validate(labelset, labelset_len) != 0)
    return -1;
        if (R_bytes == null || K_bytes == null || M_buf == null)
    return -1;
        if (extra == null && extra_len != 0)
    return -1;
        if (extra != null && extra_len == 0)
    return -1;
        if (extra != null && labelset_is_empty(labelset, labelset_len))
    return -1;
        if (HASHLEN != 64)
    return -1;

        if (labelset_is_empty(labelset, labelset_len)) {
            if (2*POINTLEN > M_start)
      return -1;
            if (extra != null || extra_len != 0)
      return -1;
            System.arraycopy(R_bytes, 0, M_buf, M_start - (2*POINTLEN), POINTLEN);
            System.arraycopy(K_bytes, 0, M_buf, M_start - (1*POINTLEN), POINTLEN);
            prefix_len = 2*POINTLEN;
        } else {
            prefix_len = 3*POINTLEN + 2*labelset_len + extra_len;
            if (prefix_len > M_start)
      return -1;

            bufstart = M_buf + M_start - prefix_len;
            bufptr = bufstart;
            bufend = M_buf + M_start;
            bufptr = buffer_add(bufptr, bufend, B_bytes, POINTLEN);
            bufptr = buffer_add(bufptr, bufend, labelset, labelset_len);
            bufptr = buffer_add(bufptr, bufend, R_bytes, POINTLEN);
            bufptr = buffer_add(bufptr, bufend, labelset, labelset_len);
            bufptr = buffer_add(bufptr, bufend, K_bytes, POINTLEN);
            bufptr = buffer_add(bufptr, bufend, extra, extra_len);

            if (bufptr == null)
      return -1;
            if (bufptr != bufend || bufptr != M_buf + M_start || bufptr - bufstart != prefix_len)
      return -1;
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

        if (ge_frombytes.ge_frombytes_negate_vartime(Kneg_point, K_bytes) != 0)
        return -1;

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


    int generalized_eddsa_25519_sign(
                  byte[] signature_out,
                  byte[] eddsa_25519_pubkey_bytes,
                  byte[] eddsa_25519_privkey_scalar,
                  byte[] msg,
                  int msg_len,
                  byte[] random,
                  byte[] customization_label,
                  int customization_label_len)
    {
        byte[] labelset = new byte[LABELSETMAXLEN];
        int labelset_len = 0;
        byte[] R_bytes = new byte[POINTLEN];
        byte[] r_scalar = new byte[SCALARLEN];
        byte[] h_scalar = new byte[SCALARLEN];
        byte[] s_scalar = new byte[SCALARLEN];
        byte[] M_buf = new byte[msg_len + MSTART];

        if (signature_out == null) return -1;

        if (eddsa_25519_pubkey_bytes == null) return -1;
        if (eddsa_25519_privkey_scalar == null) return -1;
        if (msg == null) return -1;
        if (customization_label == null && customization_label_len != 0) return -1;
        if (customization_label_len > LABELMAXLEN) return -1;
        if (msg_len > MSGMAXLEN) return -1;
        System.arraycopy(msg, 0, M_buf, MSTART, msg_len);

        if (labelset_new(labelset, &labelset_len, LABELSETMAXLEN, null, 0,
            customization_label, customization_label_len) != 0) return -1;

        if (generalized_commit(R_bytes, r_scalar, labelset, labelset_len, null, 0,
                eddsa_25519_pubkey_bytes, eddsa_25519_privkey_scalar,
                random, M_buf, MSTART, msg_len) != 0) return -1;

        if (generalized_challenge(h_scalar, labelset, labelset_len, null, 0,
                R_bytes, eddsa_25519_pubkey_bytes, M_buf, MSTART, msg_len) != 0) return -1;

        if (generalized_prove(s_scalar, r_scalar, eddsa_25519_privkey_scalar, h_scalar) != 0) return -1;

        System.arraycopy(R_bytes, 0, signature_out, 0, POINTLEN);
        System.arraycopy(s_scalar, 0, signature_out, POINTLEN, SCALARLEN);

        return 0;
    }

    int generalized_eddsa_25519_verify(
                  byte[] signature,
                  byte[] eddsa_25519_pubkey_bytes,
                  byte[] msg,
                  int msg_len,
                  byte[] customization_label,
                  int customization_label_len)
    {
        byte[] labelset = new byte[LABELSETMAXLEN];
        int labelset_len = 0;
        byte[] R_bytes = null;
        byte[] s_scalar = null;
        byte[] h_scalar = new byte[SCALARLEN];
        byte[] M_buf = new byte[msg_len + MSTART];
        byte[] R_calc_bytes = new byte[POINTLEN];

        if (signature == null) return -1;
        if (eddsa_25519_pubkey_bytes == null) return -1;
        if (msg == null) return -1;
        if (customization_label == null && customization_label_len != 0) return -1;
        if (customization_label_len > LABELMAXLEN) return -1;
        if (msg_len > MSGMAXLEN) return -1;
        System.arraycopy(msg, 0, M_buf, MSTART, msg_len);

        if (labelset_new(labelset, &labelset_len, LABELSETMAXLEN, null, 0,
            customization_label, customization_label_len) != 0) return -1;

        R_bytes = signature;
        s_scalar = signature + POINTLEN;

        if (!point_isreduced(eddsa_25519_pubkey_bytes)) return -1;
        if (!point_isreduced(R_bytes)) return -1;
        if (!sc_isreduced(s_scalar)) return -1;

        if (generalized_challenge(h_scalar, labelset, labelset_len,
                null, 0, R_bytes, eddsa_25519_pubkey_bytes, M_buf, MSTART, msg_len) != 0) return -1;

        if (generalized_solve_commitment(R_calc_bytes, null, null,
                s_scalar, eddsa_25519_pubkey_bytes, h_scalar) != 0) return -1;

        if (crypto_verify_32.crypto_verify_32(R_bytes, R_calc_bytes) != 0) return -1;

        return 0;
    }

}
