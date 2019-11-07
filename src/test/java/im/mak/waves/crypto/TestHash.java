package im.mak.waves.crypto;

import im.mak.waves.crypto.base.Base58;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TestHash {

    private byte[] source = "test".getBytes();

    @Test
    void sha256() {
        byte[] expectedSha = Base58.decode("Bjj4AWTNrjQVHqgWbP2XaxXz4DYH1WZMyERHxsad7b2w");
        assertThat(Hash.sha256(source)).isEqualTo(expectedSha);
    }

    @Test
    void blake() {
        byte[] expectedBlake = Base58.decode("As3ZuwnL9LpoW3wz8HoDpHtZqJ4dhPFFnv87GYrnCYKj");
        assertThat(Hash.blake(source)).isEqualTo(expectedBlake);
    }

    @Test
    void keccak() {
        byte[] expectedKeccak = Base58.decode("BWVZ4p6FrN75bTUkJAEEHPKPhQoYvg5zzdqDT2g9xQns");
        assertThat(Hash.keccak(source)).isEqualTo(expectedKeccak);
    }

    @Test
    void secureHash() {
        byte[] expectedSecure = Base58.decode("JDJkZrg24XwvBgBUi6PgpHzrAFgeefb7nU8LJPRR58ga");
        assertThat(Hash.secureHash(source)).isEqualTo(expectedSecure);
    }

    @Test
    void empty() {
        assertThat(Hash.sha256(Bytes.empty()))
                .isEqualTo(Base58.decode("GKot5hBsd81kMupNCXHaqbhv3huEbxAFMLnpcX2hniwn"));
        assertThat(Hash.blake(Bytes.empty()))
                .isEqualTo(Base58.decode("xyw95Bsby3s4mt6f4FmFDnFVpQBAeJxBFNGzu2cX4dM"));
        assertThat(Hash.keccak(Bytes.empty()))
                .isEqualTo(Base58.decode("EKDHSGbrGztomDfuiV4iqiZ6LschDJPsFiXjZ83f92Md"));
        assertThat(Hash.secureHash(Bytes.empty()))
                .isEqualTo(Base58.decode("DRtdYbxMg7YHw4acvDP6xQrvmsRAz3K7gSkH3xBJ5CTL"));
    }

}
