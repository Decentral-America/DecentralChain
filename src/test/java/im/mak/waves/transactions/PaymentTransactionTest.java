package im.mak.waves.transactions;

import im.mak.waves.crypto.account.Address;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.crypto.base.Base64;
import im.mak.waves.transactions.common.*;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.util.stream.Stream;

import static im.mak.waves.transactions.serializers.JsonSerializer.JSON_MAPPER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.params.provider.Arguments.arguments;

public class PaymentTransactionTest {

    static PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
    static long timestamp = 1600000000000L;
    static long amount = Long.MAX_VALUE;
    static long fee = PaymentTransaction.MIN_FEE + 1;

    @BeforeAll
    static void beforeAll() {
        Waves.chainId = 'R';
    }

    static Stream<Arguments> transactionsProvider() {
        Address address = Address.from(sender, Waves.chainId);
        return Stream.of(
                arguments(address, Id.as("4M4f8fMmRZ7WtqnhuheADetknXwZnqyeiqtatS3EkjQKeXY5Pa3aVTBmPmAXUXrNsurz6PYyzVqzs5Kp4xjY74DB"),
                        Proof.as("4M4f8fMmRZ7WtqnhuheADetknXwZnqyeiqtatS3EkjQKeXY5Pa3aVTBmPmAXUXrNsurz6PYyzVqzs5Kp4xjY74DB"),
                        Base64.decode("AAAAAgAAAXSHboAAjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QBUieJyYXTXWfWhdwOmLovIW2Gvo+8BoCmMH//////////AAAAAAABhqE="),
                        Base64.decode("AgAAAXSHboAAjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QBUieJyYXTXWfWhdwOmLovIW2Gvo+8BoCmMH//////////AAAAAAABhqGnWkUMD2ea1Zfi86ACWEegn6lXR4f7sdqN+68f1sil5Hs/mRy4DUQkJelesv+a9tBG1VSZq+NVsS+nvZGLfpKO"),
                        "{\"type\":2,\"id\":\"4M4f8fMmRZ7WtqnhuheADetknXwZnqyeiqtatS3EkjQKeXY5Pa3aVTBmPmAXUXrNsurz6PYyzVqzs5Kp4xjY74DB\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"fee\":100001,\"feeAssetId\":null,\"timestamp\":1600000000000,\"proofs\":[\"4M4f8fMmRZ7WtqnhuheADetknXwZnqyeiqtatS3EkjQKeXY5Pa3aVTBmPmAXUXrNsurz6PYyzVqzs5Kp4xjY74DB\"],\"recipient\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"amount\":9223372036854775807}"
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("transactionsProvider")
    void paymentTransaction(Address recipient, Id expectedId, Proof proof, byte[] expectedBody, byte[] expectedBytes,
                            String expectedJson) throws IOException {
        PaymentTransaction constructedTx = new PaymentTransaction(sender, recipient, amount, fee, timestamp, proof);

        assertAll("Tx created via constructor must be equal to expected bytes",
                () -> assertThat(constructedTx.bodyBytes()).isEqualTo(expectedBody),
                () -> assertThat(constructedTx.id()).isEqualTo(expectedId),
                () -> assertThat(constructedTx.toBytes()).isEqualTo(expectedBytes)
        );

        PaymentTransaction deserTx = PaymentTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> assertThat(deserTx.recipient()).isEqualTo(recipient),
                () -> assertThat(deserTx.amount()).isEqualTo(amount),

                () -> assertThat(deserTx.version()).isEqualTo(1),
                () -> assertThat(deserTx.chainId()).isEqualTo(Waves.chainId),
                () -> assertThat(deserTx.sender()).isEqualTo(sender),
                () -> assertThat(deserTx.fee()).isEqualTo(fee),
                () -> assertThat(deserTx.timestamp()).isEqualTo(timestamp),
                () -> assertThat(deserTx.proofs()).isEqualTo(Proof.list(proof)),

                () -> assertThat(deserTx.bodyBytes()).isEqualTo(expectedBody),
                () -> assertThat(deserTx.toBytes()).isEqualTo(expectedBytes),
                () -> assertThat(deserTx.id()).isEqualTo(expectedId)
        );

        assertThat(constructedTx)
                .describedAs("Tx must be equal to deserialized tx")
                .isEqualTo(deserTx);

        assertThat(JSON_MAPPER.readTree(Transaction.fromJson(expectedJson).toJson()))
                .describedAs("Tx serialized to json must be equal to expected")
                .isEqualTo(JSON_MAPPER.readTree(expectedJson));
    }

}
