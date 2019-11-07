package im.mak.waves.crypto;

import im.mak.waves.crypto.account.Seed;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@SuppressWarnings("FieldCanBeLocal")
class TestSeedAndKeys {

    private String phrase = "blame vacant regret company chase trip grant funny brisk innocent";
    private String privateKey = "3j2aMHzh9azPphzuW7aF3cmUefGEQC9dcWYXYCyoPcJg";
    private String publicKey = "8cj6YzvQPhSHGvnjupNTW8zrADTT8CMAAd2xTuej84gB";
    private String address = "3Ms87NGAAaPWZux233TB9A3TXps4LDkyJWN";

    @Test
    void seedAndKeys() {
        Seed seed = new Seed(phrase);

        assertThat(seed.phrase()).isEqualTo(phrase);
        assertThat(seed.nonce()).isEqualTo(0);
        assertThat(seed.privateKey().toString()).isEqualTo(privateKey);
        assertThat(seed.publicKey().toString()).isEqualTo(publicKey);
        assertThat(seed.privateKey().address(ChainId.TESTNET).toString()).isEqualTo(address);
    }

}
