package im.mak.waves.transactions;

import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.crypto.base.Base64;
import im.mak.waves.transactions.common.*;
import im.mak.waves.transactions.data.*;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static im.mak.waves.transactions.serializers.JsonSerializer.JSON_MAPPER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.params.provider.Arguments.arguments;

public class DataTransactionTest {

    static PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
    static long timestamp = 1600000000000L;
    long fee = DataTransaction.MIN_FEE + 1;

    @BeforeAll
    static void beforeAll() {
        Waves.chainId = 'R';
    }

    static Stream<Arguments> transactionsProvider() {
        String str = "aaaa";

        List<DataEntry> entriesV1 = new ArrayList<>();
        entriesV1.add(new BooleanEntry("bool", true));
        entriesV1.add(IntegerEntry.as("int", Long.MAX_VALUE));
        entriesV1.add(new BinaryEntry("bin", str.getBytes()));
        entriesV1.add(new StringEntry("str", str));

        List<DataEntry> entriesV2 = new ArrayList<>(entriesV1);
        entriesV2.add(new DeleteEntry("del"));

        return Stream.of(
                arguments(1, entriesV1, Id.as("H6BaWKEMRpj7LZRoUm2gyr4Gx2LkatKsazdtNedzjnP8"),
                        Proof.list(Proof.as("65kVxi4W2zfRREUSqb5uDkfCJaPNa31Y8gLhRh1tCXhF86b5vUAuRnDkJpzq44jg6uvJy2TLNvsHQ4vWQas9h5hp")),
                        Base64.decode("DAGNj7KNwHV8CsVGLbpgRgDsF4sHe1SAkroj0YoxaGM3dAAEAARib29sAQEAA2ludAB//////////wADYmluAgAEYWFhYQADc3RyAwAEYWFhYQAAAXSHboAAAAAAAAABhqE="),
                        Base64.decode("AAwBjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QABAAEYm9vbAEBAANpbnQAf/////////8AA2JpbgIABGFhYWEAA3N0cgMABGFhYWEAAAF0h26AAAAAAAAAAYahAQABAED+LmM4bBKE0shoPJOhKxqsOXccDu7yUtdVs585BmVY6atXnf0dAog3MsDWNN0lN4CeUrOaWDn4enCFc4SIuXiP"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"data\":[{\"type\":\"boolean\",\"value\":true,\"key\":\"bool\"},{\"type\":\"integer\",\"value\":9223372036854775807,\"key\":\"int\"},{\"type\":\"binary\",\"value\":\"base64:YWFhYQ==\",\"key\":\"bin\"},{\"type\":\"string\",\"value\":\"aaaa\",\"key\":\"str\"}],\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"proofs\":[\"65kVxi4W2zfRREUSqb5uDkfCJaPNa31Y8gLhRh1tCXhF86b5vUAuRnDkJpzq44jg6uvJy2TLNvsHQ4vWQas9h5hp\"],\"fee\":100001,\"id\":\"H6BaWKEMRpj7LZRoUm2gyr4Gx2LkatKsazdtNedzjnP8\",\"type\":12,\"version\":1,\"timestamp\":1600000000000}"
                ),
                arguments(2, entriesV2, Id.as("5T7SYvQmdcQqbPhFW6fs4N1cED4kbpN4X5qxbUGmDsGJ"),
                        Proof.list(Proof.as("25FY5wjxnTWZnBHuLG4jEY9aveNVSfFFTrk4GhE3G6ECijFKb7YGEN43XdaWbLZ91UrMgrBjmpnk58m9k6xXMPnV")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigCggc8CggKBGJvb2xYAQoPCgNpbnRQ//////////9/CgsKA2JpbmIEYWFhYQoLCgNzdHJqBGFhYWEKBQoDZGVs"),
                        Base64.decode("CnIIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBChjQYggIC6u8guKAKCBzwKCAoEYm9vbFgBCg8KA2ludFD//////////38KCwoDYmluYgRhYWFhCgsKA3N0cmoEYWFhYQoFCgNkZWwSQDWuvQNUFI8ceUpEsu5SypzeLUGZFjdFLkaByQ3ragBPoU77Z9Y7SSF8teoF5zzXMHG5ML9ZQrbR3UlUgwVnkoY="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"data\":[{\"type\":\"boolean\",\"value\":true,\"key\":\"bool\"},{\"type\":\"integer\",\"value\":9223372036854775807,\"key\":\"int\"},{\"type\":\"binary\",\"value\":\"base64:YWFhYQ==\",\"key\":\"bin\"},{\"type\":\"string\",\"value\":\"aaaa\",\"key\":\"str\"},{\"key\":\"del\",\"value\":null}],\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"25FY5wjxnTWZnBHuLG4jEY9aveNVSfFFTrk4GhE3G6ECijFKb7YGEN43XdaWbLZ91UrMgrBjmpnk58m9k6xXMPnV\"],\"fee\":100001,\"id\":\"5T7SYvQmdcQqbPhFW6fs4N1cED4kbpN4X5qxbUGmDsGJ\",\"type\":12,\"version\":2,\"timestamp\":1600000000000}"
                ),
                arguments(2, entriesV2, Id.as("5T7SYvQmdcQqbPhFW6fs4N1cED4kbpN4X5qxbUGmDsGJ"),
                        Proof.list(Proof.as("s7f9Z9LvPb2gXPujpaQLNgFrotP6FVg3oDhmcJbV8RaBBohjk732UkGH9Ahmby3KacpPGxqfCns6RnWQMjLgAUP"), Proof.as("2JzFRQhnMysUYrvCBP87SWqs8zTE2aeu7qzYJ8fBQtjAtNdtSshvsCCFgSdbXP7Vd7NAiASDJiY5ByevySMYNbHg"), Proof.as("5KE21N9RAiQcRTjXv79oK61FDGndmg5Mq5qjXCvsYFMPGTFTZSCUzmCXZPxBFjQhgdKK433BeVe1mYbvYEtcCiYo"), Proof.as("4Q28pp5V1X5itqoygADT4AGe6rB5pHyfJXQgJ13GQnTa7xDVpN7uGatezUPaU5L37kMatQGGTUNAs7kotgSEMK1t"), Proof.as("3LJUNvz1evQpU26DzpLqZkE2ZeWCHQZn8XbXz31PaS7zLkk8HWyYNJjeLkcCPDRyvui6mAcruu557aTZmuS5g41j"), Proof.as("3hZQeQQqU435ce5Fqrf8mEZBfX3J4q5oztLrjMoqGKFEc1heY5DWeXuouYzWa8kPrQvzBXrsYwFCa2y8N6UKfsHm"), Proof.as("43RKAskxmXaE5LXHdBpiu8Ne2t7XWqVTu6f766RfQQ4wouBpu22guKFGoXeSd9hkMXYsRRrhe6sfAHDdMCZjQnvs"), Proof.as("3cBR8nA7667GATKQFMBEnBCFGUC3YUgwFfE3yG8qZLxYeuRLHmNVpLnD9AvwFyLqv4SBLsBNuYgfrGkuF1NUNHAf")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigCggc8CggKBGJvb2xYAQoPCgNpbnRQ//////////9/CgsKA2JpbmIEYWFhYQoLCgNzdHJqBGFhYWEKBQoDZGVs"),
                        Base64.decode("CnIIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBChjQYggIC6u8guKAKCBzwKCAoEYm9vbFgBCg8KA2ludFD//////////38KCwoDYmluYgRhYWFhCgsKA3N0cmoEYWFhYQoFCgNkZWwSQCs3k0c2eNqPFuswpt8t1LPtKb7q5+RwHgHdusos4ziWIJIi/yiuPPit7pxbQtdG8R9p72i3de8zWsin14AXYoASQEGHQYanZQUIrAgd+nTWtWelweuNod/Q0t0Zft5eERi50ORDHs7Kggr4X389/v9UgcxcOLVyTxo/SlT5NAfcPIcSQNfIt+mPxrD768g+J3FuaZ5/FIEM5eG7jqoShvoqsSD/5Hj8gRLSNHUFogHdsT8J5kGkNMVkAnGNc0uNego7tYASQKnm9lQoIuBouDRIT/7VaIR4Crg4xbn+NmEPVsdL3Ee785BlmQRx499QjZ92O5uY33cT5IhOouLSxGrSlekEzYsSQHStvFk9ciXHmTf5JXjUlopsQf9ICZ4nDNXdA4WOA51HcP0Z6fI1xt9aX5/LLerFITyBFzx1Pq/hiD96L7EQn44SQIcCpLUfXQ1OH01KEvREMGM9Ok4NqpZZLSlYFkpbj+fnpw7Z7yDYomnnmpmvQaSFguJKMbaw0Z6G4h0RM8KrmIQSQJgjIKFZaxy7fqeju82ZWkgjn+3qck6R2qVGKMD8YfV4ZslDv3zjYAYfwPw2mn9nPMDK9WMLzExdabzgz8N9SIASQIJfHR74gQ4kRiYXkSfA5U8ieQCE+bAMALJCOrMHjwLlxm9kxnDPmSrVhpDQR9Fp1s5/od2e2v0WmhhOhwE1SYg="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"data\":[{\"type\":\"boolean\",\"value\":true,\"key\":\"bool\"},{\"type\":\"integer\",\"value\":9223372036854775807,\"key\":\"int\"},{\"type\":\"binary\",\"value\":\"base64:YWFhYQ==\",\"key\":\"bin\"},{\"type\":\"string\",\"value\":\"aaaa\",\"key\":\"str\"},{\"key\":\"del\",\"value\":null}],\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"s7f9Z9LvPb2gXPujpaQLNgFrotP6FVg3oDhmcJbV8RaBBohjk732UkGH9Ahmby3KacpPGxqfCns6RnWQMjLgAUP\",\"2JzFRQhnMysUYrvCBP87SWqs8zTE2aeu7qzYJ8fBQtjAtNdtSshvsCCFgSdbXP7Vd7NAiASDJiY5ByevySMYNbHg\",\"5KE21N9RAiQcRTjXv79oK61FDGndmg5Mq5qjXCvsYFMPGTFTZSCUzmCXZPxBFjQhgdKK433BeVe1mYbvYEtcCiYo\",\"4Q28pp5V1X5itqoygADT4AGe6rB5pHyfJXQgJ13GQnTa7xDVpN7uGatezUPaU5L37kMatQGGTUNAs7kotgSEMK1t\",\"3LJUNvz1evQpU26DzpLqZkE2ZeWCHQZn8XbXz31PaS7zLkk8HWyYNJjeLkcCPDRyvui6mAcruu557aTZmuS5g41j\",\"3hZQeQQqU435ce5Fqrf8mEZBfX3J4q5oztLrjMoqGKFEc1heY5DWeXuouYzWa8kPrQvzBXrsYwFCa2y8N6UKfsHm\",\"43RKAskxmXaE5LXHdBpiu8Ne2t7XWqVTu6f766RfQQ4wouBpu22guKFGoXeSd9hkMXYsRRrhe6sfAHDdMCZjQnvs\",\"3cBR8nA7667GATKQFMBEnBCFGUC3YUgwFfE3yG8qZLxYeuRLHmNVpLnD9AvwFyLqv4SBLsBNuYgfrGkuF1NUNHAf\"],\"fee\":100001,\"id\":\"5T7SYvQmdcQqbPhFW6fs4N1cED4kbpN4X5qxbUGmDsGJ\",\"type\":12,\"version\":2,\"timestamp\":1600000000000}"
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("transactionsProvider")
    void dataTransaction(int version, List<DataEntry> entries, Id expectedId, List<Proof> proofs,
                         byte[] expectedBody, byte[] expectedBytes, String expectedJson) throws IOException {
        DataTransaction builtTx = DataTransaction
                .with(entries)
                .chainId(Waves.chainId)
                .fee(fee)
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

        DataTransaction constructedTx = new DataTransaction(sender, entries,
                Waves.chainId, Amount.of(fee), timestamp, version, proofs);

        assertAll("Txs created via builder and constructor are equal",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(constructedTx.bodyBytes()),
                () -> assertThat(builtTx.id()).isEqualTo(constructedTx.id()),
                () -> assertThat(builtTx.toBytes()).isEqualTo(constructedTx.toBytes())
        );

        DataTransaction deserTx = DataTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> assertThat(deserTx.data()).containsExactlyElementsOf(entries),

                () -> assertThat(deserTx.version()).isEqualTo(version),
                () -> assertThat(deserTx.chainId()).isEqualTo(Waves.chainId),
                () -> assertThat(deserTx.sender()).isEqualTo(sender),
                () -> assertThat(deserTx.fee()).isEqualTo(Amount.of(fee, Asset.WAVES)),
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
