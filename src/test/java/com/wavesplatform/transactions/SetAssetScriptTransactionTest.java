package com.wavesplatform.transactions;

import com.wavesplatform.crypto.base.Base64;
import com.wavesplatform.transactions.account.PublicKey;
import com.wavesplatform.transactions.common.*;
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

public class SetAssetScriptTransactionTest {

    static PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
    static AssetId assetId = AssetId.as("HcGYEobfsHtYoRv3jWcrHPnu5joTB1NZKHfxqVfaG212");
    static Base64String script = new Base64String("BAbMtW/U");
    static long timestamp = 1600000000000L;
    static long fee = SetAssetScriptTransaction.MIN_FEE + 1;

    @BeforeAll
    static void beforeAll() {
        WavesConfig.chainId('R');
    }

    static Stream<Arguments> transactionsProvider() {
        return Stream.of(
                arguments(1, Id.as("BMHqtKFidUdcCJLWVbCx8P7zESzYNDojVVrsnNDzdvCi"),
                        Proof.list(Proof.as("41YqEModNNLQVXATzNpSJVDavZa77oGHYiovnyKm23NoBeK3L9vEBVbXvHdSkDWw64MGsDUbA5tZ8L3wPC6p5xQc")),
                        Base64.decode("DwFSjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3T2w+OALBYlRzp9nqBIDE2BT9tdw7APa9/xIj6791oETQAAAAAF9eEBAAABdIdugAABAAYEBsy1b9Q="),
                        Base64.decode("AA8BUo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd09sPjgCwWJUc6fZ6gSAxNgU/bXcOwD2vf8SI+u/daBE0AAAAABfXhAQAAAXSHboAAAQAGBAbMtW/UAQABAECWhjb+iLSMbeUglscq/VG6Bqg85OH4zcsvUSXXffGgcU8nIFsGL95jkDbSus5Sm4bopNC73xQ5IEVMD17CS2yF"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"41YqEModNNLQVXATzNpSJVDavZa77oGHYiovnyKm23NoBeK3L9vEBVbXvHdSkDWw64MGsDUbA5tZ8L3wPC6p5xQc\"],\"assetId\":\"HcGYEobfsHtYoRv3jWcrHPnu5joTB1NZKHfxqVfaG212\",\"fee\":100000001,\"id\":\"BMHqtKFidUdcCJLWVbCx8P7zESzYNDojVVrsnNDzdvCi\",\"type\":15,\"version\":1,\"script\":\"base64:BAbMtW/U\",\"timestamp\":1600000000000}"
                ),
                arguments(2, Id.as("3AH46W7qmShsPG6mGpL1E8iVrzPFsEWKTS6hu8L6eUtW"),
                        Proof.list(Proof.as("4Ji3ikeVafAQVKjzJvxNpDB88dvV5mJoWJohWgfNA3wTaJEWofdR1Cv3FvrUQ6tmupCQhzAH5Y6LRXdVGZTsBTLY")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgUQgcLXLyCAgLq7yC4oApoHKgog9sPjgCwWJUc6fZ6gSAxNgU/bXcOwD2vf8SI+u/daBE0SBgQGzLVv1A=="),
                        Base64.decode("CmEIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBRCBwtcvIICAurvILigCmgcqCiD2w+OALBYlRzp9nqBIDE2BT9tdw7APa9/xIj6791oETRIGBAbMtW/UEkClUkpn4oPvz/ubA2UEGb4i0Clt62l6JKtzoJbceO1/gqFFsdCT64yd0otCQOZsf6CEH0HCMtpzkKwPQTSecvCF"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"4Ji3ikeVafAQVKjzJvxNpDB88dvV5mJoWJohWgfNA3wTaJEWofdR1Cv3FvrUQ6tmupCQhzAH5Y6LRXdVGZTsBTLY\"],\"assetId\":\"HcGYEobfsHtYoRv3jWcrHPnu5joTB1NZKHfxqVfaG212\",\"fee\":100000001,\"id\":\"3AH46W7qmShsPG6mGpL1E8iVrzPFsEWKTS6hu8L6eUtW\",\"type\":15,\"version\":2,\"script\":\"base64:BAbMtW/U\",\"timestamp\":1600000000000}"
                ),
                arguments(2, Id.as("3AH46W7qmShsPG6mGpL1E8iVrzPFsEWKTS6hu8L6eUtW"),
                        Proof.list(Proof.as("3cBNN9HEzoMytVwrQz2Q6cFCunpjT7qfMNmLVWRrQSAJXpdtLSLqieFfjFvMSCbJ4TnXywxTHM9iq59NhG7qH7Cn"), Proof.as("2RcKS5B46SbcaP4LbGxroom9giW7LfxGtkyFVMjcdopqicnrpNrev6Bwu3VtFmvBkfqmvBvTE34t2AECf5dx8tUv"), Proof.as("2pyo48Mb3nwyYEs8L2nqbfdQyze1B8k5UoVAZbZQyzpXmMWyfk9fQ5RbLeSAmGk5dFBDEVxFZeLs4fnYHRD2gYeX"), Proof.as("3Fb97kitGkcJxD6ik3HMVp3tA5RrEgJmSjFcdP15bb23W1x1TXQPqVbKZmp2hfE6naeawr33veJvN1EuvBwgvzp"), Proof.as("5Pu7kdo5MY7nYa7oW9uu5nkwrewG6hX36b8FtbJ9ZSgzbz5Qn3nRA9zWT8xKXJ8cVBNHsRVhd4nccLbodB2nfo1i"), Proof.as("3iRqjXqjHyZAzoe2ydwfBbx8AaGXb1fHLQLoTfV6aSQQHuGcUc6cgYqxwaKpoJoLQ98wwU6HNkRERUwh3DMFv28e"), Proof.as("3o29hgw5xZ85nXjRqSM3c8NY1oJpPFYWV16d7tY1aycd6oC5HhQbozF7JXSyAUDSsv544N64J8kKa3VaeDG5kGxS"), Proof.as("PewFsPbBGvv5rLrcPD6WVdaNMEzSYtfJAunA7eg5zrs3K4Bqq8Q6asEpfeEEQEwRz4C2MMPjvhRBvLySugHjyFJ")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgUQgcLXLyCAgLq7yC4oApoHKgog9sPjgCwWJUc6fZ6gSAxNgU/bXcOwD2vf8SI+u/daBE0SBgQGzLVv1A=="),
                        Base64.decode("CmEIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBRCBwtcvIICAurvILigCmgcqCiD2w+OALBYlRzp9nqBIDE2BT9tdw7APa9/xIj6791oETRIGBAbMtW/UEkCCXu6XbkNpsAzzwuH3lEqQc3OKUmDege46Esy+CKIFBeTh4u2tMytGdlgJ/WiWzHK09aVDp6uQVYTF08etDy+DEkBHPSI3yh0zUN61fRND3X+fF00B0LuQPw/Iu3ijEd/jaF0+TqGhdxfgbDqxylqjd+bHhaZ81SEQYpVR8pQ+5zWHEkBbZHdRqCq4F+DKWBaQwMScftBBM8R54NkhOzXZSsK3pUDwEOCBScyAlyF8sIUwNJ29TOnTxvp1hgDTSCHPeSuEEkAB8Q7PF8FnC5fQaChn6naS/J8id8mvJUyL1mUNVJ798EEwS0QhkdXAksyAd9CgeywbAJqFrh5AzPsnMp3MmmGFEkDb0Jl1DMxgG0aB1RADNbPX3wLolmycx3HbHGcCgDoHLBPCORhfTvkG9PIy78JlY1akPfdfOZLPPKNsSNTolG6BEkCHwpqtwDfXpPkoQ8KqqM5gnuCntdSzXFdNriCxU+p8FlrkmXeUhaE+VRDw2h5WiKDdZn1PCuPP5sF2A1Lb/aCHEkCLuEGCnjAqeTD5knUfRR3c5iq4pMKoYO81ZBLxGU2cSeemMSMXnTP0IQ4Gvc/bjwca7xt5c8FxlvoMQW1K2eeDEkATiTddPXGwUujtE7SeKwn662tZJ4EYnehpttDk9oSqFEQgmQg6Exw2X4RF6nfG6UxHUOi/QD62BovhNc4Bqd+N"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"3cBNN9HEzoMytVwrQz2Q6cFCunpjT7qfMNmLVWRrQSAJXpdtLSLqieFfjFvMSCbJ4TnXywxTHM9iq59NhG7qH7Cn\",\"2RcKS5B46SbcaP4LbGxroom9giW7LfxGtkyFVMjcdopqicnrpNrev6Bwu3VtFmvBkfqmvBvTE34t2AECf5dx8tUv\",\"2pyo48Mb3nwyYEs8L2nqbfdQyze1B8k5UoVAZbZQyzpXmMWyfk9fQ5RbLeSAmGk5dFBDEVxFZeLs4fnYHRD2gYeX\",\"3Fb97kitGkcJxD6ik3HMVp3tA5RrEgJmSjFcdP15bb23W1x1TXQPqVbKZmp2hfE6naeawr33veJvN1EuvBwgvzp\",\"5Pu7kdo5MY7nYa7oW9uu5nkwrewG6hX36b8FtbJ9ZSgzbz5Qn3nRA9zWT8xKXJ8cVBNHsRVhd4nccLbodB2nfo1i\",\"3iRqjXqjHyZAzoe2ydwfBbx8AaGXb1fHLQLoTfV6aSQQHuGcUc6cgYqxwaKpoJoLQ98wwU6HNkRERUwh3DMFv28e\",\"3o29hgw5xZ85nXjRqSM3c8NY1oJpPFYWV16d7tY1aycd6oC5HhQbozF7JXSyAUDSsv544N64J8kKa3VaeDG5kGxS\",\"PewFsPbBGvv5rLrcPD6WVdaNMEzSYtfJAunA7eg5zrs3K4Bqq8Q6asEpfeEEQEwRz4C2MMPjvhRBvLySugHjyFJ\"],\"assetId\":\"HcGYEobfsHtYoRv3jWcrHPnu5joTB1NZKHfxqVfaG212\",\"fee\":100000001,\"id\":\"3AH46W7qmShsPG6mGpL1E8iVrzPFsEWKTS6hu8L6eUtW\",\"type\":15,\"version\":2,\"script\":\"base64:BAbMtW/U\",\"timestamp\":1600000000000}"
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("transactionsProvider")
    void setAssetScriptTransaction(int version, Id expectedId, List<Proof> proofs, byte[] expectedBody,
                                   byte[] expectedBytes, String expectedJson) throws IOException {
        SetAssetScriptTransaction builtTx = SetAssetScriptTransaction
                .builder(assetId, script)
                .chainId(WavesConfig.chainId())
                .fee(fee)
                .timestamp(timestamp)
                .sender(sender)
                .version(version)
                .getUnsigned()
        .addProofs(proofs);

        assertAll("Tx created via builder must be equal to expected bytes",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(expectedBody),
                () -> Assertions.assertThat(builtTx.id()).isEqualTo(expectedId),
                () -> assertThat(builtTx.toBytes()).isEqualTo(expectedBytes)
        );

        SetAssetScriptTransaction constructedTx = new SetAssetScriptTransaction(
                sender, assetId, script, WavesConfig.chainId(), Amount.of(fee), timestamp, version, proofs);

        assertAll("Txs created via builder and constructor are equal",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(constructedTx.bodyBytes()),
                () -> Assertions.assertThat(builtTx.id()).isEqualTo(constructedTx.id()),
                () -> assertThat(builtTx.toBytes()).isEqualTo(constructedTx.toBytes())
        );

        SetAssetScriptTransaction deserTx = SetAssetScriptTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> Assertions.assertThat(deserTx.script()).isEqualTo(script),

                () -> assertThat(deserTx.version()).isEqualTo(version),
                () -> assertThat(deserTx.chainId()).isEqualTo(WavesConfig.chainId()),
                () -> Assertions.assertThat(deserTx.sender()).isEqualTo(sender),
                () -> Assertions.assertThat(deserTx.fee()).isEqualTo(Amount.of(fee, AssetId.WAVES)),
                () -> assertThat(deserTx.timestamp()).isEqualTo(timestamp),
                () -> Assertions.assertThat(deserTx.proofs()).isEqualTo(proofs),

                () -> assertThat(deserTx.bodyBytes()).isEqualTo(expectedBody),
                () -> assertThat(deserTx.toBytes()).isEqualTo(expectedBytes),
                () -> Assertions.assertThat(deserTx.id()).isEqualTo(expectedId)
        );

        assertThat(builtTx)
                .describedAs("Tx must be equal to deserialized tx")
                .isEqualTo(deserTx);

        Assertions.assertThat(JsonSerializer.JSON_MAPPER.readTree(Transaction.fromJson(expectedJson).toJson()))
                .describedAs("Tx serialized to json must be equal to expected")
                .isEqualTo(JsonSerializer.JSON_MAPPER.readTree(expectedJson));
    }

}
