package com.wavesplatform.transactions;

import com.wavesplatform.crypto.base.Base64;
import com.wavesplatform.transactions.account.BlsPublicKey;
import com.wavesplatform.transactions.account.BlsSignature;
import com.wavesplatform.transactions.account.PublicKey;
import com.wavesplatform.transactions.common.Amount;
import com.wavesplatform.transactions.common.AssetId;
import com.wavesplatform.transactions.common.Id;
import com.wavesplatform.transactions.common.Proof;
import com.wavesplatform.transactions.serializers.json.JsonSerializer;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.params.provider.Arguments.arguments;

public class CommitToGenerationTransactionTest {

    @BeforeAll
    static void beforeAll() {
        WavesConfig.chainId('D');
    }

    private static final PublicKey sender = PublicKey.as("Bn21Eg8HbwZWZQMHXnTFnb64MhVjgH2HygDekQDbjjMq");
    private static final long timestamp = 1766488084192L;

    private static final long fee = CommitToGenerationTransaction.MIN_FEE;

    static Stream<Arguments> transactionsProvider() {

        return Stream.of(
                arguments(1, 2941,
                        "5t9zL1oqXW6kL3YUAuF8r4rKUaPwohPVrpMWR8Y1bAJtSMipP3TQJYZvpBFB7GWZwo",
                        "u9CTxLENQWyd5egnHrnbnnDKy7mvtrWJfR1AuCL4e4e7uuRTobzxVy1SQBz7ayoY5mRfiTG3PR8niJPT3fdVfsD97EkagBha8ehrLAzdutWSLbiQF2VDwPfi7uvTcp5csMC",
                        Id.as("2r6kpnJbGqNTmLxi9cPuavgxqumGufnisnN8vhuSCpaX"),
                        Proof.list(Proof.as("2H7TeCFEBSq6gb325Up2iZPr1jbZk99XugFijYTLbvgH2Ts8NQyCusG5p84FxKySEsVz7RUqsmQQJcCGU3xx75jt")),
                        Base64.decode("CEQSIKAdJBa6JVvXU0LO8aUp5j7w3LObv4C4vPpcq9RBuqMQGgUQgK3iBCDgnZTXtDMoAcIHlwEI/RYSMIUWaUuByJgaIrJ8Tzg7DtK6VMpZ+NMqFQnZmUZ8JQ+gtn/5ek2c2QZ2u5gPLugyohpgl11dxTrp2qTsGNyxzCVVgWCv64BdM6pqdAYmfawlVYZgg3u4l4uz1j7FM2GTQaWnCKANY7gWy3cdwzwtk7hnLZ67TBpiMZMIaXV+9Hd3sebB5UcswbwmLheDDjBcid5z"),
                        Base64.decode("Cs8BCEQSIKAdJBa6JVvXU0LO8aUp5j7w3LObv4C4vPpcq9RBuqMQGgUQgK3iBCDgnZTXtDMoAcIHlwEI/RYSMIUWaUuByJgaIrJ8Tzg7DtK6VMpZ+NMqFQnZmUZ8JQ+gtn/5ek2c2QZ2u5gPLugyohpgl11dxTrp2qTsGNyxzCVVgWCv64BdM6pqdAYmfawlVYZgg3u4l4uz1j7FM2GTQaWnCKANY7gWy3cdwzwtk7hnLZ67TBpiMZMIaXV+9Hd3sebB5UcswbwmLheDDjBcid5zEkA/6SwuagKVYJeSgi5V6yNtzKeV7cy6+SjybD9d+bopeoERTmNPLEDduAtBy4JP5upf9S+Yf9cH1nnMgDI0FagH"),
                        "{\"id\":\"2r6kpnJbGqNTmLxi9cPuavgxqumGufnisnN8vhuSCpaX\",\"type\":19,\"version\":1,\"chainId\":68,\"senderPublicKey\":\"Bn21Eg8HbwZWZQMHXnTFnb64MhVjgH2HygDekQDbjjMq\",\"sender\":\"3FmjX4FAeDXE4ZdDj2JKxzE4QtbxaioXzxM\",\"generationPeriodStart\":2941,\"endorserPublicKey\":\"5t9zL1oqXW6kL3YUAuF8r4rKUaPwohPVrpMWR8Y1bAJtSMipP3TQJYZvpBFB7GWZwo\",\"commitmentSignature\":\"u9CTxLENQWyd5egnHrnbnnDKy7mvtrWJfR1AuCL4e4e7uuRTobzxVy1SQBz7ayoY5mRfiTG3PR8niJPT3fdVfsD97EkagBha8ehrLAzdutWSLbiQF2VDwPfi7uvTcp5csMC\",\"proofs\":[\"2H7TeCFEBSq6gb325Up2iZPr1jbZk99XugFijYTLbvgH2Ts8NQyCusG5p84FxKySEsVz7RUqsmQQJcCGU3xx75jt\"],\"fee\":10000000,\"feeAssetId\":null,\"timestamp\":1766488084192}"
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("transactionsProvider")
    void commitToGenerationTransaction(int version, int generationPeriodStart, String endorserPublicKey,
                                    String commitmentSignature, Id expectedId, List<Proof> proofs,
                                    byte[] expectedBodyBytes, byte[] expectedBytes, String expectedJson) throws IOException {
        CommitToGenerationTransaction builtTx = CommitToGenerationTransaction
                .builder(generationPeriodStart)
                .endorserPublicKey(BlsPublicKey.as(endorserPublicKey))
                .commitmentSignature(BlsSignature.as(commitmentSignature))
                .chainId(WavesConfig.chainId())
                .fee(fee)
                .timestamp(timestamp)
                .sender(sender)
                .version(version)
                .getUnsigned()
                .addProofs(proofs);

        assertAll("Tx created via builder must be equal to expected bytes",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(expectedBodyBytes),
                () -> assertThat(builtTx.id()).isEqualTo(expectedId),
                () -> assertThat(builtTx.toBytes()).isEqualTo(expectedBytes)
        );

        CommitToGenerationTransaction constructedTx = new CommitToGenerationTransaction(sender, generationPeriodStart,
                BlsPublicKey.as(endorserPublicKey), BlsSignature.as(commitmentSignature), Amount.of(fee),
                version, WavesConfig.chainId(),  timestamp, proofs);

        assertAll("Txs created via builder and constructor are equal",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(constructedTx.bodyBytes()),
                () -> assertThat(builtTx.id()).isEqualTo(constructedTx.id()),
                () -> assertThat(builtTx.toBytes()).isEqualTo(constructedTx.toBytes())
        );

        CommitToGenerationTransaction deserTx = CommitToGenerationTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> assertThat(deserTx.generationPeriodStart()).isEqualTo(generationPeriodStart),
                () -> assertThat(deserTx.endorserPublicKey()).isEqualTo(BlsPublicKey.as(endorserPublicKey)),
                () -> assertThat(deserTx.commitmentSignature()).isEqualTo(BlsSignature.as(commitmentSignature)),

                () -> assertThat(deserTx.version()).isEqualTo(version),
                () -> assertThat(deserTx.chainId()).isEqualTo(WavesConfig.chainId()),
                () -> assertThat(deserTx.sender()).isEqualTo(sender),
                () -> assertThat(deserTx.fee()).isEqualTo(Amount.of(fee, AssetId.WAVES)),
                () -> assertThat(deserTx.timestamp()).isEqualTo(timestamp),
                () -> assertThat(deserTx.proofs()).isEqualTo(proofs),

                () -> assertThat(deserTx.bodyBytes()).isEqualTo(expectedBodyBytes),
                () -> assertThat(deserTx.toBytes()).isEqualTo(expectedBytes),
                () -> assertThat(deserTx.id()).isEqualTo(expectedId)
        );

        assertThat(builtTx)
                .describedAs("Tx must be equal to deserialized tx")
                .isEqualTo(deserTx);

        Assertions.assertThat(JsonSerializer.JSON_MAPPER.readTree(Transaction.fromJson(expectedJson).toJson()))
                .describedAs("Tx serialized to json must be equal to expected")
                .isEqualTo(JsonSerializer.JSON_MAPPER.readTree(expectedJson));
    }

}
