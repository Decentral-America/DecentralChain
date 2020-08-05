package im.mak.waves.crypto;

import im.mak.waves.crypto.base.Base58;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@SuppressWarnings("FieldCanBeLocal")
class TestCrypto {

    private final String seedPhrase = "blame vacant regret company chase trip grant funny brisk innocent";
    private final byte[] expectedAccountSeed = Base58.decode("BNCgay7gxfeBZ82RfqDRGf5UdyDNU3RUfDKXJtJ2Pr33");
    private final byte[] expectedAccountSeedMinNonce = Base58.decode("GngBkRcUfwkPABwPFQrvNGupEzwvphkQ8oBqbCuPauJa");
    private final byte[] expectedAccountSeedMaxNonce = Base58.decode("AkrbNh7X6yAt95mFeKsETkJcvX5Fg8JsDZDHTf8UpyR9");
    private final byte[] expectedPrivateKey = Base58.decode("3j2aMHzh9azPphzuW7aF3cmUefGEQC9dcWYXYCyoPcJg");
    private final byte[] expectedPublicKey = Base58.decode("8cj6YzvQPhSHGvnjupNTW8zrADTT8CMAAd2xTuej84gB");
    private final byte[] expectedAddress = Base58.decode("3Ms87NGAAaPWZux233TB9A3TXps4LDkyJWN");
    private final byte chainId = 'T';

    @Test
    void seedAndKeys() {
        byte[] accountSeed = Crypto.getAccountSeed(seedPhrase);
        byte[] privateKey = Crypto.getPrivateKey(accountSeed);
        byte[] publicKey = Crypto.getPublicKey(privateKey);
        byte[] publicKeyHash = Crypto.getPublicKeyHash(publicKey);
        byte[] address = Crypto.getAddress(chainId, publicKeyHash);

        assertThat(accountSeed).isEqualTo(expectedAccountSeed);
        assertThat(Crypto.getAccountSeed(seedPhrase, Integer.MIN_VALUE))
                .isEqualTo(expectedAccountSeedMinNonce);
        assertThat(Crypto.getAccountSeed(seedPhrase, Integer.MAX_VALUE))
                .isEqualTo(expectedAccountSeedMaxNonce);

        assertThat(privateKey).isEqualTo(expectedPrivateKey);
        assertThat(publicKey).isEqualTo(expectedPublicKey);
        assertThat(address).isEqualTo(expectedAddress);
    }

}
