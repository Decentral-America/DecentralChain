package com.wavesplatform.crypto.base;

/**
 * Base16 is used to represent byte arrays as a readable string.
 *
 * Not used in Waves blockchain, but can be used in Ride smart contracts.
 */
public abstract class Base16 {

    /**
     * Encodes the given bytes as a base16 string (no checksum is appended).
     *
     * @param source the bytes to encode
     * @param withPrefix if true, return encoded string with prefix "base16:"
     * @return the base16-encoded string
     */
    public static String encode(byte[] source, boolean withPrefix) {
        byte[] input = source.clone();
        StringBuilder sb = new StringBuilder();
        for (byte b : input)
            sb.append(String.format("%02x", b));

        String prefix = withPrefix ? "base16:" : "";
        return prefix + sb.toString();
    }

    /**
     * Encodes the given bytes as a base16 string (no checksum is appended).
     *
     * @param source the bytes to encode
     * @return the base16-encoded string
     */
    public static String encode(byte[] source) {
        return encode(source, false);
    }

    /**
     * Decodes the given base16 string into the original data bytes.
     *
     * @param encodedString the base16-encoded string to decode
     * @return the decoded data bytes
     * @throws IllegalArgumentException if the string is null or can't be parsed as base16 string
     */
    public static byte[] decode(String encodedString) throws IllegalArgumentException {
        if (encodedString == null) throw new IllegalArgumentException("Base16 string can't be null");
        if (encodedString.startsWith("base16:")) encodedString = encodedString.substring(7);
        if (encodedString.length() % 2 == 1)
            throw new IllegalArgumentException("Invalid base16 string \"" + encodedString + "\"");

        byte[] bytes = new byte[encodedString.length() / 2];
        for (int i = 0; i < encodedString.length(); i += 2)
            bytes[i / 2] = hexToByte(encodedString.substring(i, i + 2));

        return bytes;
    }

    private static byte hexToByte(String hexString) {
        int firstDigit = toDigit(hexString.charAt(0));
        int secondDigit = toDigit(hexString.charAt(1));
        return (byte) ((firstDigit << 4) + secondDigit);
    }

    private static int toDigit(char hexChar) {
        int digit = Character.digit(hexChar, 16);
        if (digit == -1)
            throw new IllegalArgumentException("Invalid hexadecimal character \"" + hexChar + "\"");
        return digit;
    }

}
