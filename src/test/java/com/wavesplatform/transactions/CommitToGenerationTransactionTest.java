package com.wavesplatform.transactions;

import com.wavesplatform.crypto.base.Base64;
import com.wavesplatform.transactions.account.BlsPublicKey;
import com.wavesplatform.transactions.account.BlsSignature;
import com.wavesplatform.transactions.account.PublicKey;
import com.wavesplatform.transactions.common.Amount;
import com.wavesplatform.transactions.common.AssetId;
import com.wavesplatform.transactions.common.Id;
import com.wavesplatform.transactions.common.Proof;
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

    private static final PublicKey sender = PublicKey.as("2JYMTjUK7tC8NQi6TD6oWgy41YbrnXuoLzZydrFKTKt6");
    private static final long timestamp = 1759169607086L;

    private static final long fee = CommitToGenerationTransaction.MIN_FEE;

    static Stream<Arguments> transactionsProvider() {

        return Stream.of(
                arguments(1, 80,
                        "6TGkDGP9my3dLeU1LphyCsYDcxeqfiz6xbFdNPG38PdQwEuUZeBTDr8QTTiR3XvMKR",
                        "26DBpJeCPNrvD1q6mhNDcaHHbXg86tcbzfqpswbydjDcPNGSHVmPZozfcPh4z7NpBsz5pvHd9g4p2YqyYFXKpUTZAAHh1cDZbbB25HAE7a57NymCQewnTTQEEC2SCEY4U6qX",
                        Id.as("AFQu6csUmCpXT92RD2hBRMkbPSfi5CGWRwnKJ8ANxsiV"),
                        Proof.list(Proof.as("4Ki4PUwpve4tXeDjuNQF7k6jPAfyG9bNBubFGUhfSYWvddCLavdhEGdMmtmrThSLKC2vQATQnQzmz3U1r7wc9Fke")),
                        Base64.decode("CEQSIBNaAul/RLTjlhwfp7Jm/1/avwgBD8OJDzKZWlbCLRpLGgUQgK3iBCCu67e1mTMoAcIHlgEIUBIwlKcg89S+mY5xcj6NIOPPYtlCFxs3VmbFFYcGPf1+vm8sTOcvhqiE+xWeeffPOQ7kGmC3fzy2EOk2FVGxhAdLnZ9VZSbKouMemGgKu2E8IEXZM3y/RwqTH2JVKJSqTvf19uERvyO46uluB6TkpYdsq6K+bhzYp53YiioNLKLWRkTJXnw6ALpgiTf63QBQ3wQOcDo="),
                        Base64.decode("Cs4BCEQSIBNaAul/RLTjlhwfp7Jm/1/avwgBD8OJDzKZWlbCLRpLGgUQgK3iBCCu67e1mTMoAcIHlgEIUBIwlKcg89S+mY5xcj6NIOPPYtlCFxs3VmbFFYcGPf1+vm8sTOcvhqiE+xWeeffPOQ7kGmC3fzy2EOk2FVGxhAdLnZ9VZSbKouMemGgKu2E8IEXZM3y/RwqTH2JVKJSqTvf19uERvyO46uluB6TkpYdsq6K+bhzYp53YiioNLKLWRkTJXnw6ALpgiTf63QBQ3wQOcDoSQKYvGWH9l4EKahy0uI0Ad7XZxeb9Z9om1DMem9gNEyi32KiTUYMvdOjwjkg3uxTFky02t/9RFp/33K0Q2K9dwgs="),
                        "{\"senderPublicKey\":\"2JYMTjUK7tC8NQi6TD6oWgy41YbrnXuoLzZydrFKTKt6\",\"fee\":10000000,\"generationPeriodStart\":\"80\",\"type\":20,\"version\":1,\"sender\":\"3FSgXpgbT6m1speWgVx3cVxAZKmdr4barHU\",\"feeAssetId\":null,\"chainId\":68,\"proofs\":[\"4Ki4PUwpve4tXeDjuNQF7k6jPAfyG9bNBubFGUhfSYWvddCLavdhEGdMmtmrThSLKC2vQATQnQzmz3U1r7wc9Fke\"],\"commitmentSignature\":\"26DBpJeCPNrvD1q6mhNDcaHHbXg86tcbzfqpswbydjDcPNGSHVmPZozfcPh4z7NpBsz5pvHd9g4p2YqyYFXKpUTZAAHh1cDZbbB25HAE7a57NymCQewnTTQEEC2SCEY4U6qX\",\"endorserPublicKey\":\"6TGkDGP9my3dLeU1LphyCsYDcxeqfiz6xbFdNPG38PdQwEuUZeBTDr8QTTiR3XvMKR\",\"id\":\"AFQu6csUmCpXT92RD2hBRMkbPSfi5CGWRwnKJ8ANxsiV\",\"timestamp\":1759169607086}"
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

//        Assertions.assertThat(JsonSerializer.JSON_MAPPER.readTree(Transaction.fromJson(expectedJson).toJson()))
//                .describedAs("Tx serialized to json must be equal to expected")
//                .isEqualTo(JsonSerializer.JSON_MAPPER.readTree(expectedJson));
    }

}
