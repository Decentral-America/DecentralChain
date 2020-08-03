package im.mak.waves.transactions;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.crypto.base.Base64;
import im.mak.waves.transactions.common.*;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.util.List;
import java.util.stream.Stream;

import static im.mak.waves.transactions.serializers.JsonSerializer.JSON_MAPPER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.params.provider.Arguments.arguments;

public class SetScriptTransactionTest {

    static PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
    static byte[] script = Base64.decode("BAbMtW/U");
    static long timestamp = 1600000000000L;
    static long fee = SetScriptTransaction.MIN_FEE + 1;

    @BeforeAll
    static void beforeAll() {
        Waves.chainId = 'R';
    }

    static Stream<Arguments> transactionsProvider() {
        return Stream.of(
                arguments(1, Bytes.empty(), Id.as("9NDmssQqrKhUux7mEFe7t5FBgN3re4sPLxtvd7kM3an"),
                        Proof.list(Proof.as("4UCa1VXcXXMn9kLTvhv7R6CeVCT3UEUtGbeBL3e1ECNCvwQknpLiF4fCzHKd657kRP3uWKqWKteKdr4R3SnWAKiW")),
                        Base64.decode("DQFSjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QAAAAAAAAPQkEAAAF0h26AAA=="),
                        Base64.decode("AA0BUo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AAAAAAAAD0JBAAABdIdugAABAAEAQK2BvI7G+OtG1ATPBaQlnsV3d2qTC/9WuKXzlljDpw4p6BocNnmKZHCQySYPVhqrAUPxJg/B2N6E94AlEyznZIc="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"4UCa1VXcXXMn9kLTvhv7R6CeVCT3UEUtGbeBL3e1ECNCvwQknpLiF4fCzHKd657kRP3uWKqWKteKdr4R3SnWAKiW\"],\"fee\":1000001,\"id\":\"9NDmssQqrKhUux7mEFe7t5FBgN3re4sPLxtvd7kM3an\",\"type\":13,\"version\":1,\"script\":null,\"timestamp\":1600000000000}"
                ),
                arguments(1, script, Id.as("52gNwMctfVwEwacKv8e13jjkHMBcaPPdWTAWKtohpqvq"),
                        Proof.list(Proof.as("2iYZaiM8WyX7SMT8LHRCAyZwYJBsYXyqs8AUE9djpNEBmGPmtZdQbn51RiDCzSK7frHbpuBWb6iUyxUgoCKFkoGF")),
                        Base64.decode("DQFSjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QBAAYEBsy1b9QAAAAAAA9CQQAAAXSHboAA"),
                        Base64.decode("AA0BUo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AQAGBAbMtW/UAAAAAAAPQkEAAAF0h26AAAEAAQBAVdfWLtbaXPb/aFqcKlQmciEf23jbbq9IcOcmmiACq9z7mSGhA0BrV1cwFpXcBpmDI4cwl6lOYLjKwGKLJ7rZhA=="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"2iYZaiM8WyX7SMT8LHRCAyZwYJBsYXyqs8AUE9djpNEBmGPmtZdQbn51RiDCzSK7frHbpuBWb6iUyxUgoCKFkoGF\"],\"fee\":1000001,\"id\":\"52gNwMctfVwEwacKv8e13jjkHMBcaPPdWTAWKtohpqvq\",\"type\":13,\"version\":1,\"script\":\"base64:BAbMtW\\/U\",\"timestamp\":1600000000000}"
                ),
                arguments(2, Bytes.empty(), Id.as("6uUXV3hSWQwVHBrsgdVczP7fxfrdWrBVX5TueeahSBx9"),
                        Proof.list(Proof.as("4U9eSiGhWsfG3UM1rVhKxQhqYJTTEQuRdptJVMhwPFXreR37xABbfHQVRKySsLdfPcNBoTxdi7M9Hfxb8VJDxSLy")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQwYQ9IICAurvILigCigcA"),
                        Base64.decode("CjYIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBDBhD0ggIC6u8guKAKKBwASQK12m9Wm7ogIQPNZncJtRek6GQoPRLyusy3I+A55DHnMo2XDVHkO/FtEAE1msVBTk++6I4KVywfS7994cf08AII="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"4U9eSiGhWsfG3UM1rVhKxQhqYJTTEQuRdptJVMhwPFXreR37xABbfHQVRKySsLdfPcNBoTxdi7M9Hfxb8VJDxSLy\"],\"fee\":1000001,\"id\":\"6uUXV3hSWQwVHBrsgdVczP7fxfrdWrBVX5TueeahSBx9\",\"type\":13,\"version\":2,\"script\":null,\"timestamp\":1600000000000}"
                ),
                arguments(2, script, Id.as("GvZChtmeLsJJ7gLUocf992kKZ2yyNaEvvdxdRJxrfjgx"),
                        Proof.list(Proof.as("3BhKR2P761B5kG96R5HJar8tJq5HJSbNxTAcqrkef75a5sMW342grrjVYBQAQ6WsHtF5kpcELXhRs3m3hfLEucnW"), Proof.as("2dC6R3cao6kYshwbTwMQbri3AXvcrZMAvgZWv1Ukx2wgy765qFzZJnbs7CnJnYoL5yVUC6iqngQbCEJwbDn35qJA"), Proof.as("3rjQEMrqPodg1ukHtLgtHcFHqX3GJhdHgTWdnLK5aAMuyF2TmAgUv5jpuYMJjrG2d1yUsxYHueWkbz2gUf7qxtEF"), Proof.as("5GEcLqyPFF6WLYa7jCCMX1bro3JCrqwFq9S1TmmuBsEgidiTdD9kAJL4DhhHogcLgTXDh3EArPXLgN5zj9UZG6tA"), Proof.as("2ypbuUiTyBJf3hfxgaGFj8Xr1j5y7mzRe6GX8zZVoNYrYoxgkUWmu2YFgRdApiebXq82MsQ2Pr5kmm8MzRC4N1Mj"), Proof.as("4YDBNixA7xKK8XqgoTQm33T7tRhrN4GYfvF9NhuuRFpNkbyrn9tKMqm2YWWh3c3isZhEuKKsYZmHfMsRoKBH3h94"), Proof.as("4VHLFhX5Bzws1bH4shVvdj62rnU8CZ1J7zNARNDCadjrwrDg6zQ56JUJ7SoAPDGhDoYTZQCYnEFqiZie6dMkKEhY"), Proof.as("R3BgvMe8JFdLLgxm7pfafa5Je6HGGigPUmpJiR5hsqLiNo1JK9cHvhaq4nCivht2wnZFo3xqVSvRSdCVp5A6y1K")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQwYQ9IICAurvILigCigcICgYEBsy1b9Q="),
                        Base64.decode("Cj4IUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBDBhD0ggIC6u8guKAKKBwgKBgQGzLVv1BJAbUHPWK5CQsvYQND82GReXrgbN0BNMV9Yp+uWIl/aqD1gkgWfgBcGqEwLk5zy8eTsp3Ye122RW1V+CsBaV8KOixJAUToayrVJegZdhxCKSZzo0hEpy1mcmILKx875o2qNEO8RWtG1+uof1xXL5NOYZXTYD46/OUYdQZhofG9ydKx2gxJAjuuPqvcpdGnYbMAERW3nuh/Dyoi2VSA1NhjiygLLGoUs9md6tiTIFXRmTIlYp95MpcJsb/vc2KNlxkPDvrGihBJA1TSte/q7c/EuV4Jk7bZdcemUudNG5pJDMmT7+mrVr3tBLxVak4H3b3zNpFMCZOJGQgc5tGfGD+uuACDyUmungxJAYwRcJ1sFitNaIPs9ZaxLy9SL0WtzpSua7ILS3DlmQSsk4Ptbzy0fCXibWZaRLkq4gUDOmiMwXhvGWAPWIKrVihJAsPcdv5Av/TRnzSRipjcXn+pYenecJM74i/xY5+M2iVdu2JoLjkm6GNhjkoTCnB6yB82RZpYjYjhhWNW/mWPsgxJArnChRwKzHfjbVYwLDa4r65iQJ32zG8EYo+CiIh8KqqQde8dDr9XP5k2DYr3p/ebFv4WlB+XSFnEao8Nyll95gxJAFLqql+1VgS/jv9wDt1hDB8gywht/sbR9WbMQLsKsaqUKrhqvRz5tac91CcOb222JagkRAhNUSMHrdtxSELohig=="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"3BhKR2P761B5kG96R5HJar8tJq5HJSbNxTAcqrkef75a5sMW342grrjVYBQAQ6WsHtF5kpcELXhRs3m3hfLEucnW\",\"2dC6R3cao6kYshwbTwMQbri3AXvcrZMAvgZWv1Ukx2wgy765qFzZJnbs7CnJnYoL5yVUC6iqngQbCEJwbDn35qJA\",\"3rjQEMrqPodg1ukHtLgtHcFHqX3GJhdHgTWdnLK5aAMuyF2TmAgUv5jpuYMJjrG2d1yUsxYHueWkbz2gUf7qxtEF\",\"5GEcLqyPFF6WLYa7jCCMX1bro3JCrqwFq9S1TmmuBsEgidiTdD9kAJL4DhhHogcLgTXDh3EArPXLgN5zj9UZG6tA\",\"2ypbuUiTyBJf3hfxgaGFj8Xr1j5y7mzRe6GX8zZVoNYrYoxgkUWmu2YFgRdApiebXq82MsQ2Pr5kmm8MzRC4N1Mj\",\"4YDBNixA7xKK8XqgoTQm33T7tRhrN4GYfvF9NhuuRFpNkbyrn9tKMqm2YWWh3c3isZhEuKKsYZmHfMsRoKBH3h94\",\"4VHLFhX5Bzws1bH4shVvdj62rnU8CZ1J7zNARNDCadjrwrDg6zQ56JUJ7SoAPDGhDoYTZQCYnEFqiZie6dMkKEhY\",\"R3BgvMe8JFdLLgxm7pfafa5Je6HGGigPUmpJiR5hsqLiNo1JK9cHvhaq4nCivht2wnZFo3xqVSvRSdCVp5A6y1K\"],\"fee\":1000001,\"id\":\"GvZChtmeLsJJ7gLUocf992kKZ2yyNaEvvdxdRJxrfjgx\",\"type\":13,\"version\":2,\"script\":\"base64:BAbMtW\\/U\",\"timestamp\":1600000000000}"
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("transactionsProvider")
    void setScriptTransaction(int version, byte[] script, Id expectedId, List<Proof> proofs, byte[] expectedBody,
                              byte[] expectedBytes, String expectedJson) throws IOException {
        SetScriptTransaction builtTx = SetScriptTransaction
                .with(script)
                .chainId(Waves.chainId)
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

        SetScriptTransaction constructedTx = new SetScriptTransaction(
                sender, script, Waves.chainId, Amount.of(fee), timestamp, version, proofs);

        assertAll("Txs created via builder and constructor are equal",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(constructedTx.bodyBytes()),
                () -> assertThat(builtTx.id()).isEqualTo(constructedTx.id()),
                () -> assertThat(builtTx.toBytes()).isEqualTo(constructedTx.toBytes())
        );

        SetScriptTransaction deserTx = SetScriptTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> assertThat(deserTx.compiledScript()).isEqualTo(script),
                () -> assertThat(deserTx.compiledBase64Script()).isEqualTo(Base64.encode(script)),

                () -> assertThat(deserTx.version()).isEqualTo(version),
                () -> assertThat(deserTx.chainId()).isEqualTo(Waves.chainId),
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

        assertThat(JSON_MAPPER.readTree(Transaction.fromJson(expectedJson).toJson()))
                .describedAs("Tx serialized to json must be equal to expected")
                .isEqualTo(JSON_MAPPER.readTree(expectedJson));
    }

}
