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

import static im.mak.waves.transactions.serializers.JsonSerializer.JSON_MAPPER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.params.provider.Arguments.arguments;

public class BurnTransactionTest {

    static PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
    static long timestamp = 1600000000000L;
    AssetId assetId = AssetId.as("D4H5agQLLDLEjbM2ZgHoyTe9M9Apj4t1DFSDob6c5ptb");
    static long amount = Long.MAX_VALUE;
    long fee = BurnTransaction.MIN_FEE + 1;

    @BeforeAll
    static void beforeAll() {
        Waves.chainId = 'R';
    }

    static Stream<Arguments> transactionsProvider() {
        return Stream.of(
                arguments(1, Id.as("AsAoCWzNGf8Udz8sgaL6gJMjNqDCdQFfMpTvGKcApd9"),
                        Proof.list(Proof.as("fAAmtMEwTcpDo73Yf52GjEmkLjjjSRCPaQDhKRqpPbjEN15LdzVkHA5tQBTqHaxE4UqJCcDkKUGBYGXHKyjPZoK")),
                        Base64.decode("Bo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0syMqhZeHYKv3pP1ENUwnwAlfWq80CH9/mX0vxihBuLx//////////wAAAAAAAYahAAABdIdugAA="),
                        Base64.decode("Bo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0syMqhZeHYKv3pP1ENUwnwAlfWq80CH9/mX0vxihBuLx//////////wAAAAAAAYahAAABdIdugAAg5/S4nZg23WkHb/HiqfBn6ZHTzdXplwknvMmaVzM3Li+FyNSCbILzqEu4mykarDs0vLt97hu9PeJDzfPFcuaO"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"amount\":9223372036854775807,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"signature\":\"fAAmtMEwTcpDo73Yf52GjEmkLjjjSRCPaQDhKRqpPbjEN15LdzVkHA5tQBTqHaxE4UqJCcDkKUGBYGXHKyjPZoK\",\"proofs\":[\"fAAmtMEwTcpDo73Yf52GjEmkLjjjSRCPaQDhKRqpPbjEN15LdzVkHA5tQBTqHaxE4UqJCcDkKUGBYGXHKyjPZoK\"],\"assetId\":\"D4H5agQLLDLEjbM2ZgHoyTe9M9Apj4t1DFSDob6c5ptb\",\"fee\":100001,\"id\":\"AsAoCWzNGf8Udz8sgaL6gJMjNqDCdQFfMpTvGKcApd9\",\"type\":6,\"version\":1,\"timestamp\":1600000000000}"
                ),
                arguments(2, Id.as("6L4GZVPsCo27rTwKByU37wEa2P7rhLsfgPm5BAZbqZRD"),
                        Proof.list(Proof.as("Y1rUcawqVhuhp5TDE7SbFiHStTr5AMHNV5uDFmiKzhRmXp1n6RCnQAkpENQavCcNV4jSHf54XQusiZ4XsHHA46S")),
                        Base64.decode("BgJSjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3SzIyqFl4dgq/ek/UQ1TCfACV9arzQIf3+ZfS/GKEG4vH//////////AAAAAAABhqEAAAF0h26AAA=="),
                        Base64.decode("AAYCUo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0syMqhZeHYKv3pP1ENUwnwAlfWq80CH9/mX0vxihBuLx//////////wAAAAAAAYahAAABdIdugAABAAEAQBq+87oj2MdHQ7z8iExWVq41Ep8IhqqV9DGnan7l6k3eIOD72t57wOf5XQMEwhcXsAg7kkDYMuAkHlnbFp52aY8="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"amount\":9223372036854775807,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"Y1rUcawqVhuhp5TDE7SbFiHStTr5AMHNV5uDFmiKzhRmXp1n6RCnQAkpENQavCcNV4jSHf54XQusiZ4XsHHA46S\"],\"assetId\":\"D4H5agQLLDLEjbM2ZgHoyTe9M9Apj4t1DFSDob6c5ptb\",\"fee\":100001,\"id\":\"6L4GZVPsCo27rTwKByU37wEa2P7rhLsfgPm5BAZbqZRD\",\"type\":6,\"version\":2,\"timestamp\":1600000000000}"
                ),
                arguments(2, Id.as("6L4GZVPsCo27rTwKByU37wEa2P7rhLsfgPm5BAZbqZRD"),
                        Proof.list(Proof.as("44NBApRB5WgrHDqBgJ955pAWjrQRkreLxJQ4zFz5gEguW8av9syFXeKd69rFoJpTcjv2mKGQEQo9b7Rn35ZQJdBR"), Proof.as("3tfSCq2bnmDUbX3AvUWRnLKUfeuZucGS7LtYrhdwH12hZ8cY984ovyKhoLK27cm7KLgWCrUvCGZpg6nNpViHJn7F"), Proof.as("5LSa7YTMKBHBUWtBsLFAL3Ch6RnbvJwkvweSTDUpgekCnG91Am4tc2XnGE5kokyTbTxKKYuiqY1weS9SHF16iE33"), Proof.as("2eUvkATxzAPUzv1CcKw7Cw3XUdCZ1wctWtjBtQuKXg94qFUFmb4Fo4fRGaWzGx6sGPxSXNqBDu7HRbSfMv3jk5cx"), Proof.as("4Vn2CSdq5XResYCPwUgNU9mqQD8PDD8RBAH429ExW3ziPaHxXKkL2VseMY13VpYcXcR4vRmXtXBmDJKwv56FLEAu"), Proof.as("d7WS9HJnQwboYNR8QmKUM6VsgPWDnLSkZkmPcpcxxE9hPbYieosCHiNgxPWtTTH5fAXcebt2hunDr2Q2eh5oc7J"), Proof.as("3CsUSHn6JS74o2USzgyuw7XZ3FPpwMqkNNqji1yXqeELsU1y6Tc2XB4qkGNzqrJKsWTqmGCjP3KC8kTETbLBnHdW"), Proof.as("59Hvw49697csCKYgLKsqyXEQJHG8JNCjJgkgmyWxoQAqDEW6vXTsF1Pb55otGsJReLhrYGfbw49avvfx9vfPC9rx")),
                        Base64.decode("BgJSjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3SzIyqFl4dgq/ek/UQ1TCfACV9arzQIf3+ZfS/GKEG4vH//////////AAAAAAABhqEAAAF0h26AAA=="),
                        Base64.decode("AAYCUo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0syMqhZeHYKv3pP1ENUwnwAlfWq80CH9/mX0vxihBuLx//////////wAAAAAAAYahAAABdIdugAABAAgAQJjz8r35D7Lso0yqoJPqWSdtG/u5z9HgtxV1rC6EfTvoyrQD4HHE66uCU/tWs9El45xT2B6t2Q7RPNjLDmPoC4QAQJCV/rQVR2eEX6GKx4Bt4yYRQNjp9hQvuqdmkm0ZSsxjWCluNQ7oxZQGQwShDYM/U+SqzTzZXdjEI/j6GzRU9IYAQNjVQ/s+e5uscmZjhhgYDhS2yBMYkYMfhnKpICJ0IJlicJjKXQgVTU9JkcYtiaG3UDVbnQEcosMbEGJ4kem4UYIAQFJW8QzlgYgT6Oc1CWaxQm/rvQf9Y5tzJKdx3fPwzUKHSZE7x2rVwb+id9z2fE3UCtI04XwslO0Z6M5LyaG9Zo0AQK7d08957F2OVGQ8s9xTu+PIwmYD+ZaI+/S8eUto9LVgGcf9rAf3Z0UfUlhRxg3fkjk+fL+0ayeNqNwr9O0w9IoAQB8kTEJxGMAw9Bw6yu13Iuy1qGAT0vEQA+A3eoDhQeoaYoWrXG8f8v1iLeKK+f9Q0gv7N33q5eSGI/zNLsnlDIkAQG5FOsT+m6MzqqiEkYxUgxrClhDwac6c2M/o5eO5oK7WyZXBLIEAcrW+hu7IQ+XGGCt7qhrAdhYd6VaAHvBQm40AQM839rbYs7tifNr6bz7G8XpxMWESKT/CW8gi0yMkvd0/KPvRgX6HGKuG7gE1mTVloNuwACK82fUC3pTquG1SB4k="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"amount\":9223372036854775807,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"44NBApRB5WgrHDqBgJ955pAWjrQRkreLxJQ4zFz5gEguW8av9syFXeKd69rFoJpTcjv2mKGQEQo9b7Rn35ZQJdBR\",\"3tfSCq2bnmDUbX3AvUWRnLKUfeuZucGS7LtYrhdwH12hZ8cY984ovyKhoLK27cm7KLgWCrUvCGZpg6nNpViHJn7F\",\"5LSa7YTMKBHBUWtBsLFAL3Ch6RnbvJwkvweSTDUpgekCnG91Am4tc2XnGE5kokyTbTxKKYuiqY1weS9SHF16iE33\",\"2eUvkATxzAPUzv1CcKw7Cw3XUdCZ1wctWtjBtQuKXg94qFUFmb4Fo4fRGaWzGx6sGPxSXNqBDu7HRbSfMv3jk5cx\",\"4Vn2CSdq5XResYCPwUgNU9mqQD8PDD8RBAH429ExW3ziPaHxXKkL2VseMY13VpYcXcR4vRmXtXBmDJKwv56FLEAu\",\"d7WS9HJnQwboYNR8QmKUM6VsgPWDnLSkZkmPcpcxxE9hPbYieosCHiNgxPWtTTH5fAXcebt2hunDr2Q2eh5oc7J\",\"3CsUSHn6JS74o2USzgyuw7XZ3FPpwMqkNNqji1yXqeELsU1y6Tc2XB4qkGNzqrJKsWTqmGCjP3KC8kTETbLBnHdW\",\"59Hvw49697csCKYgLKsqyXEQJHG8JNCjJgkgmyWxoQAqDEW6vXTsF1Pb55otGsJReLhrYGfbw49avvfx9vfPC9rx\"],\"assetId\":\"D4H5agQLLDLEjbM2ZgHoyTe9M9Apj4t1DFSDob6c5ptb\",\"fee\":100001,\"id\":\"6L4GZVPsCo27rTwKByU37wEa2P7rhLsfgPm5BAZbqZRD\",\"type\":6,\"version\":2,\"timestamp\":1600000000000}"
                ),
                arguments(3, Id.as("EDKJAuejW9FmSSzGHPcbAB2436EBXX14Ti73cMiDGTHk"),
                        Proof.list(Proof.as("3Zq55RxuK5Me6ouz7iqYDHMoGfJ6wnuiFK3hojXCC9eiM7umhfWTpmFct9NkXjy5iw8HDcFE2U9xQk2Q5Fgz9fu")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigD0gYuCiwKILMjKoWXh2Cr96T9RDVMJ8AJX1qvNAh/f5l9L8YoQbi8EP//////////fw=="),
                        Base64.decode("CmQIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBChjQYggIC6u8guKAPSBi4KLAogsyMqhZeHYKv3pP1ENUwnwAlfWq80CH9/mX0vxihBuLwQ//////////9/EkACNnw25cShplF8sX+IGoF0xSSIQ0GJCdLqH5j0WNPgjHfZGYtZ8ndO/ZAtEcwYfmHjRSZ3N9yuj5cIkErhpO6I"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"quantity\":9223372036854775807,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"3Zq55RxuK5Me6ouz7iqYDHMoGfJ6wnuiFK3hojXCC9eiM7umhfWTpmFct9NkXjy5iw8HDcFE2U9xQk2Q5Fgz9fu\"],\"assetId\":\"D4H5agQLLDLEjbM2ZgHoyTe9M9Apj4t1DFSDob6c5ptb\",\"fee\":100001,\"id\":\"EDKJAuejW9FmSSzGHPcbAB2436EBXX14Ti73cMiDGTHk\",\"type\":6,\"version\":3,\"timestamp\":1600000000000}"
                ),
                arguments(3, Id.as("EDKJAuejW9FmSSzGHPcbAB2436EBXX14Ti73cMiDGTHk"),
                        Proof.list(Proof.as("3gesXqXTEe75QHvBw1GYiZKQaRaV5FP6YepamHDRDy7ToUc4VnaWce4JU9SVs2yp4ninXiV7Fi1s1eR7inzSxDrq"), Proof.as("4pqoYwKyDn3YyUd6Fbf1UKLk3vPRjF3scCvgeqiD3GXpRfJzmoBcni3haXyt6FySZTyxrnSuSxPvVcRkPFyU3wsY"), Proof.as("388nmRfb7ymWb1TwTHUNCifpeWnbXpPvvCQr7WaVdwAoqFcJbu2n7Jg6DMBqssc7S6pvHAJPXPGc7gr9CZFdmZH3"), Proof.as("254fyaFvmuxHcCLn4f81yuUEoQJTk2FzyynvQJMtmJ92jyvLa9ZcsQnNVfHuE556mJ8hWSyXKycQaaQSqh8RcGEW"), Proof.as("27y1v6PvDJvwxUrFBni98gd18bnsjH6dQw7M3hx82G92oDAn5eoHFoWvkM4Ch2hrZ2PkCRXLKQcx85JQEbb64TkY"), Proof.as("3STA2s2NVvLYWGUPBCxdTVVNAxKGDUfATdSzDgiDg2bEdJ48JaXyQyHtkYoeWCr2uaHB6E1Yv2Bc7swxBfqen1p9"), Proof.as("3Va1Ww4A1bqo9E5pFPRjEp98mGFQgFkEKfHVZVZFrGxoT96UDAYiUy3jsRkB1Z6oQctxFLvy41LMyU2P9oQR5m2P"), Proof.as("5ndqPJ4iByNzh3S9LrVboToaoYXx9fGXRmoH63cT1qG1hgngaNHiisCTm6RDTRTpY7QnqxM5KqdEfq5Ju1ucxaCR")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigD0gYuCiwKILMjKoWXh2Cr96T9RDVMJ8AJX1qvNAh/f5l9L8YoQbi8EP//////////fw=="),
                        Base64.decode("CmQIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBChjQYggIC6u8guKAPSBi4KLAogsyMqhZeHYKv3pP1ENUwnwAlfWq80CH9/mX0vxihBuLwQ//////////9/EkCGOqyzAhtXzp5h7LkabksXkELjVqdkoBHvLPMx60H6UnFeCgxFeIBz3qN2yL7KwZ2sXGmySfxMlstUQjfiXJCCEkC/TsBmKPR50Q3sTvfTvU/tBcEI+fsjuebkCKYqHPuV0k9ztdfTlurS9n2SN5c2nZnBc2ArKgQrlxHuhWvcAhaLEkBqL7QQ9tDHHUKEC4Aib0cX7zckBr+0ijLNHNP2fFp3RgKjwomOlTmSyHZwh2xhO3iBJ+c/Amjn2MNjqxNbh2WCEkA1hWMQKRY8hEwOFJ0Dv0M/5Mt+jYXgRUjDYB5U4CuDXoxLW05DChoJO2yhC07/VtFT8MAhbUkXDWG0QgKkgumDEkA4Bibgb7j8zXB1GDjEBWcouep/X7tYP5N2pf8TE5rBfqKuV93oqnzBjM/t6yAUm478G7H8Zo8GJWfEwBhbytSNEkB5+2BfKSMd4bydUc7QdlIFTyFSXPJXpko+Nriu6TQBo/ucoGVpa2DuC53xHexQdknIhekltbr9B3F5/aH1meaGEkB8q8Fxw5CwtleiE+tTC93AVEzKL0BpqnUfmowbmHTK0dIvVyTXV159ZG5GcdXspuzAINQ1DqyeW4eDmhjoK2WAEkDvbATHhtGbG7wJ+d/PddW5s9k4be1IoAdDyHC6iwX5h8JrdrlcM5/YQ1kNPT2LWYvJmY7uhQJlGtrFkAueYzuC"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"quantity\":9223372036854775807,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"3gesXqXTEe75QHvBw1GYiZKQaRaV5FP6YepamHDRDy7ToUc4VnaWce4JU9SVs2yp4ninXiV7Fi1s1eR7inzSxDrq\",\"4pqoYwKyDn3YyUd6Fbf1UKLk3vPRjF3scCvgeqiD3GXpRfJzmoBcni3haXyt6FySZTyxrnSuSxPvVcRkPFyU3wsY\",\"388nmRfb7ymWb1TwTHUNCifpeWnbXpPvvCQr7WaVdwAoqFcJbu2n7Jg6DMBqssc7S6pvHAJPXPGc7gr9CZFdmZH3\",\"254fyaFvmuxHcCLn4f81yuUEoQJTk2FzyynvQJMtmJ92jyvLa9ZcsQnNVfHuE556mJ8hWSyXKycQaaQSqh8RcGEW\",\"27y1v6PvDJvwxUrFBni98gd18bnsjH6dQw7M3hx82G92oDAn5eoHFoWvkM4Ch2hrZ2PkCRXLKQcx85JQEbb64TkY\",\"3STA2s2NVvLYWGUPBCxdTVVNAxKGDUfATdSzDgiDg2bEdJ48JaXyQyHtkYoeWCr2uaHB6E1Yv2Bc7swxBfqen1p9\",\"3Va1Ww4A1bqo9E5pFPRjEp98mGFQgFkEKfHVZVZFrGxoT96UDAYiUy3jsRkB1Z6oQctxFLvy41LMyU2P9oQR5m2P\",\"5ndqPJ4iByNzh3S9LrVboToaoYXx9fGXRmoH63cT1qG1hgngaNHiisCTm6RDTRTpY7QnqxM5KqdEfq5Ju1ucxaCR\"],\"assetId\":\"D4H5agQLLDLEjbM2ZgHoyTe9M9Apj4t1DFSDob6c5ptb\",\"fee\":100001,\"id\":\"EDKJAuejW9FmSSzGHPcbAB2436EBXX14Ti73cMiDGTHk\",\"type\":6,\"version\":3,\"timestamp\":1600000000000}"
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("transactionsProvider")
    void burnTransaction(int version, Id expectedId, List<Proof> proofs,
                         byte[] expectedBody, byte[] expectedBytes, String expectedJson) throws IOException {
        BurnTransaction builtTx = BurnTransaction
                .with(Amount.of(amount, assetId))
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

        BurnTransaction constructedTx = new BurnTransaction(sender, Amount.of(amount, assetId),
                Waves.chainId, Amount.of(fee), timestamp, version, proofs);

        assertAll("Txs created via builder and constructor are equal",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(constructedTx.bodyBytes()),
                () -> assertThat(builtTx.id()).isEqualTo(constructedTx.id()),
                () -> assertThat(builtTx.toBytes()).isEqualTo(constructedTx.toBytes())
        );

        BurnTransaction deserTx = BurnTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> assertThat(deserTx.amount()).isEqualTo(Amount.of(amount, assetId)),

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
