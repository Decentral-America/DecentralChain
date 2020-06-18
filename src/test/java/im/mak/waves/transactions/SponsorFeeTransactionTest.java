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

public class SponsorFeeTransactionTest {

    static PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
    static long timestamp = 1600000000000L;
    Asset asset = Asset.id("Gh59RuSCGUv4reQ9HYUppRrmrE2BPqEzgZVk9mahJVv9");
    static long minSponsoredFee = Long.MAX_VALUE;
    long fee = SponsorFeeTransaction.MIN_FEE + 1;

    @BeforeAll
    static void beforeAll() {
        Waves.chainId = 'R';
    }

    static Stream<Arguments> transactionsProvider() {
        return Stream.of(
                arguments(1, TxId.id("7baxmrYYvCazTsQqHPeHxRKqJSq5SKtbt4HLMQHN9zD4"),
                        Proof.list(Proof.as("2Mu8vmdrrE6nvy75fitYEd5CNHzARs45SvgxAzgb925uQYPrWqQRSVMS7y5ohAVX821qiu7qUV96HxSVNohHJ47K")),
                        Base64.decode("DgGNj7KNwHV8CsVGLbpgRgDsF4sHe1SAkroj0YoxaGM3dOkjOTDorElAjatKqEXLbyA5SFfvqR+5Dw20CirC/Z7Cf/////////8AAAAAAAGGoQAAAXSHboAA"),
                        Base64.decode("AA4BDgGNj7KNwHV8CsVGLbpgRgDsF4sHe1SAkroj0YoxaGM3dOkjOTDorElAjatKqEXLbyA5SFfvqR+5Dw20CirC/Z7Cf/////////8AAAAAAAGGoQAAAXSHboAAAQABAEBECheoT1omQx4eft9bTv01pq+C4mrPDOPpCUajuRNMX4RCULtIsyGZEnOep2dmCAVa8gRnR2b0vRcXqFqT8eWC"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"proofs\":[\"2Mu8vmdrrE6nvy75fitYEd5CNHzARs45SvgxAzgb925uQYPrWqQRSVMS7y5ohAVX821qiu7qUV96HxSVNohHJ47K\"],\"assetId\":\"Gh59RuSCGUv4reQ9HYUppRrmrE2BPqEzgZVk9mahJVv9\",\"fee\":100001,\"minSponsoredAssetFee\":9223372036854775807,\"id\":\"7baxmrYYvCazTsQqHPeHxRKqJSq5SKtbt4HLMQHN9zD4\",\"type\":14,\"version\":1,\"timestamp\":1600000000000}"
                ),
                arguments(2, TxId.id("7wxY9PHzoiTDFsnB1LurQRcW1eyfSLWfYNQmvGJrvBZE"),
                        Proof.list(Proof.as("BTiZUWh517zjDtLoVo1Y55z51pMkfuykuAMgR1tRSaA6Wj5LpXmLUUa6DMrzpBi4He9uGVrpTa9hkgvvNFedtuX")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigCkgcuCiwKIOkjOTDorElAjatKqEXLbyA5SFfvqR+5Dw20CirC/Z7CEP//////////fw=="),
                        Base64.decode("CmQIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBChjQYggIC6u8guKAKSBy4KLAog6SM5MOisSUCNq0qoRctvIDlIV++pH7kPDbQKKsL9nsIQ//////////9/EkAJBVZzc4N/t6u3yfCpmEUYTlrZU/kXpDSoV4OFe+7jW47bDXiD8k3xL7rduIZ7Nbhf2mmHogtLsFwSX8SdHBCC"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"BTiZUWh517zjDtLoVo1Y55z51pMkfuykuAMgR1tRSaA6Wj5LpXmLUUa6DMrzpBi4He9uGVrpTa9hkgvvNFedtuX\"],\"assetId\":\"Gh59RuSCGUv4reQ9HYUppRrmrE2BPqEzgZVk9mahJVv9\",\"fee\":100001,\"minSponsoredAssetFee\":9223372036854775807,\"id\":\"7wxY9PHzoiTDFsnB1LurQRcW1eyfSLWfYNQmvGJrvBZE\",\"type\":14,\"version\":2,\"timestamp\":1600000000000}"
                ),
                arguments(2, TxId.id("7wxY9PHzoiTDFsnB1LurQRcW1eyfSLWfYNQmvGJrvBZE"),
                        Proof.list(Proof.as("zvf4ie5hKasXcXC7mSxnNhKULHnFsJsHasoEPXkumM5wqHLCEFwbxw1RmoPbnxdjXckBoSq96ZacUQTVp8AJPcr"), Proof.as("46e7X3jRgyEEXZk9RSv58xWVydEEPvdJoY4t6xLgMqQs3rPX5rWzE6WbM5wpJt3A5PKmaRYTuF7LvSnd9cFCHVNa"), Proof.as("ZyHkkdJokZEtH7gMdyofv8rQrt8j7RGu9rzRyoooTw78wfBnQXpf6fDBALHThukmxtHkn69Rc2QeXdQFYyTLRph"), Proof.as("3SgMwZgAQEkfZToLjGRMWNu3dADprj1McAuPk63pSMS9chdBx2R8RS49H8wQQvBRftYGmHa87pZyEjJ5FEECMSDW"), Proof.as("57iE2ULndy1DTpWUZmPD5JyRQEsDvnzbPWxTiBQEjmA8BX9bRne9hfrnR5Gi8iWF99SgGWeBtaq73WoSsQa1gx6s"), Proof.as("2DnkfHVWJQvcaBoSajVYaSUkmn7GxzkZP2gfdqcBe5w4Qgk9rFWj7zC9M711C6qQxUpXdXuUGBReKZTkokZBPWjf"), Proof.as("4oYfoYuyPaLLaETHmA9RVv8sqCmgS4j2ewJjj3aQoXf2aBBCM4276SLDNuNnCC3EeteUMz8zswtaRzrHnStdiGPf"), Proof.as("4JmXArdY3aXuXxZ5NMhbuQRnf8rhrKrAaofgzDbYseYuE8985tEXGVhTmh5rxKMQ2iHsWP2wBhwExCw8o4dtepHN")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigCkgcuCiwKIOkjOTDorElAjatKqEXLbyA5SFfvqR+5Dw20CirC/Z7CEP//////////fw=="),
                        Base64.decode("CmQIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBChjQYggIC6u8guKAKSBy4KLAog6SM5MOisSUCNq0qoRctvIDlIV++pH7kPDbQKKsL9nsIQ//////////9/EkAx89Fw7tPcpTx6o64RU6JZp1WJsjjD9RABx6AbpRJytmEP/TooNT+Wv/2rulJMoDqYbHeze0lrbpsfA6gBImKPEkCa6iN4/+kVu4JVcMzYpY9QB50xFInULpkyoVNtSz/GXNTu3lKx6bOi+kkJqPsOpW8sUAQbsKNw+ku0CQpgAdaDEkAcbrixypnJnblVC2Lqv1O5UyiHa3JOqlu+nm4uuVrA/iGSzvLp79st0XVfoUil+9CHSWEzXtaO/TUzA1Exr4mGEkB6LaPDlo6lTGEHp8Y6k3CXpazLZC7oV8fiTE5p620Rm4TJw1+fpGXeeBFnReme10v4e/R/xTJ2rQC4SaALjRGJEkDN2ugzMTN5X69qZZF8W7anK3HSk9yf5HQWxZs7xF70qkWD3qtEi/t9+9IYLohtDRi7e24yQWo3qA0+R7R5UT+IEkA9C60KcIhoquhl3UpoPT3331jbIuHdTVnW3Fa2hxKmQmlqtKWfnh/hPL3TFXscxAi3un7v9V8Q20j0VqqgzZuOEkC+MMWCF/LzbMez6TKxXvEdUAlUP1tEOLwDhBt2yCIMc4eMfHKZmoLa5UP3Yj+iQ0yGD7Zc6Q2/Tt+4+P591LKGEkClX4LM2EiQTTCjyj60cUuGOvQqW/PYb4ggKgp15Oshn4cqdCe58LnKy0nYaCiu6TPeHby8/9TVwKVao00ULAaJ"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"zvf4ie5hKasXcXC7mSxnNhKULHnFsJsHasoEPXkumM5wqHLCEFwbxw1RmoPbnxdjXckBoSq96ZacUQTVp8AJPcr\",\"46e7X3jRgyEEXZk9RSv58xWVydEEPvdJoY4t6xLgMqQs3rPX5rWzE6WbM5wpJt3A5PKmaRYTuF7LvSnd9cFCHVNa\",\"ZyHkkdJokZEtH7gMdyofv8rQrt8j7RGu9rzRyoooTw78wfBnQXpf6fDBALHThukmxtHkn69Rc2QeXdQFYyTLRph\",\"3SgMwZgAQEkfZToLjGRMWNu3dADprj1McAuPk63pSMS9chdBx2R8RS49H8wQQvBRftYGmHa87pZyEjJ5FEECMSDW\",\"57iE2ULndy1DTpWUZmPD5JyRQEsDvnzbPWxTiBQEjmA8BX9bRne9hfrnR5Gi8iWF99SgGWeBtaq73WoSsQa1gx6s\",\"2DnkfHVWJQvcaBoSajVYaSUkmn7GxzkZP2gfdqcBe5w4Qgk9rFWj7zC9M711C6qQxUpXdXuUGBReKZTkokZBPWjf\",\"4oYfoYuyPaLLaETHmA9RVv8sqCmgS4j2ewJjj3aQoXf2aBBCM4276SLDNuNnCC3EeteUMz8zswtaRzrHnStdiGPf\",\"4JmXArdY3aXuXxZ5NMhbuQRnf8rhrKrAaofgzDbYseYuE8985tEXGVhTmh5rxKMQ2iHsWP2wBhwExCw8o4dtepHN\"],\"assetId\":\"Gh59RuSCGUv4reQ9HYUppRrmrE2BPqEzgZVk9mahJVv9\",\"fee\":100001,\"minSponsoredAssetFee\":9223372036854775807,\"id\":\"7wxY9PHzoiTDFsnB1LurQRcW1eyfSLWfYNQmvGJrvBZE\",\"type\":14,\"version\":2,\"timestamp\":1600000000000}"
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("transactionsProvider")
    void sponsorFeeTransaction(int version, TxId expectedId, List<Proof> proofs,
                               byte[] expectedBody, byte[] expectedBytes, String expectedJson) throws IOException {
        SponsorFeeTransaction builtTx = SponsorFeeTransaction
                .with(asset, minSponsoredFee)
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

        SponsorFeeTransaction constructedTx = new SponsorFeeTransaction(sender, asset, minSponsoredFee,
                Waves.chainId, fee, timestamp, version, proofs);

        assertAll("Txs created via builder and constructor are equal",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(constructedTx.bodyBytes()),
                () -> assertThat(builtTx.id()).isEqualTo(constructedTx.id()),
                () -> assertThat(builtTx.toBytes()).isEqualTo(constructedTx.toBytes())
        );

        SponsorFeeTransaction deserTx = SponsorFeeTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> assertThat(deserTx.asset()).isEqualTo(asset),
                () -> assertThat(deserTx.minSponsoredFee()).isEqualTo(minSponsoredFee),

                () -> assertThat(deserTx.version()).isEqualTo(version),
                () -> assertThat(deserTx.chainId()).isEqualTo(Waves.chainId),
                () -> assertThat(deserTx.sender()).isEqualTo(sender),
                () -> assertThat(deserTx.fee()).isEqualTo(fee),
                () -> assertThat(deserTx.feeAsset()).isEqualTo(Asset.WAVES),
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
