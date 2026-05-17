package com.wavesplatform.wavesj.util;

import com.wavesplatform.crypto.Hash;
import com.wavesplatform.crypto.base.Base58;

import java.nio.charset.StandardCharsets;

public final class HashUtil {

    private HashUtil() {}

    public static String fastHash(String message) {
        byte[] blake = Hash.blake(message.getBytes(StandardCharsets.UTF_8));
        return Base58.encode(blake);
    }

    public static String secureHash(String message) {
        byte[] keccak = Hash.keccak(Hash.blake(message.getBytes(StandardCharsets.UTF_8)));
        return Base58.encode(keccak);
    }
}
