package im.mak.waves.transactions.common;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class ByteStringTest {

    Base58String base58Foo = new Base58String("foo".getBytes());
    Base58String base58Bar = new Base58String("bar".getBytes());
    Base64String base64Foo = new Base64String("foo".getBytes());
    Base64String base64Bar = new Base64String("bar".getBytes());

    @Test
    void base58EqualsBase64() {
        assertThat(base58Foo).isEqualTo(base64Foo);
        assertThat(base58Bar).isEqualTo(base64Bar);
    }
    
    @Test
    void base58ComparableWithBase64_differentValues() {
        assertThat(base58Foo).isNotEqualTo(base58Bar);
        assertThat(base64Foo).isNotEqualTo(base64Bar);
    }

    @Test
    void base58EqualsBase64_asByteString() {
        ByteString base58 = base58Foo;
        ByteString base64 = base64Foo;

        assertThat(base58.equals(base64)).isTrue();
    }

}
