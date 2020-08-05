package im.mak.waves.crypto;

import im.mak.waves.crypto.base.Base64;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@SuppressWarnings("FieldCanBeLocal")
class TestBase64 {

    private byte[] source = "1, two, 𩸽 ?!&".getBytes();
    private String expected = "MSwgdHdvLCDwqbi9ID8hJg";
    private String withPrefix = "base64:MSwgdHdvLCDwqbi9ID8hJg";
    private String withTail = "MSwgdHdvLCDwqbi9ID8hJg==";
    private String withPrefixAndTail = "base64:MSwgdHdvLCDwqbi9ID8hJg==";

    @Test
    void encode() {
        assertThat(Base64.encode(source)).isEqualTo(withTail);
    }

    @Test
    void decode() {
        assertThat(Base64.decode(expected)).isEqualTo(source);
    }

    @Test
    void optionalPrefixAndTail() {
        assertThat(Base64.decode(withPrefix)).isEqualTo(source);
        assertThat(Base64.decode(withTail)).isEqualTo(source);
        assertThat(Base64.decode(withPrefixAndTail)).isEqualTo(source);
    }

    @Test
    void empty() {
        assertThat(Base64.encode(Bytes.empty())).isEqualTo("");
        assertThat(Base64.decode("")).isEqualTo(Bytes.empty());
    }

}
