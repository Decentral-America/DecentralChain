package com.wavesplatform.crypto;

import com.wavesplatform.crypto.base.Base58;
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
    }

    @Test
    void decode() {
        assertThat(Base58.decode(expected)).isEqualTo(source);
        assertThat(Base58.encode(Base58.decode(withPrefix))).isEqualTo(expected);
    }

    @Test
    void empty() {
        assertThat(Base58.encode(new byte[]{})).isEqualTo("");
        assertThat(Base58.decode("")).isEqualTo(new byte[]{});
    }

    @Test
    void decodeInvalidString() {
        assertThrows(IllegalArgumentException.class, () -> Base58.decode(expected + "0"));
    }

}
