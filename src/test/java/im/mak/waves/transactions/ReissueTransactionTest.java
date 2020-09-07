package im.mak.waves.transactions;

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

import static im.mak.waves.transactions.serializers.json.JsonSerializer.JSON_MAPPER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.params.provider.Arguments.arguments;

public class ReissueTransactionTest {

    static PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
    static long timestamp = 1600000000000L;
    AssetId assetId = AssetId.as("dMjSNxoT6P9F4gQcYhg5jNGpZBrNiQrSeaGTA56zJok");
    static long amount = Long.MAX_VALUE;
    long fee = ReissueTransaction.MIN_FEE + 1;

    @BeforeAll
    static void beforeAll() {
        WavesConfig.chainId('R');
    }

    static Stream<Arguments> transactionsProvider() {
        return Stream.of(
                arguments(1, false, Id.as("42n6XmzySop9EhpaESAsXA3mvnZYLCpHU9skUK3Dr1N2"),
                        Proof.list(Proof.as("5o6VreN68ib1gYsHcb4tZGXB5spAV47JtMaLgMMxdVf9M2WAzjbi6BusQEj3PCGXsYb9PHCgvCZyache6xMSuq2T")),
                        Base64.decode("BY2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0CVBZu0/xpniTbz/XGRr4r9Z3HboJssOgofQIUO+VcvN//////////wAAAAAAAAGGoQAAAXSHboAA"),
                        Base64.decode("Be/RgcIhUNvWgBxKvRLRO4DqDFo5WwwiCkDUwa0ioQq73gboofZ5dPV9BbAaZPfOGCPBbeq1wWODsq5651Odk4QFjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QJUFm7T/GmeJNvP9cZGviv1ncdugmyw6Ch9AhQ75Vy83//////////AAAAAAAAAYahAAABdIdugAA="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"quantity\":9223372036854775807,\"signature\":\"5o6VreN68ib1gYsHcb4tZGXB5spAV47JtMaLgMMxdVf9M2WAzjbi6BusQEj3PCGXsYb9PHCgvCZyache6xMSuq2T\",\"fee\":100001,\"type\":5,\"version\":1,\"reissuable\":false,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"proofs\":[\"5o6VreN68ib1gYsHcb4tZGXB5spAV47JtMaLgMMxdVf9M2WAzjbi6BusQEj3PCGXsYb9PHCgvCZyache6xMSuq2T\"],\"assetId\":\"dMjSNxoT6P9F4gQcYhg5jNGpZBrNiQrSeaGTA56zJok\",\"id\":\"42n6XmzySop9EhpaESAsXA3mvnZYLCpHU9skUK3Dr1N2\",\"timestamp\":1600000000000}"
                ),
                arguments(1, true, Id.as("BTVoDbjaF5qzW3qsDjtKu2XjbX7jRJsK7kDkH6h7mofx"),
                        Proof.list(Proof.as("3vePJMzspDwvvLKzURNt4RUY5VnBKa1etr5ZK2MXYkfGJAv3Qjwu5jeJMHdJk8Z4YJ7btpiVafjCHpq3i755Lb15")),
                        Base64.decode("BY2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0CVBZu0/xpniTbz/XGRr4r9Z3HboJssOgofQIUO+VcvN//////////wEAAAAAAAGGoQAAAXSHboAA"),
                        Base64.decode("BZJLhwODrgWy2zCdhBcAjyN4rr+j0gLNIPseLDVUMrS90Y53/P5HBcvJWeag2CVht53xHidHc9uWvFadLzB7vIQFjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QJUFm7T/GmeJNvP9cZGviv1ncdugmyw6Ch9AhQ75Vy83//////////AQAAAAAAAYahAAABdIdugAA="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"quantity\":9223372036854775807,\"signature\":\"3vePJMzspDwvvLKzURNt4RUY5VnBKa1etr5ZK2MXYkfGJAv3Qjwu5jeJMHdJk8Z4YJ7btpiVafjCHpq3i755Lb15\",\"fee\":100001,\"type\":5,\"version\":1,\"reissuable\":true,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"proofs\":[\"3vePJMzspDwvvLKzURNt4RUY5VnBKa1etr5ZK2MXYkfGJAv3Qjwu5jeJMHdJk8Z4YJ7btpiVafjCHpq3i755Lb15\"],\"assetId\":\"dMjSNxoT6P9F4gQcYhg5jNGpZBrNiQrSeaGTA56zJok\",\"id\":\"BTVoDbjaF5qzW3qsDjtKu2XjbX7jRJsK7kDkH6h7mofx\",\"timestamp\":1600000000000}"
                ),
                arguments(2, false, Id.as("FrLcDKUTYJ42UZiS6GRkkAFykrUFrzzEAYeRc69hto5T"),
                        Proof.list(Proof.as("5yQE9eBZhVk4rVdeu4xgBhqYgkARyvFChFUmB7wgqXTH4itAwvyijEiHKpjpzNXyxr7Hh82MKuJZLVRV1vw2mQBJ")),
                        Base64.decode("BQJSjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QJUFm7T/GmeJNvP9cZGviv1ncdugmyw6Ch9AhQ75Vy83//////////AAAAAAAAAYahAAABdIdugAA="),
                        Base64.decode("AAUCUo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0CVBZu0/xpniTbz/XGRr4r9Z3HboJssOgofQIUO+VcvN//////////wAAAAAAAAGGoQAAAXSHboAAAQABAED4tKLW77l2rc+oKgvjOi9enPEpN7p8iNo4MvpiNuyokxpAeUPZPUkbnedyUdFjpgSPJYVB5MIQttHfOIvsMKuB"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"quantity\":9223372036854775807,\"fee\":100001,\"type\":5,\"version\":2,\"reissuable\":false,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"5yQE9eBZhVk4rVdeu4xgBhqYgkARyvFChFUmB7wgqXTH4itAwvyijEiHKpjpzNXyxr7Hh82MKuJZLVRV1vw2mQBJ\"],\"assetId\":\"dMjSNxoT6P9F4gQcYhg5jNGpZBrNiQrSeaGTA56zJok\",\"id\":\"FrLcDKUTYJ42UZiS6GRkkAFykrUFrzzEAYeRc69hto5T\",\"timestamp\":1600000000000}"
                ),
                arguments(2, true, Id.as("DXkQ7jWwG2BiKzXEChvX1ZFij1Sj8tB56xZzFKzzKLCu"),
                        Proof.list(Proof.as("67PQ3m5ADAv9gYHueGoR27BornGEMfAmCw2gXJQcYGcZsdJRZVgtTSn96auXuN3f4wYYL3wVk9t7RRDKYuqvH3JH"), Proof.as("2tGD7hzZNBxiKHZbwUmivjzUjsFsu1F5HXFg4GVLZMstTG1s79KwPqr4k4f4jpCGbFsree9UdnqKaokZvzxQouVW"), Proof.as("4eF6wPXwr1s3zhpmbwoD2aXPczUfMJkX2w5dz9yhLX4K9A7v19QLtWw9tGS1EyVj3wvyHYWH66SmyviwgdyfmA3E"), Proof.as("55huDnUqgeR2bQYiss8dNsB7npeBEveCRtL1ZTxFLavUPT7Wo2By6TVdLAA2w5kmAgZdUtWnAZ7zhp8c2cvUVHpx"), Proof.as("2vgYzwMK2L3XqHx18VnbRp7kQMXfm3ta2QdTng1GX3bRQZ9aS5D69WXAoasQnM2CeadpcbC2kk9V3x37nQ8eUHvX"), Proof.as("3XQ8LTD5i8oKras2yRgdZTpjxz1DaCi5JQ7ZYqZbv2Qq5T4HWD54G41mtM6tEjkFv4v6TUKvzAtmmhmSmPGoKKGA"), Proof.as("4zWpUr8HsRuSgCis4niFnQrRE73LqbfCxUjkhapM1AQRo4WqzAbBpUw75vbTAKn39bgrBo4bdkote1f7aTSSH2Mq"), Proof.as("5Drp2BSwnd9popk2XzkoH8gLZe2BRquMysdBTgexpkdTHHXu11XDiPVurHVGyJm5BWDW3XASfiHaFvP6L4Cybkog")),
                        Base64.decode("BQJSjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QJUFm7T/GmeJNvP9cZGviv1ncdugmyw6Ch9AhQ75Vy83//////////AQAAAAAAAYahAAABdIdugAA="),
                        Base64.decode("AAUCUo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0CVBZu0/xpniTbz/XGRr4r9Z3HboJssOgofQIUO+VcvN//////////wEAAAAAAAGGoQAAAXSHboAAAQAIAED/l5jMQjca85QJmp9ieqlFsprDPvLPIH8XZebgPi+WDUhldxIUH9hdGCX1Cg9YUn2iPKQ9JyTgl1ZLL2MztPeCAEBeOT1j5gehrGhd8BZQY2qqEvr8ar3nbl7ggxuc1EjQWSYwuSSzinSQ1TjdZP+tgjCBVw7UHSWT4FZrxz0WNSWFAEC2KwaUsO3PFfyiU6VCZJLDn8Tr+t+aP3xVJw3aeuqiS0jGaMPxUIb/TfO8/0NpgJ2LrSBoUJi8FRZs8RsMCI+FAEDMICTBlZPHJvjKBe6fctE+j8W/TgGSM0D3sN1uIAZoSPViLqwIaXlW6MZqmlJi/GUJuN6bYxdqivhpbGc2Qv6NAEBgT2zIA2mSUOa1O1SYT6+1Gu0u4MIYvXM6AYySUCrm2LTLEsOod8VqaRF2/oNXrZTndm9plCRUMd54g+TudWmIAEB+P6tuV6kuhD29OfWVCQ0P0Gso+Mtz6Hi5LVY0jLJAsY5UmYPEpU8Ns6+ZPbfyfxVGS8nQututXbxYetj+6uyHAEDHpiPRn7vmYbCUb3gMfRtUz+A9qHXfG3b6ur0rI1kXhTm5xb6kYxkNLJS5IUthEiaoH9ajhJ+WOiSIXT2Tew6MAEDTKC0mkftB7cXcXpffTPJLv1E84AwqO92XTK5F8EwqHObbF+Xh7I95OptxDMmErUl5v7ZeNc6/a9W3OJyBadGP"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"quantity\":9223372036854775807,\"fee\":100001,\"type\":5,\"version\":2,\"reissuable\":true,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"67PQ3m5ADAv9gYHueGoR27BornGEMfAmCw2gXJQcYGcZsdJRZVgtTSn96auXuN3f4wYYL3wVk9t7RRDKYuqvH3JH\",\"2tGD7hzZNBxiKHZbwUmivjzUjsFsu1F5HXFg4GVLZMstTG1s79KwPqr4k4f4jpCGbFsree9UdnqKaokZvzxQouVW\",\"4eF6wPXwr1s3zhpmbwoD2aXPczUfMJkX2w5dz9yhLX4K9A7v19QLtWw9tGS1EyVj3wvyHYWH66SmyviwgdyfmA3E\",\"55huDnUqgeR2bQYiss8dNsB7npeBEveCRtL1ZTxFLavUPT7Wo2By6TVdLAA2w5kmAgZdUtWnAZ7zhp8c2cvUVHpx\",\"2vgYzwMK2L3XqHx18VnbRp7kQMXfm3ta2QdTng1GX3bRQZ9aS5D69WXAoasQnM2CeadpcbC2kk9V3x37nQ8eUHvX\",\"3XQ8LTD5i8oKras2yRgdZTpjxz1DaCi5JQ7ZYqZbv2Qq5T4HWD54G41mtM6tEjkFv4v6TUKvzAtmmhmSmPGoKKGA\",\"4zWpUr8HsRuSgCis4niFnQrRE73LqbfCxUjkhapM1AQRo4WqzAbBpUw75vbTAKn39bgrBo4bdkote1f7aTSSH2Mq\",\"5Drp2BSwnd9popk2XzkoH8gLZe2BRquMysdBTgexpkdTHHXu11XDiPVurHVGyJm5BWDW3XASfiHaFvP6L4Cybkog\"],\"assetId\":\"dMjSNxoT6P9F4gQcYhg5jNGpZBrNiQrSeaGTA56zJok\",\"id\":\"DXkQ7jWwG2BiKzXEChvX1ZFij1Sj8tB56xZzFKzzKLCu\",\"timestamp\":1600000000000}"
                ),
                arguments(3, false, Id.as("7bg99B7Jpo7R2344xeVPbscyksLAr2sVm37ZLYtKJBV6"),
                        Proof.list(Proof.as("2G8FsUk7sMV2Q5WoUQh4mgEStN4CFbkiJ6VPMkJmyrY4gjCxGfEiLUApbXZ7MNumhRrgeAxSooVuFsWSD2jFeeF2")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigDygYuCiwKIAlQWbtP8aZ4k28/1xka+K/Wdx26CbLDoKH0CFDvlXLzEP//////////fw=="),
                        Base64.decode("CmQIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBChjQYggIC6u8guKAPKBi4KLAogCVBZu0/xpniTbz/XGRr4r9Z3HboJssOgofQIUO+VcvMQ//////////9/EkA/D3EUAsr55+A4XoZ0c2UWz5+Hw1NMMewxCxnu5A8qmaevCSsHBN91zcZYJSCzhr7ki+WmV7GlmJNIcfiPEnuJ"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"quantity\":9223372036854775807,\"fee\":100001,\"type\":5,\"version\":3,\"reissuable\":false,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"2G8FsUk7sMV2Q5WoUQh4mgEStN4CFbkiJ6VPMkJmyrY4gjCxGfEiLUApbXZ7MNumhRrgeAxSooVuFsWSD2jFeeF2\"],\"assetId\":\"dMjSNxoT6P9F4gQcYhg5jNGpZBrNiQrSeaGTA56zJok\",\"id\":\"7bg99B7Jpo7R2344xeVPbscyksLAr2sVm37ZLYtKJBV6\",\"timestamp\":1600000000000}"
                ),
                arguments(3, true, Id.as("AykCjr4iGEvTseRjKqdKQUdoZuBjV1LG7rZrvD3sdwSh"),
                        Proof.list(Proof.as("2mhkWf2qR1GyoY1xAjLaFUhJkcHmJug5smoGQniaDRhEZGkRaA6r1F7YWN74ojFxPi2k3TdGggLE1AebCk12QYUg"), Proof.as("5VPniFuL8TShmdbkx3vw5PyKNQ7K7CLnYUwMhAFD7kwGAUC7uaNWKTbKGAnrYUQiRnjciWjJfcjuUhQpzWCidcDK"), Proof.as("RWn9ECFxj7EiJPG8xypguCXwtZPQkV5f9t7jCebor9tSmYB1PVFxDc1XwnT2MbkV4z4MPrbNnXWfeEBuFrRgice"), Proof.as("45S4s7QVMUYSSXLcRXiHLk8CTLHoznqbvtZ2yzBKmaWhFWDxd8KYT8HxsDo9A2UNoXfEBiip1BXStdnZ4BNks1yz"), Proof.as("4kqa2Dj7NNx63usfzkQcEdkSoiVhnZsTF8gyqWBxWxBCmJ6vKCUEdFezCp14wcm5dMbeYZ7mL3wj9FrtrvNfvJRf"), Proof.as("4MYXdzxXDYPYrdT4vJ6HgG8djPerD2jH73TMfwTxwVGJHSSc2fFd69LLoiPsPpqt9Rze19X5EbqK3B5RSF9EYeMV"), Proof.as("3CTSQb3aXphB7xfuCUvrEmepSNbGeKQLNLyRy6o9HABXSFNTn75g8d7wdCeqKXNx2dkVyCMJUPb77nTLfASY2zGg"), Proof.as("3bhcGcru8nab8T2iM85J52LAhDuDdx4CCaS6urNcJNMxsi17UCTjnSSVSYnazDQYFTHTNW6d5YzDh51w76mdyb16")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigDygYwCiwKIAlQWbtP8aZ4k28/1xka+K/Wdx26CbLDoKH0CFDvlXLzEP//////////fxAB"),
                        Base64.decode("CmYIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBChjQYggIC6u8guKAPKBjAKLAogCVBZu0/xpniTbz/XGRr4r9Z3HboJssOgofQIUO+VcvMQ//////////9/EAESQFiRGsXBIG2eahl3Fl2mSlVg8GGNwjG4PkQ2WW2cK8a7SEiiOwsZboImSPJDQL9eJfRRt5jidx5FkJwy9j3NPIkSQOCNjj0InpUMKWxof508XVRSZeSlcCJv7QFiitzIK0Ny87osXCrXv+zBYik8Xxz8mgZgOfMDGgO71/UpGVPj6oYSQBUjsnq6L/L8rGBbZVwjiGxdOjbVLTWG6BKzZ4Y2KVpl3ANS+WELDB5XGc76bUOL6ZsFTASDiT6EnWNl7TH+5Y8SQJnfhjWXRMONLQm46y+Wo98r71vtapt8RpYfa+toCryEh/YBCfTB1ey0eWlYlI5YUQPQARSuQVYjnOb0KALbSIkSQLvazhCDHisBxXIgf7JmqOp6h7D5dzMTZEzyEvR3JqgUDYkSLtINzRN0Ibya1/KtaO5c5QU4VkVAIn6UTL6AWIISQKfEWp0MqYqjiqNeBUZQHM4B7R17PY0wUP9unEz1oOvqAlFUhk2m3B3mfHG0dauirLfbt1+4fsmIT3XcZSzNQoASQG3pvthLQTimffsjPkAet82xTDgh1Ezc94MvZU9G3a+B1mS5ZEgNSw+y57dxmYztBZo4nq90fKExrGYZngCcfokSQIH1RLlSVzEyUtCpQcH3BxysUikRon32+NS8o4dPz2YDoMk8YXW9A6tO0GEXSh3i1RIqgxBUOZSopwI+isOGqY0="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"quantity\":9223372036854775807,\"fee\":100001,\"type\":5,\"version\":3,\"reissuable\":true,\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"2mhkWf2qR1GyoY1xAjLaFUhJkcHmJug5smoGQniaDRhEZGkRaA6r1F7YWN74ojFxPi2k3TdGggLE1AebCk12QYUg\",\"5VPniFuL8TShmdbkx3vw5PyKNQ7K7CLnYUwMhAFD7kwGAUC7uaNWKTbKGAnrYUQiRnjciWjJfcjuUhQpzWCidcDK\",\"RWn9ECFxj7EiJPG8xypguCXwtZPQkV5f9t7jCebor9tSmYB1PVFxDc1XwnT2MbkV4z4MPrbNnXWfeEBuFrRgice\",\"45S4s7QVMUYSSXLcRXiHLk8CTLHoznqbvtZ2yzBKmaWhFWDxd8KYT8HxsDo9A2UNoXfEBiip1BXStdnZ4BNks1yz\",\"4kqa2Dj7NNx63usfzkQcEdkSoiVhnZsTF8gyqWBxWxBCmJ6vKCUEdFezCp14wcm5dMbeYZ7mL3wj9FrtrvNfvJRf\",\"4MYXdzxXDYPYrdT4vJ6HgG8djPerD2jH73TMfwTxwVGJHSSc2fFd69LLoiPsPpqt9Rze19X5EbqK3B5RSF9EYeMV\",\"3CTSQb3aXphB7xfuCUvrEmepSNbGeKQLNLyRy6o9HABXSFNTn75g8d7wdCeqKXNx2dkVyCMJUPb77nTLfASY2zGg\",\"3bhcGcru8nab8T2iM85J52LAhDuDdx4CCaS6urNcJNMxsi17UCTjnSSVSYnazDQYFTHTNW6d5YzDh51w76mdyb16\"],\"assetId\":\"dMjSNxoT6P9F4gQcYhg5jNGpZBrNiQrSeaGTA56zJok\",\"id\":\"AykCjr4iGEvTseRjKqdKQUdoZuBjV1LG7rZrvD3sdwSh\",\"timestamp\":1600000000000}"
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("transactionsProvider")
    void reissueTransaction(int version, boolean reissuable, Id expectedId, List<Proof> proofs,
                            byte[] expectedBody, byte[] expectedBytes, String expectedJson) throws IOException {
        ReissueTransaction builtTx = ReissueTransaction
                .builder(Amount.of(amount, assetId))
                .reissuable(reissuable)
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

        ReissueTransaction constructedTx = new ReissueTransaction(sender, Amount.of(amount, assetId), reissuable,
                WavesConfig.chainId(), Amount.of(fee), timestamp, version, proofs);

        assertAll("Txs created via builder and constructor are equal",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(constructedTx.bodyBytes()),
                () -> assertThat(builtTx.id()).isEqualTo(constructedTx.id()),
                () -> assertThat(builtTx.toBytes()).isEqualTo(constructedTx.toBytes())
        );

        ReissueTransaction deserTx = ReissueTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> assertThat(deserTx.amount()).isEqualTo(Amount.of(amount, assetId)),
                () -> assertThat(deserTx.reissuable()).isEqualTo(reissuable),

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

        assertThat(JSON_MAPPER.readTree(Transaction.fromJson(expectedJson).toJson()))
                .describedAs("Tx serialized to json must be equal to expected")
                .isEqualTo(JSON_MAPPER.readTree(expectedJson));
    }

}
