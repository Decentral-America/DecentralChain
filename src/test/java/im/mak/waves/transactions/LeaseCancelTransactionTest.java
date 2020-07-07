package im.mak.waves.transactions;

import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.crypto.base.Base64;
import im.mak.waves.transactions.common.*;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.util.List;
import java.util.stream.Stream;

import static im.mak.waves.transactions.LeaseCancelTransaction.MIN_FEE;
import static im.mak.waves.transactions.serializers.JsonSerializer.JSON_MAPPER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.params.provider.Arguments.arguments;

public class LeaseCancelTransactionTest {

    static PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
    static long timestamp = 1600000000000L;

    @BeforeAll
    static void beforeAll() {
        Waves.chainId = 'R';
    }

    static Stream<Arguments> transactionsProvider() {
        Id leaseId = Id.as(new byte[Id.BYTE_LENGTH]);
        return Stream.of(
                arguments(1, leaseId, Id.as("2e1i8bkDFaoVGhq5qQyGUhnhoFeo71NMaeVprs2Zejzk"),
                        Proof.list(Proof.as("4SLxdCS4gwUo5bdMqMDCLJAPaQFFDBqvYoZQoo7QKLWyqEz6jGvQvNLt1BfDJEdiksXdG53CQoNbZXKM36ZfngG5")),
                        Base64.decode("CY2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AAAAAAABhqAAAAF0h26AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
                        Base64.decode("CY2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AAAAAAABhqAAAAF0h26AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAq+gkQ2fk11DqXrSHzaxsgxwXHJbrJ/1cyKLzIk90i/ysXVQ++dHfWBCPi+IWRmsXS7U34pnHNGuyfOaXuhYVjg=="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"leaseId\":\"11111111111111111111111111111111\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"signature\":\"4SLxdCS4gwUo5bdMqMDCLJAPaQFFDBqvYoZQoo7QKLWyqEz6jGvQvNLt1BfDJEdiksXdG53CQoNbZXKM36ZfngG5\",\"proofs\":[\"4SLxdCS4gwUo5bdMqMDCLJAPaQFFDBqvYoZQoo7QKLWyqEz6jGvQvNLt1BfDJEdiksXdG53CQoNbZXKM36ZfngG5\"],\"fee\":100000,\"id\":\"2e1i8bkDFaoVGhq5qQyGUhnhoFeo71NMaeVprs2Zejzk\",\"type\":9,\"version\":1,\"timestamp\":1600000000000}"
                ),
                arguments(2, leaseId, Id.as("v65WRpS5x3yThVkPBHPQaBKa15yWC3JzYWdKEbHaYQE"),
                        Proof.list(Proof.as("4KB98MrFzabkeo8xGGdAaWYreJCgB8xdhvx4sEiyGwdevr6hcB4j2cfzht97bdNXDJknsHFe5RVAb4tMmiW81V8j")),
                        Base64.decode("CQJSjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QAAAAAAAGGoAAAAXSHboAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        Base64.decode("AAkCUo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AAAAAAABhqAAAAF0h26AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQABAECluWpN/r/lqiA60kZFnbQSEQ+BP4gLj9hsjESsDIz2chg+RqoI4XGAeeU9/m+jOoeyYtWHUR3VsYyUevjUEdyA"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"leaseId\":\"11111111111111111111111111111111\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"4KB98MrFzabkeo8xGGdAaWYreJCgB8xdhvx4sEiyGwdevr6hcB4j2cfzht97bdNXDJknsHFe5RVAb4tMmiW81V8j\"],\"fee\":100000,\"id\":\"v65WRpS5x3yThVkPBHPQaBKa15yWC3JzYWdKEbHaYQE\",\"type\":9,\"version\":2,\"timestamp\":1600000000000}"
                ),
                arguments(2, leaseId, Id.as("v65WRpS5x3yThVkPBHPQaBKa15yWC3JzYWdKEbHaYQE"),
                        Proof.list(Proof.as("3AeD3tRuhXob4cvPFZqwbnuCy93HPnUrrvmWmeGxbJzdQPcw4v349MnBjWoT2LACR1bhyMEebAej1Q5VwkCNaVj3"), Proof.as("2Rwn5xw8KjpXTYLyHdzttc6qzE5JpxS495hdbfqXAFSocrPx6weWFDAFrUufFHdDQQiBGcQNHYHwRVZVDr4oVB4P"), Proof.as("uhaUys86CoQptYMMqi4xYyT3UJQ7q2DFhfbd8gd9caxeWvbWS3DpnyaUHXTNfXmn1uCPFgUKkGkKY3T3kD2NBsz"), Proof.as("4x9H8YNMHXMoFxUEne2bGGXrh75WqjNyAymYz4TmGe5ohroFnCwPaa9TmMqMsau26HFcKQWZS27RkgNMkSWCvKPo"), Proof.as("2jSg1NzNx8sfiYckwNuZMrQxCLYz5bj69RW3wfHnLbEw6aTZmDcCEks9i3sfXRnXazGTwA1VJ5iYaYmuoaYT6jWB"), Proof.as("4EgxCsfo6vygnzy9sdrcJRu6dYBhextT8mMJqsmjfquGYj1jnMU2ZCagSFabwT69RPHgBy7MxNG5pf1cdJm26viv"), Proof.as("4seqZo3wGvsz3guUdw39BSHcRW3diXrnqCmb1TKwzjsjG5G9jhjGTBmTttWTd32Ju8ALXUeVRgm4HihyyCESfCf5"), Proof.as("3c1gZ1B96Uk7JHgDoktGrMB6TepVeHRhWWNneWmnH37XLLNU3z1ix1UCCLNP2zJksyGZdG54iTFeYmSHThJNvwfb")),
                        Base64.decode("CQJSjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QAAAAAAAGGoAAAAXSHboAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        Base64.decode("AAkCUo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AAAAAAABhqAAAAF0h26AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAIAEBsWTVvbQUrPsooSC5Tc3Rws1R7HHter/8GKAi9PpsUXMOK2r6V+ydtUAskrtI5qtNkLT0OQ6BvgDxX7Tm1vdyOAEBHhzPH91/QH1g0R4qNeOimLng3dbbKpMMrZpVAutqJiat3NOWsTrL0QAG/bIczb6+wqimp8EJH+THADdO3LJaMAEAtcjZZapSAJYlIiAlxRdx5nlz7cggv9KE4sXknnlDEFoOQ3pBxd01UWYhFb5HcmtZzLFyAYOuOvvJMPnguwdCNAEDFmp8DGSvAJBsHRDNueNFCabBTCo9lYH3Kej8IYJVsZAvALSIV+9Kkrg/xnerGEVTNhiprkM1nPwVLgbmrW+iKAEBWni9t/oMukP8LO5veCHcO1UBZ3pbvRqH8H0bRMgHpxLBS2S6EAXUKXvWzjCSW4Alwlgbme6I0z2cPA6GQH3SMAECh2xBORpauG9f1bZVv0lxMj6u9E4CF39c1OOM/5czxM9+x1hSx/aLOyI9VsOQaAA5m/5OsyYR6yf5zxZ96oCCLAEDBu08ElxRVXF2f0vKeI7m2zRNgE4Is5Yr05m8Rem/GpMaYGxferO6o0pgjrgmnvstNvMINi0a/6JwlCcIh9ceMAECCOhALP+rXL8y26vhnFAIQ6w0d21b9KiBtvilLXOARVWMrc669vOqeE3rSJTaNQQwB+g8zjRcKbOe5sOZ7GLeO"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"leaseId\":\"11111111111111111111111111111111\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"3AeD3tRuhXob4cvPFZqwbnuCy93HPnUrrvmWmeGxbJzdQPcw4v349MnBjWoT2LACR1bhyMEebAej1Q5VwkCNaVj3\",\"2Rwn5xw8KjpXTYLyHdzttc6qzE5JpxS495hdbfqXAFSocrPx6weWFDAFrUufFHdDQQiBGcQNHYHwRVZVDr4oVB4P\",\"uhaUys86CoQptYMMqi4xYyT3UJQ7q2DFhfbd8gd9caxeWvbWS3DpnyaUHXTNfXmn1uCPFgUKkGkKY3T3kD2NBsz\",\"4x9H8YNMHXMoFxUEne2bGGXrh75WqjNyAymYz4TmGe5ohroFnCwPaa9TmMqMsau26HFcKQWZS27RkgNMkSWCvKPo\",\"2jSg1NzNx8sfiYckwNuZMrQxCLYz5bj69RW3wfHnLbEw6aTZmDcCEks9i3sfXRnXazGTwA1VJ5iYaYmuoaYT6jWB\",\"4EgxCsfo6vygnzy9sdrcJRu6dYBhextT8mMJqsmjfquGYj1jnMU2ZCagSFabwT69RPHgBy7MxNG5pf1cdJm26viv\",\"4seqZo3wGvsz3guUdw39BSHcRW3diXrnqCmb1TKwzjsjG5G9jhjGTBmTttWTd32Ju8ALXUeVRgm4HihyyCESfCf5\",\"3c1gZ1B96Uk7JHgDoktGrMB6TepVeHRhWWNneWmnH37XLLNU3z1ix1UCCLNP2zJksyGZdG54iTFeYmSHThJNvwfb\"],\"fee\":100000,\"id\":\"v65WRpS5x3yThVkPBHPQaBKa15yWC3JzYWdKEbHaYQE\",\"type\":9,\"version\":2,\"timestamp\":1600000000000}"
                ),
                arguments(3, leaseId, Id.as("5vE4BGTM583JsCjxdBGyF8MvQPVZ7i9zDY72kNaL5A1s"),
                        Proof.list(Proof.as("5PQTL5AFsvRxoEhFXUzm5aNn8Pgne3uvY49ta9VXovedXHBFiqb6h9K2Mzfm7ke4t3rE3nXtv2LqYEXyKDi1Diw2")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoI0GIICAurvILigD6gYiCiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="),
                        Base64.decode("ClgIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBCgjQYggIC6u8guKAPqBiIKIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEkDbY4B3ZrjJfIW2QK0W7DaJ02TegIIHoZG0V6z22i1rtUTCrRCL1HB8aEiljDbYr6/Ambhb1taJ3hqu1IcLZY+B"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"leaseId\":\"11111111111111111111111111111111\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"5PQTL5AFsvRxoEhFXUzm5aNn8Pgne3uvY49ta9VXovedXHBFiqb6h9K2Mzfm7ke4t3rE3nXtv2LqYEXyKDi1Diw2\"],\"fee\":100000,\"id\":\"5vE4BGTM583JsCjxdBGyF8MvQPVZ7i9zDY72kNaL5A1s\",\"type\":9,\"version\":3,\"timestamp\":1600000000000}"
                ),
                arguments(3, leaseId, Id.as("5vE4BGTM583JsCjxdBGyF8MvQPVZ7i9zDY72kNaL5A1s"),
                        Proof.list(Proof.as("4St2aDQFjgSbo5BTwHsL5nMTLaiKYHUmC4pKZesjGVyhn13zduz431pLRX39Cwh1A3rpRuooaBfYZ9o7b9corasc"), Proof.as("5cA7zrN7ZQHJhLMmUSaKbiDdRCfuq9LVj4n7pUwPqEYphPwo495R2qNfu6ef55Ux2Jy8X95oa1RrZpNMvXGaoXf"), Proof.as("2uFVUEjj8hV7GRZEQw3XJYmQUx2LsZ9S48mEKo3ziARViSWLVphjohFLSQNfhiVYq6NHKnsQ16YYmpGdpJPYWHna"), Proof.as("2hDFXsvW53zn4yrFaK81YGfTPkEsQvaX9yoHTXHeRq2ewPEJeSkzh9ha23Pdu65E71SojJfLGxuiaQ3bb1JQEgXd"), Proof.as("wFtjiQSonDspkSfwMaiC5ZgkDBBCKR4t9jjvDapa8Cd4c3xKZsgR8ZEZq5Pn5gaSshGt35mVPmGb8V9sGxxn575"), Proof.as("xMkKYJZq7WAakUxpCSw9XPsTJWfhwRFUrVff5eTcXFdXvopJuy4draza43D22A2NE7UFpc6a8BaoacYcTLo5vWY"), Proof.as("5HaeXV3kw6fcUHFqCRvEHbXTCopMFLRDx5KH29YN532FyeKH6M6HMfshuc3vNLZMsSM5re9D2H8MvGqPAgMbXrPQ"), Proof.as("63wT7XL3wKZvdPcoBKWZohox2FDXqNVP6sq2SxB6HSY93QcnnhnANQXoZ8sD7z22XtA5MvQyK2q3vppL7avmyquY")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoI0GIICAurvILigD6gYiCiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="),
                        Base64.decode("ClgIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBCgjQYggIC6u8guKAPqBiIKIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEkCsXmVMZ/wslsee8tIeZ6OLSD9CwlniZZ4n36BTPFP3gYKkP9OGX9cPJKYW+ILmGHHKE7sZXt7jUAQ1pwQIOmWDEkAD+OCZtTAwZNwbFWj29SM/4hGaIp832SCBslyguOTEJcTLT8Bq5cOQMoxfWH4niQcBBnrVTEFnelucjTHICc+CEkBfE0V9GhUhKLcnqN4VgvXd4XQtHeo8YB5qer+s5kjYE4/5+5xXlZjfBKbrZngdbHJklE8rJiLUQqLocv8ipfGLEkBUsZFqxN294Xhyuw2L1fCZB7irz/SlXpJwxazvNpAnYyGCZdUVvOyDHVAxG+Vg8cLrT894mn0IkTBgL1qsqgaEEkAuyfnjDU4ZTK3AV0TEOkYouhzFmG7/+rmRV5ERA1BWYNAVvPvfXVTd1Mp6RMtKpAoxMYVtcc/RNJvodl8oEYmIEkAvvQazKyx13zpDJaE54gZkWXEAcjVb+Lm69ZHHySjl3VyrivQRr/SXycLhFvID4ec2DkmQajvib+jyI+O+F/6FEkDWXbYeJTCDmoowJVZ3xSO/EUhc1SZnHsHYWe4HzhQbK8FyPppVUv5NqfOtbPXE8IIQk8WMTg3uDUdsGESzVpKHEkD8nopcmxMo8WHLRVJTz1Egqlkkumll5aZ01jwW6BnrY2ynHZbniy7x6w8COuKQXsrJfZHHpNDJQwCNsaH7gB6H"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"leaseId\":\"11111111111111111111111111111111\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"4St2aDQFjgSbo5BTwHsL5nMTLaiKYHUmC4pKZesjGVyhn13zduz431pLRX39Cwh1A3rpRuooaBfYZ9o7b9corasc\",\"5cA7zrN7ZQHJhLMmUSaKbiDdRCfuq9LVj4n7pUwPqEYphPwo495R2qNfu6ef55Ux2Jy8X95oa1RrZpNMvXGaoXf\",\"2uFVUEjj8hV7GRZEQw3XJYmQUx2LsZ9S48mEKo3ziARViSWLVphjohFLSQNfhiVYq6NHKnsQ16YYmpGdpJPYWHna\",\"2hDFXsvW53zn4yrFaK81YGfTPkEsQvaX9yoHTXHeRq2ewPEJeSkzh9ha23Pdu65E71SojJfLGxuiaQ3bb1JQEgXd\",\"wFtjiQSonDspkSfwMaiC5ZgkDBBCKR4t9jjvDapa8Cd4c3xKZsgR8ZEZq5Pn5gaSshGt35mVPmGb8V9sGxxn575\",\"xMkKYJZq7WAakUxpCSw9XPsTJWfhwRFUrVff5eTcXFdXvopJuy4draza43D22A2NE7UFpc6a8BaoacYcTLo5vWY\",\"5HaeXV3kw6fcUHFqCRvEHbXTCopMFLRDx5KH29YN532FyeKH6M6HMfshuc3vNLZMsSM5re9D2H8MvGqPAgMbXrPQ\",\"63wT7XL3wKZvdPcoBKWZohox2FDXqNVP6sq2SxB6HSY93QcnnhnANQXoZ8sD7z22XtA5MvQyK2q3vppL7avmyquY\"],\"fee\":100000,\"id\":\"5vE4BGTM583JsCjxdBGyF8MvQPVZ7i9zDY72kNaL5A1s\",\"type\":9,\"version\":3,\"timestamp\":1600000000000}"
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} with id {2}")
    @MethodSource("transactionsProvider")
    void leaseCancelTransaction(int version, Id leaseId, Id expectedId, List<Proof> proofs,
                                byte[] expectedBody, byte[] expectedBytes, String expectedJson) throws IOException {
        LeaseCancelTransaction builtTx = LeaseCancelTransaction
                .with(leaseId)
                .chainId(Waves.chainId)
                .fee(MIN_FEE)
                .timestamp(timestamp)
                .sender(sender)
                .version(version)
                .get();
        proofs.forEach(p -> builtTx.proofs().add(p));

        assertAll("Tx created via builder must be equal to expected bytes",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(expectedBody),
                () -> assertThat(builtTx.id()).isEqualTo(expectedId),
                () -> assertThat(builtTx.toBytes()).isEqualTo(expectedBytes)
        );

        LeaseCancelTransaction constructedTx = new LeaseCancelTransaction(sender, leaseId, Waves.chainId,
                Amount.of(MIN_FEE), timestamp, version, proofs);

        assertAll("Txs created via builder and constructor are equal",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(constructedTx.bodyBytes()),
                () -> assertThat(builtTx.id()).isEqualTo(constructedTx.id()),
                () -> assertThat(builtTx.toBytes()).isEqualTo(constructedTx.toBytes())
        );

        LeaseCancelTransaction deserTx = LeaseCancelTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> assertThat(deserTx.leaseId()).isEqualTo(leaseId),

                () -> assertThat(deserTx.version()).isEqualTo(version),
                () -> assertThat(deserTx.chainId()).isEqualTo(Waves.chainId),
                () -> assertThat(deserTx.sender()).isEqualTo(sender),
                () -> assertThat(deserTx.fee()).isEqualTo(Amount.of(MIN_FEE, AssetId.WAVES)),
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
