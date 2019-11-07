package im.mak.waves.crypto;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TestBytes {

    @Test
    void concat() {
        assertThat(Bytes.concat(new byte[]{1, 2}, new byte[]{3, 4})).isEqualTo(new byte[]{1, 2, 3, 4});
        assertThat(Bytes.concat(new byte[]{1, 2}, new byte[]{3, 4})).isNotEqualTo(new byte[]{3, 4, 1, 2});
    }

    @Test
    void empty() {
        assertThat(Bytes.empty()).isEqualTo(new byte[0]);

        assertThat(Bytes.empty(new byte[0])).isTrue();
        assertThat(Bytes.empty(new byte[0], new byte[0], new byte[0])).isTrue();

        assertThat(Bytes.empty(new byte[]{0}, new byte[0], new byte[0])).isFalse();
        assertThat(Bytes.empty(new byte[0], new byte[]{0}, new byte[0])).isFalse();
        assertThat(Bytes.empty(new byte[0], new byte[0], new byte[]{0})).isFalse();
    }

    @Test
    void chunk() {
        byte[] bytes = new byte[]{0, 1, 2, 3, 4, 5, 6, 7, 8, 9};

        assertThat(Bytes.chunk(bytes)).isEqualTo(new byte[][]{bytes});
        assertThat(Bytes.chunk(bytes, 0)).isEqualTo(new byte[][]{new byte[0], bytes});

        assertThat(Bytes.chunk(bytes, 1))
                .isEqualTo(new byte[][]{new byte[]{0}, new byte[]{1, 2, 3, 4, 5, 6, 7, 8, 9}});
        assertThat(Bytes.chunk(bytes, 2))
                .isEqualTo(new byte[][]{new byte[]{0, 1}, new byte[]{2, 3, 4, 5, 6, 7, 8, 9}});
        assertThat(Bytes.chunk(bytes, 10))
                .isEqualTo(new byte[][]{new byte[]{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}});
        assertThat(Bytes.chunk(bytes, 1, 2, 3, 4))
                .isEqualTo(new byte[][]{new byte[]{0}, new byte[]{1, 2}, new byte[]{3, 4, 5}, new byte[]{6, 7, 8, 9}});

        assertThat(Bytes.chunk(bytes, 1, 6, 2))
                .isEqualTo(new byte[][]{new byte[]{0}, new byte[]{1, 2, 3, 4, 5, 6}, new byte[]{7, 8}, new byte[]{9}});

        assertThrows(IllegalArgumentException.class, () -> Bytes.chunk(bytes, 2, -1, 0));
        assertThrows(IllegalArgumentException.class, () -> Bytes.chunk(bytes, 2, 9, 0));
    }

    @Test
    void equal() {
        byte[] bytes = new byte[]{0, 1, 2};
        byte[] bytes2 = new byte[]{0, 1, 2};
        byte[] bytes3 = new byte[]{2, 1, 0};

        assertThat(Bytes.equal()).isTrue();
        assertThat(Bytes.equal(Bytes.empty())).isTrue();

        assertThat(Bytes.equal(bytes, bytes.clone(), bytes2)).isTrue();

        assertThat(Bytes.equal(bytes, bytes3)).isFalse();
    }

}
