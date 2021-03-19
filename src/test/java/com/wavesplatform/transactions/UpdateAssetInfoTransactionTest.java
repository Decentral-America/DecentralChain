package com.wavesplatform.transactions;

import com.wavesplatform.crypto.base.Base64;
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

public class UpdateAssetInfoTransactionTest {

    static PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
    static AssetId assetId = AssetId.as("8Vbtg5kgtCJHEnpV9YsUHyWsoD76J3YeQnhoipQcaCK2");
    static long timestamp = 1600000000000L;
    static long fee = UpdateAssetInfoTransaction.MIN_FEE + 1;

    @BeforeAll
    static void beforeAll() {
        WavesConfig.chainId('R');
    }

    private static String string(int length) {
        return new String(new char[length]).replace("\0", "a");
    }

    static Stream<Arguments> transactionsProvider() {
        String minName = string(4);
        String maxName = string(16);
        String minDescription = "";
        String maxDescription = string(1000);

        return Stream.of(
                arguments(1, minName, minDescription, Id.as("5V5oDWaqB89Xux82Gd7JdzBiPmWC319EgRNjkv2VC7o4"),
                        Proof.list(Proof.as("25FPjDLLyraiZwMQnvkibbSgTzV4UnUGDFFQz954LiuQozWZ4AGijzZw9HMCVMrVc44XAkeBe3M1NfaCZHR4kteE")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigBqgcoCiBvVYW+aRhJnHu1jWqgwePCHEE7yT+j6sRajUVn44C8mRIEYWFhYQ=="),
                        Base64.decode("Cl4IUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBChjQYggIC6u8guKAGqBygKIG9Vhb5pGEmce7WNaqDB48IcQTvJP6PqxFqNRWfjgLyZEgRhYWFhEkA1rjCbUmq5clNsmkaZeH4NxmXXXXByro/YwmDRZ9Gxg5dKmfK6UN+karxEdtlXAQx0XzDT6BfhaGgt2ER77DKD"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"fee\":100001,\"description\":\"\",\"type\":17,\"version\":1,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"25FPjDLLyraiZwMQnvkibbSgTzV4UnUGDFFQz954LiuQozWZ4AGijzZw9HMCVMrVc44XAkeBe3M1NfaCZHR4kteE\"],\"assetId\":\"8Vbtg5kgtCJHEnpV9YsUHyWsoD76J3YeQnhoipQcaCK2\",\"name\":\"aaaa\",\"id\":\"5V5oDWaqB89Xux82Gd7JdzBiPmWC319EgRNjkv2VC7o4\",\"timestamp\":1600000000000}"
                ),
                arguments(1, maxName, maxDescription, Id.as("2FmLwK8bGwN3xiLBptA1iUeBxrtnY8Zr78KgHWfHBBPw"),
                        Proof.list(Proof.as("4ysriohREYZjrCigxcKHWw4tUxHqkgxV5SukbdqdLbHGPkrdtibGS4hM64HXn78GXbVXVQJhTipdSG8M4JzFtPw2"), Proof.as("WuZn6ww1tR1pupVLkF8SBWSfZb6mGaSV7nRRgyW3EyRuFPLcDnwZTLNJSrHVbf77MAeaPvotcE2ZShAbLTSLJai"), Proof.as("5pJoMGcy4P27SQo4ra6jAd6PPUaQbG1x9sXdPNSLJ3JRGE6j7QLAbuLZQiHSkAizvQBnaEGroCRXZU6FeREfskCv"), Proof.as("5yRpCN7ExeUvGKujT8hL5hLMU3jaHoUmgeJbFrx7z5ncFPecdUZmoGS32Y3RLP7iteL98mt2JXs7q8aoZ7q7Vj6z"), Proof.as("3BdGubTr1HwHtaQpcDPp59EgztVA8hDudzB9qzRN5osizK7ni6hazK2JnsWJmkuoQnjuH118cYhDo6dpaCuvyykY"), Proof.as("21wfkhYcVtyBFUKLFHKfcMnGkZ4Wr5AUtFA5UsXP9Cn4zqNUDXMtyGe6FXK6McDGgh22qeUtjZZUS5Ebost9pxjG"), Proof.as("26hiLCvKik5azuYV6a9tGsKAE78RiN22wFbUGktG37TyAqcFeZqbJ3ci7uxNGRLHeGafVymg8iMSsV2YuwoMzrw7"), Proof.as("34XNBKUbyXfcHZepzQ9v2RzVPdQERxZNY7myk9JUdeHCSZZEkKZqbwCbgvxMvRZZLvZUVZu4424xVrT4fKYPHRnp")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigBqgefCAogb1WFvmkYSZx7tY1qoMHjwhxBO8k/o+rEWo1FZ+OAvJkSEGFhYWFhYWFhYWFhYWFhYWEa6AdhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFh"),
                        Base64.decode("CtYICFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigBqgefCAogb1WFvmkYSZx7tY1qoMHjwhxBO8k/o+rEWo1FZ+OAvJkSEGFhYWFhYWFhYWFhYWFhYWEa6AdhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhEkDHGXROSuGbjO4FJ1lDhCjhHiD9aQneUd70vxyOOJ5y2/90t+ViN55lh9Ye87roXqUprZfPVqpDtjW/KB3VF0KNEkAZykD5PS/VYvPoAIwIjOrkx++aBquBrLO6AMQ/S9N+lNsSys9JaFRPxKVAYxpgODFl+7o2PXC+QhJIfwRGxnmPEkDw3RhTs8fB9HJriYQOKaQjeJ+sAEkvX4DF1Z1zjJpH1oyxfRdcIij89CIHqJBYvnYbCZNEoDcld1f4/J1CEtOPEkD4uq0+WrmOG9Q1Ru5HyIbXXS40qQbUDF5VYxNvKodlyuCYPPTaN44cA/VHfvZIUJZW504JBZ157XxX+zvFiBuDEkBtMmuVQJHPPH2K+LUGCQwLK4jZWjbSnzJ1Rl8lVUuss8WGln2SW1Dt0UJiyGJ1m2djnmI5+K+kEWEd8RaiHBWNEkAy1G8wu2JhjoL0RRRAqIzExDcUVT7wohK1Aj9NvMKQIhtxt9YZNAyCoJYG2wVrvQg2iJtRPVj+L25WkUdAO7iHEkA27yOOC8kCg9rU/HuVO/4j/EDq7Ds129TuGM2TeHMHyQIOFjLwhIJR4OnmvBJDO9Yt/grcmLrOB12TmQeBt6eOEkBnEpNeoeoM73iWuI+evnW8uCkZA+u89Jkoiz7cbcEnzWqSeRzehjUjHb6DeuB9u9IbtlclUHA0foPBLor4HGCB"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"fee\":100001,\"description\":\"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"type\":17,\"version\":1,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"4ysriohREYZjrCigxcKHWw4tUxHqkgxV5SukbdqdLbHGPkrdtibGS4hM64HXn78GXbVXVQJhTipdSG8M4JzFtPw2\",\"WuZn6ww1tR1pupVLkF8SBWSfZb6mGaSV7nRRgyW3EyRuFPLcDnwZTLNJSrHVbf77MAeaPvotcE2ZShAbLTSLJai\",\"5pJoMGcy4P27SQo4ra6jAd6PPUaQbG1x9sXdPNSLJ3JRGE6j7QLAbuLZQiHSkAizvQBnaEGroCRXZU6FeREfskCv\",\"5yRpCN7ExeUvGKujT8hL5hLMU3jaHoUmgeJbFrx7z5ncFPecdUZmoGS32Y3RLP7iteL98mt2JXs7q8aoZ7q7Vj6z\",\"3BdGubTr1HwHtaQpcDPp59EgztVA8hDudzB9qzRN5osizK7ni6hazK2JnsWJmkuoQnjuH118cYhDo6dpaCuvyykY\",\"21wfkhYcVtyBFUKLFHKfcMnGkZ4Wr5AUtFA5UsXP9Cn4zqNUDXMtyGe6FXK6McDGgh22qeUtjZZUS5Ebost9pxjG\",\"26hiLCvKik5azuYV6a9tGsKAE78RiN22wFbUGktG37TyAqcFeZqbJ3ci7uxNGRLHeGafVymg8iMSsV2YuwoMzrw7\",\"34XNBKUbyXfcHZepzQ9v2RzVPdQERxZNY7myk9JUdeHCSZZEkKZqbwCbgvxMvRZZLvZUVZu4424xVrT4fKYPHRnp\"],\"assetId\":\"8Vbtg5kgtCJHEnpV9YsUHyWsoD76J3YeQnhoipQcaCK2\",\"name\":\"aaaaaaaaaaaaaaaa\",\"id\":\"2FmLwK8bGwN3xiLBptA1iUeBxrtnY8Zr78KgHWfHBBPw\",\"timestamp\":1600000000000}"
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("transactionsProvider")
    void updateAssetInfoTransaction(int version, String name, String description, Id expectedId, List<Proof> proofs,
                                    byte[] expectedBody, byte[] expectedBytes, String expectedJson) throws IOException {
        UpdateAssetInfoTransaction builtTx = UpdateAssetInfoTransaction
                .builder(assetId, name, description)
                .chainId(WavesConfig.chainId())
                .fee(fee)
                .timestamp(timestamp)
                .sender(sender)
                .version(version)
                .getUnsigned()
        .addProofs(proofs);

        assertAll("Tx created via builder must be equal to expected bytes",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(expectedBody),
                () -> assertThat(builtTx.id()).isEqualTo(expectedId),
                () -> assertThat(builtTx.toBytes()).isEqualTo(expectedBytes)
        );

        UpdateAssetInfoTransaction constructedTx = new UpdateAssetInfoTransaction(sender, assetId, name, description,
                WavesConfig.chainId(), Amount.of(fee), timestamp, version, proofs);

        assertAll("Txs created via builder and constructor are equal",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(constructedTx.bodyBytes()),
                () -> assertThat(builtTx.id()).isEqualTo(constructedTx.id()),
                () -> assertThat(builtTx.toBytes()).isEqualTo(constructedTx.toBytes())
        );

        UpdateAssetInfoTransaction deserTx = UpdateAssetInfoTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> assertThat(deserTx.name()).isEqualTo(name),
                () -> assertThat(deserTx.description()).isEqualTo(description),

                () -> assertThat(deserTx.version()).isEqualTo(version),
                () -> assertThat(deserTx.chainId()).isEqualTo(WavesConfig.chainId()),
                () -> assertThat(deserTx.sender()).isEqualTo(sender),
                () -> assertThat(deserTx.fee()).isEqualTo(Amount.of(fee, AssetId.WAVES)),
                () -> assertThat(deserTx.timestamp()).isEqualTo(timestamp),
                () -> assertThat(deserTx.proofs()).isEqualTo(proofs),

                () -> assertThat(deserTx.bodyBytes()).isEqualTo(expectedBody),
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
