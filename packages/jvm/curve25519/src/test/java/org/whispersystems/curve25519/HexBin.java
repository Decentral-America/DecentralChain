package org.whispersystems.curve25519;

import java.util.HexFormat;

public class HexBin {
    private static final HexFormat HEX = HexFormat.of();

    public static byte[] decode(String hexString) {
        return HEX.parseHex(hexString);
    }
}
