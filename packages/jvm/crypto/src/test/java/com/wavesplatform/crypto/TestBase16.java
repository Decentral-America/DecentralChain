package com.wavesplatform.crypto;

import com.wavesplatform.crypto.base.Base16;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SuppressWarnings("FieldCanBeLocal")
class TestBase16 {

    private byte[] source = "1, two, 𩸽 ?!".getBytes();
    private String expected = "312c2074776f2c20f0a9b8bd203f21";
    private String withPrefix = "base16:312c2074776f2c20f0a9b8bd203f21";

    @Test
    void encode() {
        Assertions.assertThat(Base16.encode(source)).isEqualTo(expected);
    }

    @Test
    void decode() {
        assertThat(Base16.decode(expected)).isEqualTo(source);
        assertThat(Base16.decode(withPrefix)).isEqualTo(source);
    }

    @Test
    void empty() {
        assertThat(Base16.encode(new byte[]{})).isEqualTo("");
        assertThat(Base16.decode("")).isEqualTo(new byte[]{});
    }

    @Test
    void decodeInvalidString() {
        assertThrows(IllegalArgumentException.class, () -> Base16.decode(expected + "a"));
        assertThrows(IllegalArgumentException.class, () -> Base16.decode(expected + "gh"));
    }

}
