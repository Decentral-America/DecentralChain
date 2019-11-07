package im.mak.waves.crypto.base;

import java.util.Arrays;

/**
 * Base16 is used to represent byte arrays as a readable string.
 *
 * Not used in Waves blockchain, but can be used in Ride smart contracts.
 */
public class Base16 {

    /**
     * Encodes the given bytes as a base16 string (no checksum is appended).
     *
     * @param source the bytes to encode
     * @return the base16-encoded string
     */
    public static String encode(byte[] source) {
        return new Base16(source).encoded();
    }

    /**
     * Decodes the given base16 string into the original data bytes.
     *
     * @param encodedString the base16-encoded string to decode
     * @return the decoded data bytes
     * @throws IllegalArgumentException if the string is null or can't be parsed as base16 string
     */
    public static byte[] decode(String encodedString) throws IllegalArgumentException {
        return new Base16(encodedString).decoded();
    }

    private byte[] bytes;
    private String encoded;

    /**
     * Create Base16 from array of bytes.
     *
     * @param source the bytes to encode
     */
    public Base16(byte[] source) {
        byte[] input = source.clone();
        StringBuilder sb = new StringBuilder();
        for (byte b : input)
            sb.append(String.format("%02x", b));

        this.encoded = sb.toString();
        this.bytes = input;
    }

    /**
     * Create Base16 from base16-encoded string.
     *
     * @param encodedString base16-encoded string
     * @throws IllegalArgumentException if the string is null or can't be parsed as base16 string
     */
    public Base16(String encodedString) throws IllegalArgumentException {
        if (encodedString == null) throw new IllegalArgumentException("Base16 string can't be null");
        if (encodedString.startsWith("base16:")) encodedString = encodedString.substring(7);
        if (encodedString.length() % 2 == 1)
            throw new IllegalArgumentException("Invalid base16 string \"" + encodedString + "\"");

        byte[] bytes = new byte[encodedString.length() / 2];
        for (int i = 0; i < encodedString.length(); i += 2)
            bytes[i / 2] = hexToByte(encodedString.substring(i, i + 2));

        this.encoded = encodedString;
        this.bytes = bytes;
    }

    /**
     * Get encoded string of the bytes.
     *
     * @return base16-encoded string
     */
    public String encoded() {
        return this.encoded;
    }

    /**
     * Get original bytes.
     *
     * @return decoded array of bytes
     */
    public byte[] decoded() {
        return this.bytes.clone();
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Base16 base16 = (Base16) o;
        return Arrays.equals(bytes, base16.bytes);
    }

    @Override
    public int hashCode() {
        return Arrays.hashCode(bytes);
    }

    @Override
    public String toString() {
        return this.encoded();
    }

}
