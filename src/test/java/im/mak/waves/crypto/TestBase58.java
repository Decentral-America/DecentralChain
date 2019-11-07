package im.mak.waves.crypto;

import im.mak.waves.crypto.base.Base58;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SuppressWarnings("FieldCanBeLocal")
class TestBase58 {

    private byte[] source = "1, two, 𩸽 ?!".getBytes();
    private String expected = "2NnpkkWj3UX8HwNvRUADE";
    private String withPrefix = "base58:2NnpkkWj3UX8HwNvRUADE";

    @Test
    void encode() {
        assertThat(Base58.encode(source)).isEqualTo(expected);
        assertThat(new Base58(source).encoded()).isEqualTo(expected);
    }

    @Test
    void decode() {
        assertThat(Base58.decode(expected)).isEqualTo(source);
        assertThat(new Base58(withPrefix).decoded()).isEqualTo(source);
    }

    @Test
    void empty() {
        assertThat(Base58.encode(new byte[]{})).isEqualTo("");
        assertThat(new Base58(new byte[]{}).encoded()).isEqualTo("");
        assertThat(Base58.decode("")).isEqualTo(new byte[]{});
        assertThat(new Base58("").decoded()).isEqualTo(new byte[]{});
    }

    @Test
    void decodeInvalidString() {
        assertThrows(IllegalArgumentException.class, () -> Base58.decode(expected + "0"));
        assertThrows(IllegalArgumentException.class, () -> new Base58(expected + "0").decoded());
    }

}
