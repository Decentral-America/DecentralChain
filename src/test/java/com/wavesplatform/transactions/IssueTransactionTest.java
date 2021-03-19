package com.wavesplatform.transactions;

import com.wavesplatform.crypto.Bytes;
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

import static java.nio.charset.StandardCharsets.UTF_8;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.params.provider.Arguments.arguments;

public class IssueTransactionTest {

    static PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
    static long timestamp = 1600000000000L;
    static long quantity = Long.MAX_VALUE;
    static long fee = IssueTransaction.MIN_FEE + 1;

    @BeforeAll
    static void beforeAll() {
        WavesConfig.chainId('R');
    }

    static Stream<Arguments> transactionsProvider() {
        String minName = "aaaa";
        String maxName = "aaaaaaaaaaaaaaaa";
        String minDescription = "";
        String maxDescription = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

        Base64String script = new Base64String("BAbMtW/U");

        return Stream.of(
                arguments(1, minName, minDescription, 0, false, Base64String.empty(), Id.as("HvbnMZ82dAnFbkSX9nNnbiHHEYNWmQ1U1pb9Jn2gsKZG"),
                        Proof.list(Proof.as("HeDrGAApxPvXS7gTfFdtPc4VyaktTAtAwU9NQeQUpoE6oKc3UHRF4MrAh9djbxo7cErcwrEWiSrTio54q2q291b")),
                        Base64.decode("A42Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AARhYWFhAAB//////////wAAAAAAAAX14QEAAAF0h26AAA=="),
                        Base64.decode("Aw5Z6Sq+uUTBglTIphC49PQP0KNu1dve3ApVy0EO1SUC05OeLvDj9bnx4LAHZ//13PfmjkVv62nAVFgY6jbKa4oDjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QABGFhYWEAAH//////////AAAAAAAABfXhAQAAAXSHboAA"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"quantity\":9223372036854775807,\"signature\":\"HeDrGAApxPvXS7gTfFdtPc4VyaktTAtAwU9NQeQUpoE6oKc3UHRF4MrAh9djbxo7cErcwrEWiSrTio54q2q291b\",\"fee\":100000001,\"description\":\"\",\"type\":3,\"version\":1,\"reissuable\":false,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"proofs\":[\"HeDrGAApxPvXS7gTfFdtPc4VyaktTAtAwU9NQeQUpoE6oKc3UHRF4MrAh9djbxo7cErcwrEWiSrTio54q2q291b\"],\"decimals\":0,\"name\":\"aaaa\",\"id\":\"HvbnMZ82dAnFbkSX9nNnbiHHEYNWmQ1U1pb9Jn2gsKZG\",\"timestamp\":1600000000000,\"script\":null}"
                ),
                arguments(1, maxName, maxDescription, 8, true, Base64String.empty(), Id.as("6kpPR9m6g6w6LP6L4MLJ898mBjuWApDQZSsyZD8t2ZKc"),
                        Proof.list(Proof.as("5JQcE8Gwk8seWpz9837r5MnRGrXuhuRntc4A3FT5j4aN27KeEmP9sM1MQBnz7EPLidmNvvoJnmqyY8akhERP4wkZ")),
                        Base64.decode("A42Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0ABBhYWFhYWFhYWFhYWFhYWFhA+hhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhf/////////8IAQAAAAAF9eEBAAABdIdugAA="),
                        Base64.decode("A9cUQybiL/9vx2SszTKzJIrdrUp14IDiGn1xzUbIlNdUg1jzDTF6qmQTWgkr/m5h0Q8nzrGryQWsF9tSV//cUo4DjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QAEGFhYWFhYWFhYWFhYWFhYWED6GFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWF//////////wgBAAAAAAX14QEAAAF0h26AAA=="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"quantity\":9223372036854775807,\"signature\":\"5JQcE8Gwk8seWpz9837r5MnRGrXuhuRntc4A3FT5j4aN27KeEmP9sM1MQBnz7EPLidmNvvoJnmqyY8akhERP4wkZ\",\"fee\":100000001,\"description\":\"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"type\":3,\"version\":1,\"reissuable\":true,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"proofs\":[\"5JQcE8Gwk8seWpz9837r5MnRGrXuhuRntc4A3FT5j4aN27KeEmP9sM1MQBnz7EPLidmNvvoJnmqyY8akhERP4wkZ\"],\"decimals\":8,\"name\":\"aaaaaaaaaaaaaaaa\",\"id\":\"6kpPR9m6g6w6LP6L4MLJ898mBjuWApDQZSsyZD8t2ZKc\",\"timestamp\":1600000000000,\"script\":null}"
                ),
                arguments(2, minName, minDescription, 0, false, Base64String.empty(), Id.as("C7RV4xjdjHkNbDG8suLwvjaQg88YsdfWV87hUGRhSYc1"),
                        Proof.list(Proof.as("547UTKLHfWb8gszF52arGgWLrxUTwy95NiS7cqRjes9esBiLPLJSZJ5uiXPX6XojMCczziC6jHbxkKdM2bsatKb2")),
                        Base64.decode("AwJSjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QABGFhYWEAAH//////////AAAAAAAABfXhAQAAAXSHboAAAA=="),
                        Base64.decode("AAMCUo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AARhYWFhAAB//////////wAAAAAAAAX14QEAAAF0h26AAAABAAEAQMrAVvxEU/eRijdP1CdZM0AS0bspgvte1yG4YIG/p5t6Mvk1S3HcYI7YeY9fkO/8dAYeH/pthNqlXXuQ+iB//YU="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"quantity\":9223372036854775807,\"fee\":100000001,\"description\":\"\",\"type\":3,\"version\":2,\"reissuable\":false,\"script\":null,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"547UTKLHfWb8gszF52arGgWLrxUTwy95NiS7cqRjes9esBiLPLJSZJ5uiXPX6XojMCczziC6jHbxkKdM2bsatKb2\"],\"decimals\":0,\"name\":\"aaaa\",\"id\":\"C7RV4xjdjHkNbDG8suLwvjaQg88YsdfWV87hUGRhSYc1\",\"timestamp\":1600000000000}"
                ),
                arguments(2, maxName, maxDescription, 8, true, script, Id.as("5S2eVMCngyafyj3jojZFCBqyEB7ifGHsJKQPmXRd844n"),
                        Proof.list(Proof.as("5Kt6bP1R18hTk85QA4okStpi17Jof3yr9584GKgR8XzKeuFN5Ccru9WyHMUBQGXmbZWQNNAURP451di7ZZbbhhw6"), Proof.as("3fwZFMceuY6HPwCR5UFPM3EifQBEwM2kmdRDy8Xtj5r5xQsmG7oBn4rUvQDtTXCHdqVHYC2inLD1Ni5oFrTWMUB4"), Proof.as("2XQYDXvT5w4LVULqgBcXBa1VNL95Xw5gK4jvvcvNdFQ3YXX86K7FYEqsMKPi9WiP5vshEeMwL6tUbQxzQEu5Tas8"), Proof.as("4w3RyKrvEX52Wbx2dcanz18buMNMFrc7okFea3LBrSZzHsget5vN9ntks27ZW52HdZ1MMCGMuPo8JmWuzToBEuu5"), Proof.as("3DH9Kj97N4qca21G7XNdZQtsJXKAHG6zs6Y2vMUFXdcwPq62zBEAjJd5qBhvMKHUktW5H5hpuDmqhdnjzybdXn7o"), Proof.as("5avcf8YsTKa8RzdB7K7zjMNQ7BYcsAwYYxGAV6C9rkjq7gFKaQ7xGyVwveKw2V4FcvhRsZg6DMPaxwN2bN25jdpf"), Proof.as("2grRmEZWQHf2RstHuJC4MKDmdnUyBVFSJZZocqzaARKcmedBF6aJEk8nNLyemD4K8Cv4RWAiagYQRF3F2de7fXVG"), Proof.as("3EA7LHH4NoX68CPXjTzVxXgBRS379E18G2Ws7Wsy53FtYKsrn3osuRQUhTFQPT1eYzEWJQbJGqgoUoBpjevqXeB3")),
                        Base64.decode("AwJSjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QAEGFhYWFhYWFhYWFhYWFhYWED6GFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWF//////////wgBAAAAAAX14QEAAAF0h26AAAEABgQGzLVv1A=="),
                        Base64.decode("AAMCUo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0ABBhYWFhYWFhYWFhYWFhYWFhA+hhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhf/////////8IAQAAAAAF9eEBAAABdIdugAABAAYEBsy1b9QBAAgAQNhZqIghCp6K+T1lIEEDd+lv9OWZn1f7gZ02pNMzXQGwG0hJOFZFbjiBMC4J2aWfZaCOOFjw9H3mgP4tapY1Y4EAQIWdaro14ET5yS9Rlg2hjQfnQ4AFqciYcl+nwEU9BNITtQLHliLAc+YxS/rPSo7UCG1uT62j+X3ww1lVGOGmxIMAQEw84p/3eVVC6vN5H5/fYQ5GIpRcz/KAZtI/b01uPZzSB6ODrmv8uIkGz8Ftg/cDgoM8UpyQNFIP2MaThpUda48AQMSnmVPjT3Xp92iBj7Ug6bdAV4LOLH0njYdWs/wvArPOSRLHmn8QVL9+ZwMpr+OdZRciZHigIG8QVt0ghgPHt4QAQG6fU38hpad6caa8TIkq8wURZwNNSNXPpPM8zqqidC8p4NMbevUWpdSo7Oe8CcsrrbaIC5DLNGex5/Pt0nRHF44AQOVSttLEq8k2UeJS38RSHY4mHJA4+7zVgPgLf1YykT28QM9zqRzSDaVrnnoYCGnc656TnOHXw7Asut+yRd5qQ4wAQFRiTq9fpIexx7r8R8F7Am22OEaHX12JXhliYIK4gkMQQ15wZzTOlR5daEQ3iTCoAOmQPtadXS9pUMTA7lLCFo8AQG9hUPK0TlcQzefjm4it+QGGu0zss3SOh8MPwBCV+5XeG3BPXJYZd3wyCu95x+IAdX5FTzKZQhAp/+dp8OJVCYo="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"quantity\":9223372036854775807,\"fee\":100000001,\"description\":\"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"type\":3,\"version\":2,\"reissuable\":true,\"script\":\"base64:BAbMtW/U\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"5Kt6bP1R18hTk85QA4okStpi17Jof3yr9584GKgR8XzKeuFN5Ccru9WyHMUBQGXmbZWQNNAURP451di7ZZbbhhw6\",\"3fwZFMceuY6HPwCR5UFPM3EifQBEwM2kmdRDy8Xtj5r5xQsmG7oBn4rUvQDtTXCHdqVHYC2inLD1Ni5oFrTWMUB4\",\"2XQYDXvT5w4LVULqgBcXBa1VNL95Xw5gK4jvvcvNdFQ3YXX86K7FYEqsMKPi9WiP5vshEeMwL6tUbQxzQEu5Tas8\",\"4w3RyKrvEX52Wbx2dcanz18buMNMFrc7okFea3LBrSZzHsget5vN9ntks27ZW52HdZ1MMCGMuPo8JmWuzToBEuu5\",\"3DH9Kj97N4qca21G7XNdZQtsJXKAHG6zs6Y2vMUFXdcwPq62zBEAjJd5qBhvMKHUktW5H5hpuDmqhdnjzybdXn7o\",\"5avcf8YsTKa8RzdB7K7zjMNQ7BYcsAwYYxGAV6C9rkjq7gFKaQ7xGyVwveKw2V4FcvhRsZg6DMPaxwN2bN25jdpf\",\"2grRmEZWQHf2RstHuJC4MKDmdnUyBVFSJZZocqzaARKcmedBF6aJEk8nNLyemD4K8Cv4RWAiagYQRF3F2de7fXVG\",\"3EA7LHH4NoX68CPXjTzVxXgBRS379E18G2Ws7Wsy53FtYKsrn3osuRQUhTFQPT1eYzEWJQbJGqgoUoBpjevqXeB3\"],\"decimals\":8,\"name\":\"aaaaaaaaaaaaaaaa\",\"id\":\"5S2eVMCngyafyj3jojZFCBqyEB7ifGHsJKQPmXRd844n\",\"timestamp\":1600000000000}"
                ),
                arguments(3, minName, minDescription, 0, false, Base64String.empty(), Id.as("TrvVX73TGaAcpLU93j2KzNs23SDyWWnsY75kGwcsqRo"),
                        Proof.list(Proof.as("3X7KvoMZcgWXejejzAi1F2NuChZsP4ruvKuvFb3UmCEN72JKr2855j5CLQF83YjzPGaMiwbG51piPAZcwCqfvKet")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgUQgcLXLyCAgLq7yC4oA7oGEAoEYWFhYRj//////////38="),
                        Base64.decode("CkcIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBRCBwtcvIICAurvILigDugYQCgRhYWFhGP//////////fxJAff+5N9OnJ/kLRqvGDCDKxg5W6F5ewAARhPtY7jnVpzop34zeisJnWTqwkQZDkw6RaOOtb4XhNQ3VGbFBnR6AhQ=="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"quantity\":9223372036854775807,\"fee\":100000001,\"description\":\"\",\"type\":3,\"version\":3,\"reissuable\":false,\"script\":null,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"3X7KvoMZcgWXejejzAi1F2NuChZsP4ruvKuvFb3UmCEN72JKr2855j5CLQF83YjzPGaMiwbG51piPAZcwCqfvKet\"],\"decimals\":0,\"name\":\"aaaa\",\"id\":\"TrvVX73TGaAcpLU93j2KzNs23SDyWWnsY75kGwcsqRo\",\"timestamp\":1600000000000}"
                ),
                arguments(3, maxName, maxDescription, 8, true, script, Id.as("GTdEMD3xt1qVexDjdES2VX9G5vWFJBgfhp6wxbSFzn43"),
                        Proof.list(Proof.as("2WWRQYcdUF8bXdfKsvYzYkEW3KjWVwKeQUdpJQE4Dj6PPix5j3SNLco6XijZCk6FRS4q2Pvscwf7iFmAx5nEwJdV"), Proof.as("4HAMsm3dxCdzA2PU4VonJHVJbQZq5WCraE8UQGrNdJsL4oXp1ZNDMF29j2nHjggxipFHbJGHZ8tBcLxU1ovBJ5ze"), Proof.as("3vVwKjnZPypU8NJKNxXkVFgDxN2DMGphnEqv37hjoT2tnpBCMn56FEKE3kKUcvYWkYrhhKEBE8eHNMRAbSwDFM8s"), Proof.as("36NPCTdhsVQEP1rRvbSo2RUagSJKD7NUAGoZq4CsjxefycVcqvFLyjuxXQEfzP7v5RWvmrL9De7fvqw2naX25Prg"), Proof.as("2x2qKu8edgY2izdEHoHkfrXWMJ1snwQFbMX1GrXGgJuFjfSR5XbTbeFs1xdVKmbbES2hQqarNAYonumJZZZcAmfk"), Proof.as("4hgoUUE36ouunCvrrBsqenKVMdPCUv1gju11Q7rA7ZYks7dradjZah2igLfZpNKEypiqfFvLBuPqfUCVzm7u8i6H"), Proof.as("2fo7mucHnjjhquSSoK1Qqopva7V53ZNFsE9wf4RMkiryH5z8oYRcyE1QURZZHRHJhH3qm4v7A4AjsWZk782S4kcd"), Proof.as("2Jg3f9ojFmBGe36eT6ZSZaJBM46JoLbqbxrRAMNjGM9sAyS1mPadE5E9uf6th5Qbs5dBs3TZH83vsoa9FbGNDRhB")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgUQgcLXLyCAgLq7yC4oA7oGkwgKEGFhYWFhYWFhYWFhYWFhYWES6AdhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhGP//////////fyAIKAEyBgQGzLVv1A=="),
                        Base64.decode("CssICFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgUQgcLXLyCAgLq7yC4oA7oGkwgKEGFhYWFhYWFhYWFhYWFhYWES6AdhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhGP//////////fyAIKAEyBgQGzLVv1BJAS3aC6Zg6feHHZur0kR5/LWRCiPtX+IE4504+4wijP99qiikEXOjWHpRgjHE2qqe9R3XPTLcrLcgUfrfUXU4+iBJAo/zqjPvNMio3LcWha+AQktfe7g1ze7ten3nBheqYkyWljktyGkSoOQ22yuIa7XI9sSpf/vq6xtBUIrvzpkqvhxJAkitfVLAVtbo8D6fkAtEkczdKcaYx9SSHjZlvOo8VN0AtcIhyLE6yMY3mkfzZmq6afing7lIXZGkokiIx6FwViBJAaKnqVLqA35j5UZfxkwqcz2Wa1m4gm7mhqOh78Bo5eUomUvzb7uoe/RyRpCVUUfKgORE+2Z68bIpEk+CzR662iRJAYXljBxwiqHFWNt8KgmglLJOvVeaKfD0Y+VqhNOcCujnLDAssfnfcnrypcXb1z1YKU2cnMOY7niluCv48wvGMjxJAuSMjG3gkkxI++IpkNK747N5B6HRslNeN04wbUFtkSbHTZ/mip9ZWkBlWamswrYbmWk6t+2T0kQaQZGjynWi7jhJAU3jxfUx54IFKmFuj3O5K2BrK+tiy9pCScuc0Wojb1YU9ihk7EjT/RSTL5jF/Q4bWhTPFX9+9mQ3wa5XJqkKBhhJAQUH4iArA54uYewAv+VKWxl3xMts1N1cW8VUkgrCH0LekMqL02YsG8fvJ/VYNM0CJA1WQcxGBfuK+oNINV0kWig=="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"quantity\":9223372036854775807,\"fee\":100000001,\"description\":\"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"type\":3,\"version\":3,\"reissuable\":true,\"script\":\"base64:BAbMtW/U\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"2WWRQYcdUF8bXdfKsvYzYkEW3KjWVwKeQUdpJQE4Dj6PPix5j3SNLco6XijZCk6FRS4q2Pvscwf7iFmAx5nEwJdV\",\"4HAMsm3dxCdzA2PU4VonJHVJbQZq5WCraE8UQGrNdJsL4oXp1ZNDMF29j2nHjggxipFHbJGHZ8tBcLxU1ovBJ5ze\",\"3vVwKjnZPypU8NJKNxXkVFgDxN2DMGphnEqv37hjoT2tnpBCMn56FEKE3kKUcvYWkYrhhKEBE8eHNMRAbSwDFM8s\",\"36NPCTdhsVQEP1rRvbSo2RUagSJKD7NUAGoZq4CsjxefycVcqvFLyjuxXQEfzP7v5RWvmrL9De7fvqw2naX25Prg\",\"2x2qKu8edgY2izdEHoHkfrXWMJ1snwQFbMX1GrXGgJuFjfSR5XbTbeFs1xdVKmbbES2hQqarNAYonumJZZZcAmfk\",\"4hgoUUE36ouunCvrrBsqenKVMdPCUv1gju11Q7rA7ZYks7dradjZah2igLfZpNKEypiqfFvLBuPqfUCVzm7u8i6H\",\"2fo7mucHnjjhquSSoK1Qqopva7V53ZNFsE9wf4RMkiryH5z8oYRcyE1QURZZHRHJhH3qm4v7A4AjsWZk782S4kcd\",\"2Jg3f9ojFmBGe36eT6ZSZaJBM46JoLbqbxrRAMNjGM9sAyS1mPadE5E9uf6th5Qbs5dBs3TZH83vsoa9FbGNDRhB\"],\"decimals\":8,\"name\":\"aaaaaaaaaaaaaaaa\",\"id\":\"GTdEMD3xt1qVexDjdES2VX9G5vWFJBgfhp6wxbSFzn43\",\"timestamp\":1600000000000}"
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("transactionsProvider")
    void issueTransactionWithStringName(int version, String name, String description, int decimals, boolean reissuable,
                                        Base64String script, Id expectedId, List<Proof> proofs, byte[] expectedBody,
                                        byte[] expectedBytes, String expectedJson) throws IOException {
        IssueTransaction builtTx = IssueTransaction
                .builder(name, quantity, decimals)
                .description(description)
                .isReissuable(reissuable)
                .script(script)
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

        IssueTransaction constructedTx = new IssueTransaction(sender, name, description, quantity, decimals,
                reissuable, script, WavesConfig.chainId(), Amount.of(fee), timestamp, version, proofs);

        assertAll("Txs created via builder and constructor are equal",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(constructedTx.bodyBytes()),
                () -> assertThat(builtTx.id()).isEqualTo(constructedTx.id()),
                () -> assertThat(builtTx.toBytes()).isEqualTo(constructedTx.toBytes())
        );

        IssueTransaction deserTx = IssueTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> assertThat(deserTx.nameBytes()).isEqualTo(name.getBytes()),
                () -> assertThat(deserTx.name()).isEqualTo(name),
                () -> assertThat(deserTx.descriptionBytes()).isEqualTo(description.getBytes()),
                () -> assertThat(deserTx.description()).isEqualTo(description),
                () -> assertThat(deserTx.quantity()).isEqualTo(quantity),
                () -> assertThat(deserTx.decimals()).isEqualTo(decimals),
                () -> assertThat(deserTx.reissuable()).isEqualTo(reissuable),
                () -> assertThat(deserTx.script()).isEqualTo(script),

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

    static Stream<Arguments> oldTransactionsProvider() {
        byte[] minName = Base64.decode("6v0gag==");
        byte[] maxName = Base64.decode("fxF30vI7U2ynhiGnmOV6Wg==");
        byte[] minDescription = Bytes.empty();
        byte[] maxDescription = Base64.decode("T84FFrGh1D9iqTkiKvsFtq1NFGscrDnjy+YK2D744xzRSYRcp2f/qGnGlwTjHcbpdX3qwO/J4nmiVQrlT3s4aElc6Ieix5sCwY9S+UIUudkBy6/gNqADxoxgdiiATk7qC7tcIhdvUFupm3LNJodqVC6wEQMbfGc7IKej3MfHScakjhcRYOSb1LvPKqqW3CNVcz9YdNyJRL8cdL4LEl7dDBAGAmVMXPZYvIjLw+VoCWCSmi3yTYBdFjga9pT8/mqX/lPC6rvQ+laS1D1QCXhOeIANDQ20xUmMWKxrwudjaMSHiq/oz80A+NE8hl6jsQRJGmXj6m2KgmGddGr3ECS6ovP+OZosirBqcZbV/ThXAuoS308J5W+lhdm+bPMMz0ry9n0m2MepGJ8kYZ02GupoyZ1dDnhjF2wH53RhJj2qkJz0AlB4zkqrHcY8MmCCozRCaS4VASNC5dxc+smdtY5fAL9MNOQTzMhOethySFxMe05OGs7HQORcYSLlCwcHWpuuXur/YpnPMtbfAvapQ/ew4kEL/tr1soMfcfmfRpGNPwdQL3OZo/YAb+c7UX0yE4pvCOnZR6ezUV2h738drnY9PNCSQb7d5o3I0FTMp11WBQgzJ7sOREsb8GyUWXFegbo4nAJGARP71+nCoDpnxBPzqtF0C551QmHWBKcWm+AkI+y/nzSt+kHloIgxSzH0XLIsZCDFOCBM3g2SESNVuOeXgdNjIHmHKZNs65zrSXaPcVSirDTPs4pIOo/hArWsCyvvUDp9j115bHU00SjFdreUkGUGS9zPiUqJhpeoyC5MjXdTBf7PxPvqAUZ/JVcPT6zTbfQtpbc+PmKxQCM0t0F2h2wK4rq4Zb/134CVb9ncjx1ZKGB5F4IYT/naB3uU1oB75VAonocFiNd62Dg7F/AAGWSHJGKWhg242IolSqZpy80Vay9yfqKJ10zA7uoh+nt4YRlyzcPHdtyXFQ1mkQEAIiwzNucmINNZ7TjH2XuBjlV8JC2myP5kkXk21aXbHjC9AOhVLJpgbIkWr6IDHjJUWTv88md0jnhGNjKsgXqsAtxiQ0vtY9nucwgx1FJwU4XuOPYVnhbxatBlQrfBXpPHdWn2yQFvdCAeEKVYPXEKoSQsD0prp5nPdUJDtLNbW9zcSRKXUY4dASyulwdDlA2vuKu+cGvE2ZXDUzzkfhR868Yn6ShxDJ7Zgd8SWrPOIyG9KnELowBJuqZxLMkITryDPmfIGG/WJ7htAAI1UFEIP27BOufT+xy6RLCeHfAzNIvzBzMRWKse79/dpzpAfi+9ozgqXsnWAzslqpqgIg1sCnF0/Znz66sKFQ==");

        Base64String script = new Base64String("BAbMtW/U");

        return Stream.of( //todo add first arg as more descriptive test name (in all suites)
                arguments(1, minName, minDescription, 0, false, Base64String.empty(), Id.as("9XyxaGepzteh4QDBaRvNBCiNmjyNMSeEQpgu4vtJFCWJ"),
                        Proof.list(Proof.as("3EBrdH9voEN9jDzTv33CpiwFaTbvokUYy691f2bjuQbsivYtDFf3TLZkftMU2AMMYukd1ApmU9LxkoZTuiAsXR7M")),
                        Base64.decode("A42Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AATq/SBqAAB//////////wAAAAAAAAX14QEAAAF0h26AAA=="),
                        Base64.decode("A29n9rA7uy2/QZnzqjvAHDe1A9rs/KuPeRilZpzgwEeq6aAX5ymgwEPQTTI/fdzzGj+diZRBGQJiihCzukTBmYADjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QABOr9IGoAAH//////////AAAAAAAABfXhAQAAAXSHboAA")
                ),

                arguments(1, maxName, maxDescription, 8, true, Base64String.empty(), Id.as("GjDZvRJ6PuuuG9vFWrav6G3gJWSUBLrwupSxy7RJbLTw"),
                        Proof.list(Proof.as("3E2KdRrJRKq45EN7YrdtTDJtWoAvKq9zrjEDE9RKVGnHB91z5xAp8Ka2bafGBJ6Xpp9xTCBFyxj8o5kcqa7SGkt7")),
                        Base64.decode("A42Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0ABB/EXfS8jtTbKeGIaeY5XpaA+hPzgUWsaHUP2KpOSIq+wW2rU0UaxysOePL5grYPvjjHNFJhFynZ/+oacaXBOMdxul1ferA78nieaJVCuVPezhoSVzoh6LHmwLBj1L5QhS52QHLr+A2oAPGjGB2KIBOTuoLu1wiF29QW6mbcs0mh2pULrARAxt8Zzsgp6Pcx8dJxqSOFxFg5JvUu88qqpbcI1VzP1h03IlEvxx0vgsSXt0MEAYCZUxc9li8iMvD5WgJYJKaLfJNgF0WOBr2lPz+apf+U8Lqu9D6VpLUPVAJeE54gA0NDbTFSYxYrGvC52NoxIeKr+jPzQD40TyGXqOxBEkaZePqbYqCYZ10avcQJLqi8/45miyKsGpxltX9OFcC6hLfTwnlb6WF2b5s8wzPSvL2fSbYx6kYnyRhnTYa6mjJnV0OeGMXbAfndGEmPaqQnPQCUHjOSqsdxjwyYIKjNEJpLhUBI0Ll3Fz6yZ21jl8Av0w05BPMyE562HJIXEx7Tk4azsdA5FxhIuULBwdam65e6v9imc8y1t8C9qlD97DiQQv+2vWygx9x+Z9GkY0/B1Avc5mj9gBv5ztRfTITim8I6dlHp7NRXaHvfx2udj080JJBvt3mjcjQVMynXVYFCDMnuw5ESxvwbJRZcV6BujicAkYBE/vX6cKgOmfEE/Oq0XQLnnVCYdYEpxab4CQj7L+fNK36QeWgiDFLMfRcsixkIMU4IEzeDZIRI1W455eB02MgeYcpk2zrnOtJdo9xVKKsNM+zikg6j+ECtawLK+9QOn2PXXlsdTTRKMV2t5SQZQZL3M+JSomGl6jILkyNd1MF/s/E++oBRn8lVw9PrNNt9C2ltz4+YrFAIzS3QXaHbAriurhlv/XfgJVv2dyPHVkoYHkXghhP+doHe5TWgHvlUCiehwWI13rYODsX8AAZZIckYpaGDbjYiiVKpmnLzRVrL3J+oonXTMDu6iH6e3hhGXLNw8d23JcVDWaRAQAiLDM25yYg01ntOMfZe4GOVXwkLabI/mSReTbVpdseML0A6FUsmmBsiRavogMeMlRZO/zyZ3SOeEY2MqyBeqwC3GJDS+1j2e5zCDHUUnBThe449hWeFvFq0GVCt8Fek8d1afbJAW90IB4QpVg9cQqhJCwPSmunmc91QkO0s1tb3NxJEpdRjh0BLK6XB0OUDa+4q75wa8TZlcNTPOR+FHzrxifpKHEMntmB3xJas84jIb0qcQujAEm6pnEsyQhOvIM+Z8gYb9YnuG0AAjVQUQg/bsE659P7HLpEsJ4d8DM0i/MHMxFYqx7v392nOkB+L72jOCpeydYDOyWqmqAiDWwKcXT9mfPrqwoVf/////////8IAQAAAAAF9eEBAAABdIdugAA="),
                        Base64.decode("A29DrD1wLrwfJJMK9Ok/lQtiNAEleYqy/dvJ3Ot91JiTV/uUbvKuZ5mUHOm1/nCxvoXRcmMOTUKW4aqLFRZhqIgDjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QAEH8Rd9LyO1Nsp4Yhp5jleloD6E/OBRaxodQ/Yqk5Iir7BbatTRRrHKw548vmCtg++OMc0UmEXKdn/6hpxpcE4x3G6XV96sDvyeJ5olUK5U97OGhJXOiHosebAsGPUvlCFLnZAcuv4DagA8aMYHYogE5O6gu7XCIXb1BbqZtyzSaHalQusBEDG3xnOyCno9zHx0nGpI4XEWDkm9S7zyqqltwjVXM/WHTciUS/HHS+CxJe3QwQBgJlTFz2WLyIy8PlaAlgkpot8k2AXRY4GvaU/P5ql/5Twuq70PpWktQ9UAl4TniADQ0NtMVJjFisa8LnY2jEh4qv6M/NAPjRPIZeo7EESRpl4+ptioJhnXRq9xAkuqLz/jmaLIqwanGW1f04VwLqEt9PCeVvpYXZvmzzDM9K8vZ9JtjHqRifJGGdNhrqaMmdXQ54YxdsB+d0YSY9qpCc9AJQeM5Kqx3GPDJggqM0QmkuFQEjQuXcXPrJnbWOXwC/TDTkE8zITnrYckhcTHtOThrOx0DkXGEi5QsHB1qbrl7q/2KZzzLW3wL2qUP3sOJBC/7a9bKDH3H5n0aRjT8HUC9zmaP2AG/nO1F9MhOKbwjp2Uens1Fdoe9/Ha52PTzQkkG+3eaNyNBUzKddVgUIMye7DkRLG/BslFlxXoG6OJwCRgET+9fpwqA6Z8QT86rRdAuedUJh1gSnFpvgJCPsv580rfpB5aCIMUsx9FyyLGQgxTggTN4NkhEjVbjnl4HTYyB5hymTbOuc60l2j3FUoqw0z7OKSDqP4QK1rAsr71A6fY9deWx1NNEoxXa3lJBlBkvcz4lKiYaXqMguTI13UwX+z8T76gFGfyVXD0+s0230LaW3Pj5isUAjNLdBdodsCuK6uGW/9d+AlW/Z3I8dWShgeReCGE/52gd7lNaAe+VQKJ6HBYjXetg4OxfwABlkhyRiloYNuNiKJUqmacvNFWsvcn6iiddMwO7qIfp7eGEZcs3Dx3bclxUNZpEBACIsMzbnJiDTWe04x9l7gY5VfCQtpsj+ZJF5NtWl2x4wvQDoVSyaYGyJFq+iAx4yVFk7/PJndI54RjYyrIF6rALcYkNL7WPZ7nMIMdRScFOF7jj2FZ4W8WrQZUK3wV6Tx3Vp9skBb3QgHhClWD1xCqEkLA9Ka6eZz3VCQ7SzW1vc3EkSl1GOHQEsrpcHQ5QNr7irvnBrxNmVw1M85H4UfOvGJ+kocQye2YHfElqzziMhvSpxC6MASbqmcSzJCE68gz5nyBhv1ie4bQACNVBRCD9uwTrn0/scukSwnh3wMzSL8wczEVirHu/f3ac6QH4vvaM4Kl7J1gM7JaqaoCINbApxdP2Z8+urChV//////////wgBAAAAAAX14QEAAAF0h26AAA==")
                ),

                arguments(2, minName, minDescription, 0, false, Base64String.empty(), Id.as("GHFtf9tHfYSJghU5a8LLbze3xv9Zed9hvQzh2Lh19nKh"),
                        Proof.list(Proof.as("2mGacR3HMCGTLpdj2vY9VuRZ4yuow9A4oPMZn5Jten3TDUNPzzmSbeQ4qmcSiDs79xwwmhWehLjAJTmobJ8hQdSG")),
                        Base64.decode("AwJSjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QABOr9IGoAAH//////////AAAAAAAABfXhAQAAAXSHboAAAA=="),
                        Base64.decode("AAMCUo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AATq/SBqAAB//////////wAAAAAAAAX14QEAAAF0h26AAAABAAEAQFgxTDKz1foxQ8zTWr6Aivo5IlaxfPaWWNU06U2qfPEKhUMJuSNdn0QZpZW0No3w65shY0Qk9S061+1iEWbmz4E=")
                ),

                arguments(2, maxName, maxDescription, 8, true, script, Id.as("8b8UuNVwbsZAYj6RdwwrxVZAXbx1mvtHm9YDCv9DJt1Z"),
                        Proof.list(Proof.as("2n3SSQNqHSrHBcGv5bZVubsKB5VK8K14sGAU4Km7bWwf1fEsUqEpRN2UUxRwHUGUCWNcuxVBB6b3CKvrVZRFs6KK"), Proof.as("3NFtNobkn863R8soipVXhBa9rtgGqd5kdrforiaAzgpUaNfPmjRNDYnP8LBFAYXAcANfNshZWEy1QZMSSZZEnJHj"), Proof.as("n5UX4FmZNjkXsyU8oDSJHzJSgH9dFysGNTtzu6CCMEkGzjWXLa8d6A78FfWix82AMQnetx23xFgx8AguQSCRrSh"), Proof.as("Yopwu21d5E11NWr69xibtxhzeAyGPRz8ir7K4QACX7b1oysGzrHkoH94a7j8rMimXVWPB4uRM7bMmxbxB5xqANN"), Proof.as("2k5E45AFsHvJeDYwtijx8sQ2kyqanfzFZsZQCFtfGshC8ujSSkFfbAPusnxMzszWvqjaCo5bs3hLyKGBUHPEUT3e"), Proof.as("ga3i5Qknd6RbV5qax4GMMHUk3huD5bqiLR5btefLdsGeW3p5SBAfm1AvTK8AQuwqW11M2iEEoUkSbmg3TjwgnqP"), Proof.as("425bBW54MpJqwrFUbqYREJCgZaXdExp8PxixvjZaiyKHXDE1iKAhtrQoHyHjKrTH3XGVFANDeQz3dmPjbdYgFyCr"), Proof.as("LtuLq4bNh8BoX7PNkbuFVGyENxm4BKcX7M4RaXc76Qa3mJgpGzT7A6TEhMReZry5tyv4cDaCdnuK58RiQqRnizQ")),
                        Base64.decode("AwJSjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QAEH8Rd9LyO1Nsp4Yhp5jleloD6E/OBRaxodQ/Yqk5Iir7BbatTRRrHKw548vmCtg++OMc0UmEXKdn/6hpxpcE4x3G6XV96sDvyeJ5olUK5U97OGhJXOiHosebAsGPUvlCFLnZAcuv4DagA8aMYHYogE5O6gu7XCIXb1BbqZtyzSaHalQusBEDG3xnOyCno9zHx0nGpI4XEWDkm9S7zyqqltwjVXM/WHTciUS/HHS+CxJe3QwQBgJlTFz2WLyIy8PlaAlgkpot8k2AXRY4GvaU/P5ql/5Twuq70PpWktQ9UAl4TniADQ0NtMVJjFisa8LnY2jEh4qv6M/NAPjRPIZeo7EESRpl4+ptioJhnXRq9xAkuqLz/jmaLIqwanGW1f04VwLqEt9PCeVvpYXZvmzzDM9K8vZ9JtjHqRifJGGdNhrqaMmdXQ54YxdsB+d0YSY9qpCc9AJQeM5Kqx3GPDJggqM0QmkuFQEjQuXcXPrJnbWOXwC/TDTkE8zITnrYckhcTHtOThrOx0DkXGEi5QsHB1qbrl7q/2KZzzLW3wL2qUP3sOJBC/7a9bKDH3H5n0aRjT8HUC9zmaP2AG/nO1F9MhOKbwjp2Uens1Fdoe9/Ha52PTzQkkG+3eaNyNBUzKddVgUIMye7DkRLG/BslFlxXoG6OJwCRgET+9fpwqA6Z8QT86rRdAuedUJh1gSnFpvgJCPsv580rfpB5aCIMUsx9FyyLGQgxTggTN4NkhEjVbjnl4HTYyB5hymTbOuc60l2j3FUoqw0z7OKSDqP4QK1rAsr71A6fY9deWx1NNEoxXa3lJBlBkvcz4lKiYaXqMguTI13UwX+z8T76gFGfyVXD0+s0230LaW3Pj5isUAjNLdBdodsCuK6uGW/9d+AlW/Z3I8dWShgeReCGE/52gd7lNaAe+VQKJ6HBYjXetg4OxfwABlkhyRiloYNuNiKJUqmacvNFWsvcn6iiddMwO7qIfp7eGEZcs3Dx3bclxUNZpEBACIsMzbnJiDTWe04x9l7gY5VfCQtpsj+ZJF5NtWl2x4wvQDoVSyaYGyJFq+iAx4yVFk7/PJndI54RjYyrIF6rALcYkNL7WPZ7nMIMdRScFOF7jj2FZ4W8WrQZUK3wV6Tx3Vp9skBb3QgHhClWD1xCqEkLA9Ka6eZz3VCQ7SzW1vc3EkSl1GOHQEsrpcHQ5QNr7irvnBrxNmVw1M85H4UfOvGJ+kocQye2YHfElqzziMhvSpxC6MASbqmcSzJCE68gz5nyBhv1ie4bQACNVBRCD9uwTrn0/scukSwnh3wMzSL8wczEVirHu/f3ac6QH4vvaM4Kl7J1gM7JaqaoCINbApxdP2Z8+urChV//////////wgBAAAAAAX14QEAAAF0h26AAAEABgQGzLVv1A=="),
                        Base64.decode("AAMCUo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0ABB/EXfS8jtTbKeGIaeY5XpaA+hPzgUWsaHUP2KpOSIq+wW2rU0UaxysOePL5grYPvjjHNFJhFynZ/+oacaXBOMdxul1ferA78nieaJVCuVPezhoSVzoh6LHmwLBj1L5QhS52QHLr+A2oAPGjGB2KIBOTuoLu1wiF29QW6mbcs0mh2pULrARAxt8Zzsgp6Pcx8dJxqSOFxFg5JvUu88qqpbcI1VzP1h03IlEvxx0vgsSXt0MEAYCZUxc9li8iMvD5WgJYJKaLfJNgF0WOBr2lPz+apf+U8Lqu9D6VpLUPVAJeE54gA0NDbTFSYxYrGvC52NoxIeKr+jPzQD40TyGXqOxBEkaZePqbYqCYZ10avcQJLqi8/45miyKsGpxltX9OFcC6hLfTwnlb6WF2b5s8wzPSvL2fSbYx6kYnyRhnTYa6mjJnV0OeGMXbAfndGEmPaqQnPQCUHjOSqsdxjwyYIKjNEJpLhUBI0Ll3Fz6yZ21jl8Av0w05BPMyE562HJIXEx7Tk4azsdA5FxhIuULBwdam65e6v9imc8y1t8C9qlD97DiQQv+2vWygx9x+Z9GkY0/B1Avc5mj9gBv5ztRfTITim8I6dlHp7NRXaHvfx2udj080JJBvt3mjcjQVMynXVYFCDMnuw5ESxvwbJRZcV6BujicAkYBE/vX6cKgOmfEE/Oq0XQLnnVCYdYEpxab4CQj7L+fNK36QeWgiDFLMfRcsixkIMU4IEzeDZIRI1W455eB02MgeYcpk2zrnOtJdo9xVKKsNM+zikg6j+ECtawLK+9QOn2PXXlsdTTRKMV2t5SQZQZL3M+JSomGl6jILkyNd1MF/s/E++oBRn8lVw9PrNNt9C2ltz4+YrFAIzS3QXaHbAriurhlv/XfgJVv2dyPHVkoYHkXghhP+doHe5TWgHvlUCiehwWI13rYODsX8AAZZIckYpaGDbjYiiVKpmnLzRVrL3J+oonXTMDu6iH6e3hhGXLNw8d23JcVDWaRAQAiLDM25yYg01ntOMfZe4GOVXwkLabI/mSReTbVpdseML0A6FUsmmBsiRavogMeMlRZO/zyZ3SOeEY2MqyBeqwC3GJDS+1j2e5zCDHUUnBThe449hWeFvFq0GVCt8Fek8d1afbJAW90IB4QpVg9cQqhJCwPSmunmc91QkO0s1tb3NxJEpdRjh0BLK6XB0OUDa+4q75wa8TZlcNTPOR+FHzrxifpKHEMntmB3xJas84jIb0qcQujAEm6pnEsyQhOvIM+Z8gYb9YnuG0AAjVQUQg/bsE659P7HLpEsJ4d8DM0i/MHMxFYqx7v392nOkB+L72jOCpeydYDOyWqmqAiDWwKcXT9mfPrqwoVf/////////8IAQAAAAAF9eEBAAABdIdugAABAAYEBsy1b9QBAAgAQFjcC1SQjMN85iCOBxsYCyr8RBcM6gkgDnasnxQGz6JgkQOqxq0a+rUUa5MiRly4o7HFz0gNPOnWuHkhcOdpAIoAQHZda83jugyXOXqHDj26y/wgq2QIMp0q564bE2HSZR3a88459/tK+7gOPLHZNcXAug4lZit7EbvgtjLfM4dc4YYAQCbfcRd2vCH3jy5glg4bO6xABbBsMdtCaCtSCmea6PjL0MHtaKq6GOods/chKfsd5+UGLJMoqIzdgzFUziWtkIYAQBtt8N9rk4xBCHaHR0FcLXPxBKKKraDhWF+qKPK92UmBMdFdys33HzSIXtiPA4ftITMVX55PPTATW13DAwQLT4sAQFcpUI/L7tR7ARdg8EtocUav0ill6TJtpHEyARz1l1KX+OEeq6YQm5v2AJMyqa2tg0SGyTfTA8lJVoRf/PFD5YkAQCIfm5tE4izup7HxK+tmHTiAnclrQnudx0W6x9OM6333lk7H8M4OuS+XnxsdTzm58vijwUP1ZFx+B6R5GFojuoIAQJb7Samyz9T1bQ96rRA2C5cGYLATwhtbRRvEIPGF0KuyBSw03XGSYxgN8tQweMxeSinlZZwMizAS6ELAEW9iKI8AQBEoFajEC+kfAgC29oETr20KQok/oZE6RJZGQxUdkwIVDKzK3hfyBXJQjA4kkADolQgbgNS3rPdOB//Lo0BG1I0=")
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("oldTransactionsProvider")
    void issueTransactionWithByteName(int version, byte[] name, byte[] description, int decimals, boolean reissuable,
                                      Base64String script, Id expectedId, List<Proof> proofs, byte[] expectedBody,
                                      byte[] expectedBytes) throws IOException {
        IssueTransaction constructedTx = new IssueTransaction(sender, name, description, quantity, decimals,
                reissuable, script, WavesConfig.chainId(), Amount.of(fee), timestamp, version, proofs);

        assertAll("Tx created via builder must be equal to expected bytes",
                () -> assertThat(constructedTx.bodyBytes()).isEqualTo(expectedBody),
                () -> assertThat(constructedTx.id()).isEqualTo(expectedId),
                () -> assertThat(constructedTx.toBytes()).isEqualTo(expectedBytes)
        );

        IssueTransaction deserTx = IssueTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> assertThat(deserTx.nameBytes()).isEqualTo(name),
                () -> assertThat(deserTx.name()).isEqualTo(new String(name, UTF_8)),
                () -> assertThat(deserTx.descriptionBytes()).isEqualTo(description),
                () -> assertThat(deserTx.description()).isEqualTo(new String(description, UTF_8)),
                () -> assertThat(deserTx.quantity()).isEqualTo(quantity),
                () -> assertThat(deserTx.decimals()).isEqualTo(decimals),
                () -> assertThat(deserTx.reissuable()).isEqualTo(reissuable),
                () -> assertThat(deserTx.script()).isEqualTo(script),

                () -> assertThat(deserTx.version()).isEqualTo(version),
                () -> assertThat(deserTx.chainId()).isEqualTo(WavesConfig.chainId()),
                () -> assertThat(deserTx.sender()).isEqualTo(sender),
                () -> assertThat(deserTx.fee()).isEqualTo(Amount.of(fee, AssetId.WAVES)),
                () -> assertThat(deserTx.timestamp()).isEqualTo(timestamp),
                () -> assertThat(deserTx.proofs()).isEqualTo(proofs),

                () -> assertThat(deserTx.toBytes()).isEqualTo(expectedBytes),
                () -> assertThat(deserTx.bodyBytes()).isEqualTo(expectedBody),
                () -> assertThat(deserTx.id()).isEqualTo(expectedId)
        );

        assertThat(constructedTx)
                .describedAs("Tx must be equal to deserialized tx")
                .isEqualTo(deserTx);
    }

}
