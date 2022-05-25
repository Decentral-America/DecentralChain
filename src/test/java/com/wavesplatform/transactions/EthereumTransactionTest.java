package com.wavesplatform.transactions;

import com.wavesplatform.crypto.base.Base64;
import com.wavesplatform.transactions.account.Address;
import com.wavesplatform.transactions.account.PublicKey;
import com.wavesplatform.transactions.common.Amount;
import com.wavesplatform.transactions.common.AssetId;
import com.wavesplatform.transactions.invocation.BooleanArg;
import com.wavesplatform.transactions.invocation.Function;
import com.wavesplatform.transactions.invocation.IntegerArg;
import com.wavesplatform.transactions.invocation.StringArg;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.web3j.crypto.Credentials;
import org.web3j.utils.Numeric;

import java.util.Collections;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.params.provider.Arguments.arguments;

public class EthereumTransactionTest {
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
}
