package im.mak.waves.transactions.account;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.transactions.WavesConfig;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@SuppressWarnings("FieldCanBeLocal")
class TestSeedAndKeys {

    private final String phrase = "blame vacant regret company chase trip grant funny brisk innocent";
    private final String privateKey = "3j2aMHzh9azPphzuW7aF3cmUefGEQC9dcWYXYCyoPcJg";
    private final String publicKey = "8cj6YzvQPhSHGvnjupNTW8zrADTT8CMAAd2xTuej84gB";
    private final String address = "3Ms87NGAAaPWZux233TB9A3TXps4LDkyJWN";
    private final byte chainId = 'T';

    @Test
    void seedAndKeys() {
        WavesConfig.chainId('T');
        PrivateKey pk = PrivateKey.fromSeed(Bytes.fromUtf8(phrase), 0);

        assertThat(pk.toString()).isEqualTo(privateKey);
        assertThat(pk.publicKey().toString()).isEqualTo(publicKey);
        assertThat(pk.address(chainId).toString()).isEqualTo(address);
        assertThat(pk.address().toString()).isEqualTo(address);
    }

    @Test
    void parseAddress() {
        assertThat(PublicKey.as(publicKey).address(chainId).bytes()).hasSize(26);

        Address addr = Address.as(address);
        assertThat(addr.bytes()).hasSize(26);

        byte[] newAddrBytes = Bytes.concat(
                Bytes.of(
                        (byte) 1,
                        addr.chainId()
                ),
                addr.publicKeyHash(),
                addr.checksum()
        );

        assertThat(newAddrBytes).hasSize(26);

        Address newAddr = Address.as(newAddrBytes);

        assertThat(newAddr).isEqualTo(addr);
    }

}
