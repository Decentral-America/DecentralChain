package com.wavesplatform.transactions;

import com.wavesplatform.crypto.base.Base64;
import com.wavesplatform.transactions.account.Address;
import com.wavesplatform.transactions.account.PublicKey;
import com.wavesplatform.transactions.common.Amount;
import com.wavesplatform.transactions.common.AssetId;
import com.wavesplatform.transactions.common.ChainId;
import com.wavesplatform.transactions.invocation.*;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.web3j.crypto.Credentials;
import org.web3j.utils.Numeric;

import java.util.Collections;
import java.util.stream.Stream;

import static com.wavesplatform.transactions.EthereumTransaction.DEFAULT_GAS_PRICE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.params.provider.Arguments.arguments;

public class EthereumTransactionTest {

    private final String mnemonic = "shrug target screen enemy endorse chef term october blast rate fog runway";

    static Stream<Arguments> transfers() {
        return Stream.of(
                arguments(
                        Amount.of(5_000000L, AssetId.as("5EiF5XiRVCUNW5M3dKXwCeMxem7YZHCDYgCwAtgpXHGT")),
                        Address.as("3FnTLD1F3auKYaujGRz3aPjvfe1aCzo51tH"),
                        Base64.decode("+LGGAX1M2DddhQJUC+QAgwGGoJQ+8e54O40vbomsPyIHXxrj+l9GCoC4RKkFnLsAAAAAAAAAAAAAAAAGrOsKi8D4YuM9uGbck2LN25yLYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATEtAga6g1w4cc7OlDIkFhvliO1lQlS9uDHOBbegPbqAUIK58ptagKe835GYPgw1JBnmDVTgIn7T1FxAjOj5kTIIFzsuNcEc="),
                        1637671778141L,
                        10_0000L,
                        1
                )
        );
    }

    @ParameterizedTest(name = "{index}: {0}")
    @MethodSource("transfers")
    void transferTests(
            Amount transferAmount,
            Address recipient,
            byte[] expectedTxBytes,
            long timestamp,
            long fee,
            int index) {
        Credentials credentials = MetamaskHelper.generateCredentials(MNEMONIC, index);
        EthereumTransaction transferTransaction = EthereumTransaction.transfer(recipient, transferAmount, EthereumTransaction.DEFAULT_GAS_PRICE,
                (byte) 'E', fee, timestamp, credentials.getEcKeyPair());

        assertThat(transferTransaction.toBytes()).isEqualTo(expectedTxBytes);
    }

    private static final String MNEMONIC = "river denial defense vintage umbrella upon lumber bleak wave wasp demise behind";

    static Stream<Arguments> transferSigning() {
        return Stream.of(
                arguments(
                        (byte) 'E',
                        0,
                        "0xbb2ed0C3435dc6B80eD364f569E741e5Cd782995",
                        Amount.of(15_00000000L)
                ),
                arguments(
                        (byte) 'C',
                        1,
                        "0xcd770D905e3DA77EcA631459b5782F276cEea9e6",
                        Amount.of(2000, AssetId.as("DG2xFkPdDwKUoBkzGAhQtLpSGzfXLiCYPEzeKH2Ad24p"))
                )
        );
    }

    @ParameterizedTest
    @MethodSource("transferSigning")
    void testTransferSigning(byte chainId, int index, String expectedEthereumAddress, Amount amount) {
        Credentials credentials = MetamaskHelper.generateCredentials(MNEMONIC, index);

        assertThat(credentials.getAddress()).isEqualToIgnoringCase(expectedEthereumAddress);
        Address expectedWavesSenderAddress = Address.fromPart(chainId, Numeric.hexStringToByteArray(expectedEthereumAddress));

        EthereumTransaction transfer = EthereumTransaction.transfer(
                Address.fromPart(chainId, new byte[20]),
                amount,
                EthereumTransaction.DEFAULT_GAS_PRICE,
                chainId,
                100000L,
                System.currentTimeMillis(),
                credentials.getEcKeyPair()
        );

        assertThat(transfer.sender().address(chainId)).isEqualTo(expectedWavesSenderAddress);
    }

    @Test
    void testAssetTransfer() {
        Credentials credentials = MetamaskHelper.generateCredentials(MNEMONIC, 1);
        Address recipient = Address.as("3FnTLD1F3auKYaujGRz3aPjvfe1aCzo51tH");
        Amount amount = Amount.of(5000000, AssetId.as("5EiF5XiRVCUNW5M3dKXwCeMxem7YZHCDYgCwAtgpXHGT"));
        EthereumTransaction transferTransaction = EthereumTransaction.transfer(recipient, amount, EthereumTransaction.DEFAULT_GAS_PRICE,
                (byte) 'E', 100000L, 1637671778141L, credentials.getEcKeyPair());


        assertThat(transferTransaction.sender()).isEqualTo(PublicKey.as("2PnpKcsAxDBRsbD9JWvTBxGawftTe9XGUD8KneT97JcMbKQ156wK9sJwU44z71kU2rSM8rcuh99W6SRKQFSsCFvT"));

        assertThat(transferTransaction.toBytes()).isEqualTo(Numeric.hexStringToByteArray("0xf8b186017d4cd8375d8502540be400830186a0943ef1ee783b8d2f6e89ac3f22075f1ae3fa5f460a80b844a9059cbb00000000000000000000000006aceb0a8bc0f862e33db866dc9362cddb9c8b6000000000000000000000000000000000000000000000000000000000004c4b4081aea0d70e1c73b3a50c890586f9623b5950952f6e0c73816de80f6ea01420ae7ca6d6a029ef37e4660f830d490679835538089fb4f51710233a3e644c8205cecb8d7047"));
    }


    @Test
    void testInvocation() {
        EthereumTransaction.Invocation inv = new EthereumTransaction.Invocation(
                Address.fromPart((byte) 'E', new byte[20]),
                new Function("testFunction",
                        StringArg.as("foobar"),
                        BooleanArg.as(true),
                        IntegerArg.as(System.currentTimeMillis())
                ),
                Collections.singletonList(Amount.of(100L))
        );
    }

    @Test
    void testTransferToRawString() {
        Credentials bob = MetamaskHelper.generateCredentials(mnemonic);

        EthereumTransaction transferTx = EthereumTransaction.createAndSign(
                new EthereumTransaction.Transfer(
                        new Address("3MoutSX6D5U8F8LD8GetA1b7o5SZNANpamk"),
                        new Amount(1000, AssetId.WAVES)
                ),
                DEFAULT_GAS_PRICE,
                ChainId.STAGENET,
                100000L,
                1655401118690L,
                bob.getEcKeyPair()
        );

        Assertions.assertEquals(rawTransfer, transferTx.toRawHexString());
    }

    @Test
    void testInvocationToRawString() {
        Credentials bob = MetamaskHelper.generateCredentials(mnemonic);

        EthereumTransaction ethInvokeTx = EthereumTransaction.createAndSign(
                new EthereumTransaction.Invocation(
                        new Address("3MmaePEwdwKpJAnNWki8rbYnusd6BXxxpFH"),
                        Function.as("call",
                                BinaryArg.as(new Address("3MiKAyPxv5ccsFToCQiazxvBn4SMxECaFkU").bytes()),
                                BooleanArg.as(true),
                                IntegerArg.as(100500),
                                StringArg.as(new Address("3Mf1H7VDVv6c6ejcNEGJim1nC4wmfK6165b").toString()),
                                ListArg.as(IntegerArg.as(100500))
                        ),
                        Collections.emptyList()
                ),
                DEFAULT_GAS_PRICE,
                ChainId.STAGENET,
                100500000L,
                1655738927034L,
                bob.getEcKeyPair()
        );

        Assertions.assertEquals(rawInvocation, ethInvokeTx.toRawHexString());
    }

    @Test
    void testPublicKeyWithLeadingZeros() {
        final String pk = "1BCj4dedGD4DsN5GwkLUCYmGsPrMUfKsvwTqqKsD9apgqpcqRD1m47rqR5QqLmuu5PkCTDjGULDJSQTQZfYLyHd";
        final String txBytes = "0xf873860189d376da988502540be400830186a094b4a384b911b2b055f4f45fd69a4b06e9f6b9ab2d874" +
                "70de4df8200008081d1a085ccf91a21722978ad4ee0ed218f96281c2d2d10d9d5d1b0d52e2c49c106d83fa07e83b04b57b1d" +
                "a7822eaac0a7dac65debf33f74e600467f2e9dc1a4a13778781";
        final EthereumTransaction et = EthereumTransaction.parse(txBytes);

        Assertions.assertEquals(PublicKey.as(pk), et.sender());
    }

    private final String rawTransfer = "0xf8728601816d987be28502540be400830186a094fff689d6fea7aba445868536036452faf" +
            "366fee68609184e72a0008081c9a04d6024005e6eca364324cdd9b8018ad8c0d9d97ef34058cf1088367190e166d9a017c80004" +
            "614c38245351ede25d1447ee089a1a068d4d45d0c8b14b9b7c640e00";

    private final String rawInvocation = "0xf9023386018181bb07ba8502540be4008405fd822094e662a65945789501222" +
            "c67ec77d501408e5c96ca80b901c4453c90e400000000000000000000000000000000000000000000000000000000000" +
            "000c000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000" +
            "00000000000000000000000000000001889400000000000000000000000000000000000000000000000000000000000001" +
            "000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000" +
            "00000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000001a0153c" +
            "28d26c0b8f538eb9c520d3f26a436eda22ed42f2ecbae89000000000000000000000000000000000000000000000000000000" +
            "0000000000000000000023334d6631483756445676366336656a634e45474a696d316e4334776d664b36313635620000000000" +
            "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
            "000000000100000000000000000000000000000000000000000000000000000000000188940000000000000000000000000000" +
            "00000000000000000000000000000000000081caa0c664acaf8c5d94c6224d504e44f5fd3cdfa8bbdf23761986ee61a6d9dfb" +
            "ee9e6a06ad4bb6015f19215a776cd9465d11b3413e6d3c30f5b3158cc60e90f32112b8c";
}
