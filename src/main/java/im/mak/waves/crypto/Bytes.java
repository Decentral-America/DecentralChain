package im.mak.waves.crypto;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * Contains static methods to work with byte arrays.
 */
@SuppressWarnings({"WeakerAccess", "unused"})
public abstract class Bytes {

    /**
     * Creates an empty byte array.
     *
     * @return new empty byte array
     */
    public static byte[] empty() {
        return new byte[0];
    }

    /**
     * Checks that all byte arrays are empty.
     *
     * @param arrays byte arrays
     * @return true if all the input arrays are empty
     */
    public static boolean empty(byte[]... arrays) {
        return Arrays.stream(arrays).allMatch(a -> a.length == 0);
    }

    /**
     * Checks that all byte arrays are equal.
     *
     * @param compared byte arrays
     * @return true if all the input arrays are equal
     */
    public static boolean equal(byte[]... compared) {
        return compared.length < 2 || Arrays.stream(compared).allMatch(a -> Arrays.equals(a, compared[0]));
    }

    /**
     * Converts integer number to 4-byte array.
     *
     * @param number integer number
     * @return 4-byte array
     */
    public static byte[] fromInt(int number) {
        ByteBuffer buffer = ByteBuffer.allocate(Integer.BYTES);
        buffer.putInt(number);
        return buffer.array();
    }

    /**
     * Converts long number to 8-byte array.
     *
     * @param number long number
     * @return 8-byte array
     */
    public static byte[] fromLong(long number) {
        ByteBuffer buffer = ByteBuffer.allocate(Long.BYTES);
        buffer.putLong(number);
        return buffer.array();
    }

    /**
     * Converts byte array to string with UTF-8 encoding.
     *
     * @param bytes byte array
     * @return string with UTF-8 encoding
     */
    public static String toUtf8(byte[] bytes) {
        return new String(bytes, StandardCharsets.UTF_8);
    }

    /**
     * Converts UTF-8 encoded string to byte array.
     *
     * @param string UTF-8 string
     * @return byte array
     * @throws IllegalArgumentException if string is null
     */
    public static byte[] fromUtf8(String string) throws IllegalArgumentException {
        if (string == null) throw new IllegalArgumentException("String can't be null");
        return string.getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Concatenates all the byte arrays into new one array.
     *
     * @param arrays byte arrays
     * @return array that consists of all bytes of input arrays
     */
    public static byte[] concat(final byte[]... arrays) {
        byte[] total = Bytes.empty();
        for (byte[] a : arrays) {
            byte[] joinedArray = Arrays.copyOf(total, total.length + a.length);
            System.arraycopy(a, 0, joinedArray, total.length, a.length);
            total = joinedArray;
        }
        return total;
    }

    /**
     * Splits byte array into multiple arrays of desired sizes.
     * If array length is greater than sum of desired chunks, it will return rest of the array as last additional chunk.
     *
     * @param source byte array
     * @param chunkSizes desired sizes of resulting byte arrays
     * @return parts of source array
     * @throws IllegalArgumentException if any chunk size is negative or source array is less than sum of desired chunks
     */
    public static byte[][] chunk(byte[] source, int... chunkSizes) throws IllegalArgumentException {
        if (chunkSizes.length == 0)
            return new byte[][]{source.clone()};
        if (Arrays.stream(chunkSizes).anyMatch(s -> s < 0))
            throw new IllegalArgumentException("Chunk size can't be negative");
        int chunksTotalSize = Arrays.stream(chunkSizes).sum();
        if (source.length < chunksTotalSize)
            throw new IllegalArgumentException("Array length can't be less than sum of desired chunks. "
                    + "Array length: " + source.length + ", chunks total length: " + chunksTotalSize);

        byte[][] result = new byte[source.length == chunksTotalSize ? chunkSizes.length : chunkSizes.length + 1][];
        int mark = 0;
        for (int i = 0; i < result.length; i++)
            if (i < chunkSizes.length) {
                result[i] = Arrays.copyOfRange(source, mark, mark + chunkSizes[i]);
                mark += chunkSizes[i];
            } else result[i] = Arrays.copyOfRange(source, mark, source.length);
        return result;
    }

}
