package im.mak.waves.crypto;

import im.mak.waves.crypto.account.Address;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.crypto.account.Seed;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

@SuppressWarnings("FieldCanBeLocal")
class TestSeedAndKeys {

    private final String phrase = "blame vacant regret company chase trip grant funny brisk innocent";
    private final String privateKey = "3j2aMHzh9azPphzuW7aF3cmUefGEQC9dcWYXYCyoPcJg";
    private final String publicKey = "8cj6YzvQPhSHGvnjupNTW8zrADTT8CMAAd2xTuej84gB";
    private final String address = "3Ms87NGAAaPWZux233TB9A3TXps4LDkyJWN";
    private final byte chainId = ChainId.TESTNET;

    @Test
    void seedAndKeys() {
        Seed seed = new Seed(phrase);

        assertThat(seed.phrase()).isEqualTo(phrase);
        assertThat(seed.nonce()).isEqualTo(0);
        assertThat(seed.privateKey().toString()).isEqualTo(privateKey);
        assertThat(seed.publicKey().toString()).isEqualTo(publicKey);
        assertThat(seed.privateKey().address(chainId).toString()).isEqualTo(address);
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
