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

public class CreateAliasTransactionTest {

    static PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
    static long timestamp = 1600000000000L;
    String alias = "_rich-account.with@30_symbols_";
    long fee = CreateAliasTransaction.MIN_FEE + 1;

    @BeforeAll
    static void beforeAll() {
        Waves.chainId = 'R';
    }

    static Stream<Arguments> transactionsProvider() {
        return Stream.of(
                arguments(1, Id.as("8HSsxBsxnzBep3522R2YDkNG8eKLwa9gVuT47U7zU43R"),
                        Proof.list(Proof.as("3fe47iWQSvGoxoFaB3UZYCo8GptvZZQ7WbF42vrt4DbeKojH3kc8mvLVxKkVNueEoeGhAac9GgRBBdK7UHGtk9B")),
                        Base64.decode("Co2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0ACICUgAeX3JpY2gtYWNjb3VudC53aXRoQDMwX3N5bWJvbHNfAAAAAAABhqEAAAF0h26AAA=="),
                        Base64.decode("Co2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0ACICUgAeX3JpY2gtYWNjb3VudC53aXRoQDMwX3N5bWJvbHNfAAAAAAABhqEAAAF0h26AAAJMmZeYeQtKiq5lgcjlUhm4XdWZ3OelJZ7X2nZ9gbOom1VbH6g8ykNcx08Vns0Y+HrpOxW3RitCLP/M4JA5pI4="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"signature\":\"3fe47iWQSvGoxoFaB3UZYCo8GptvZZQ7WbF42vrt4DbeKojH3kc8mvLVxKkVNueEoeGhAac9GgRBBdK7UHGtk9B\",\"proofs\":[\"3fe47iWQSvGoxoFaB3UZYCo8GptvZZQ7WbF42vrt4DbeKojH3kc8mvLVxKkVNueEoeGhAac9GgRBBdK7UHGtk9B\"],\"fee\":100001,\"alias\":\"_rich-account.with@30_symbols_\",\"id\":\"8HSsxBsxnzBep3522R2YDkNG8eKLwa9gVuT47U7zU43R\",\"type\":10,\"version\":1,\"timestamp\":1600000000000}"
                ),
                arguments(2, Id.as("8HSsxBsxnzBep3522R2YDkNG8eKLwa9gVuT47U7zU43R"),
                        Proof.list(Proof.as("3RcqSBQVo6FA4zs8jQ6RZWzN5ucEztEi6Qa7o1ZA2VnPBzcjKtSrkay26Tg6Lu7iJfgo8dTwwoCu9L8JDF7Xk5U5")),
                        Base64.decode("CgKNj7KNwHV8CsVGLbpgRgDsF4sHe1SAkroj0YoxaGM3dAAiAlIAHl9yaWNoLWFjY291bnQud2l0aEAzMF9zeW1ib2xzXwAAAAAAAYahAAABdIdugAA="),
                        Base64.decode("AAoCjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QAIgJSAB5fcmljaC1hY2NvdW50LndpdGhAMzBfc3ltYm9sc18AAAAAAAGGoQAAAXSHboAAAQABAEB5Q3RCllE7whhTsfO7bmkQlNh0GHmNTyxOI9kwITriqNeU7sHuUxXeCh1VdxL7zDVIcsdydgcZ3LJCe0dKIfGK"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"proofs\":[\"3RcqSBQVo6FA4zs8jQ6RZWzN5ucEztEi6Qa7o1ZA2VnPBzcjKtSrkay26Tg6Lu7iJfgo8dTwwoCu9L8JDF7Xk5U5\"],\"fee\":100001,\"alias\":\"_rich-account.with@30_symbols_\",\"id\":\"8HSsxBsxnzBep3522R2YDkNG8eKLwa9gVuT47U7zU43R\",\"type\":10,\"version\":2,\"timestamp\":1600000000000}"
                ),
                arguments(2, Id.as("8HSsxBsxnzBep3522R2YDkNG8eKLwa9gVuT47U7zU43R"),
                        Proof.list(Proof.as("351Twn4FG6cSKDUToAGcRVur4WQm24AL9Rj1EcansybFBgjqiaVm9ujr7e75rrikV5yAJ6BNbu6gbWpcm9N5Jrf6"), Proof.as("5gkEoZNLRp5x1cwTKhK5m4JiMWUE6gKF4tahw3WcDSLzdFS9EixLQAjht56pYqi4iUnfDfc7fVBtpXcLZ47Rb1dH"), Proof.as("5aYtGnZYZ6KMNXtEDVtHsDrdqtXD5kiNFZzg2SSwLPndGrmoe12pD1zLVGr2kzqV2eQr1jfUX9RfJDbqtRE8zZmH"), Proof.as("4xbmgo6KUt1ms22YEGWMaeAu9qSjAwPLQD5iq9tkmwRrhid7WjLg667Kkv4QutMxeSPiXbLMPoh86nk4ZppoGUVB"), Proof.as("5PhQE2ufApFzqSThALAYrxdnCMb3QT2msakHX4ysrft4k4UZCZTQu1nvwUBadzG5kmaiWcsfjQJrc2Lb9EdXigcS"), Proof.as("f6sCsEv21Ce4B5oXLxxyfHMSKMQ9wjDqrjXf7VbEt9duU8sC5H758utRCQanBtGdGKC84KAUDqsfT3WNQHKJvza"), Proof.as("zr15huyS3P19VU3UEJRQkeyzDu4jnhCrXLeF92LoqSZFwGTspeDYUxD3M7bNnDvNPn7b7AEyFtHiauTzmUPRm97"), Proof.as("4hVwm5vRS6mYqGJJVRxv2FhWxz5EzDVgZPn95zNq2C2Cf9QHuokiuMooXpUhrFGQjsKCScfwXj9Y2bhZu19LNjmt")),
                        Base64.decode("CgKNj7KNwHV8CsVGLbpgRgDsF4sHe1SAkroj0YoxaGM3dAAiAlIAHl9yaWNoLWFjY291bnQud2l0aEAzMF9zeW1ib2xzXwAAAAAAAYahAAABdIdugAA="),
                        Base64.decode("AAoCjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QAIgJSAB5fcmljaC1hY2NvdW50LndpdGhAMzBfc3ltYm9sc18AAAAAAAGGoQAAAXSHboAAAQAIAEBnfYe3yUoqnkp35EvwMFJGwdjrzg4tVVdr4r67HMOUAqIbPC4/sK/gn5liKnJDNuAAIRJNiPOhjhVo+oHxC6CNAEDqV84d7Hxj90RxRUEvA/CjUXaA2RRzk6pExw/VKlxjNH7iokTV6j2popx+6WnTYSDSti6xj4S12EJCuF2CFyCIAEDlAAAkSQ5AY83Az+AuxJyQH2Xz9Ly5mdiE5XAq6txSAKBOpnYkTBNN1Y5tPWA3BruGI4cQcbQaahcjylviAn+AAEDF/3Vo6PepiF4k1sNYHmIZTTSCuntC4IZAA/5ZTxY+CNsdL29BvYQQ8AJwrAySnHmfxufQuI15uLFp/JDhSUWGAEDbpAFHzcl1ujZh1SV3lFrLseKNnY2sUqYUWEFxnole9fns5OYNfOQ5/XgEEdNCuiz72vUWRsCT4R8tyllb3iyLAEAg22JTPtZnj2hlupEK2T228XXn5n70CoczgMiiY42Ytvr9JQwOM1kQro38T+lTCdLZZAIZQ+B5ZcoaxSw1/ryHAEAx4hmurVUl2xUjLpIayEL50jqPuAM2e7vUg/z0aMnKs4xMM6AE8ZLEz25XAk7p9Eyw1t2D/ZwKnYIpTHMvUNaGAEC4+c/QwlJ6gfQxFhLrwQKyKgWjtQ6nfShI/T9jbhw1aSYC8q39oyQAWPtsR57qR0yoXMLNV6feBYnUv/9Hc26L"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"proofs\":[\"351Twn4FG6cSKDUToAGcRVur4WQm24AL9Rj1EcansybFBgjqiaVm9ujr7e75rrikV5yAJ6BNbu6gbWpcm9N5Jrf6\",\"5gkEoZNLRp5x1cwTKhK5m4JiMWUE6gKF4tahw3WcDSLzdFS9EixLQAjht56pYqi4iUnfDfc7fVBtpXcLZ47Rb1dH\",\"5aYtGnZYZ6KMNXtEDVtHsDrdqtXD5kiNFZzg2SSwLPndGrmoe12pD1zLVGr2kzqV2eQr1jfUX9RfJDbqtRE8zZmH\",\"4xbmgo6KUt1ms22YEGWMaeAu9qSjAwPLQD5iq9tkmwRrhid7WjLg667Kkv4QutMxeSPiXbLMPoh86nk4ZppoGUVB\",\"5PhQE2ufApFzqSThALAYrxdnCMb3QT2msakHX4ysrft4k4UZCZTQu1nvwUBadzG5kmaiWcsfjQJrc2Lb9EdXigcS\",\"f6sCsEv21Ce4B5oXLxxyfHMSKMQ9wjDqrjXf7VbEt9duU8sC5H758utRCQanBtGdGKC84KAUDqsfT3WNQHKJvza\",\"zr15huyS3P19VU3UEJRQkeyzDu4jnhCrXLeF92LoqSZFwGTspeDYUxD3M7bNnDvNPn7b7AEyFtHiauTzmUPRm97\",\"4hVwm5vRS6mYqGJJVRxv2FhWxz5EzDVgZPn95zNq2C2Cf9QHuokiuMooXpUhrFGQjsKCScfwXj9Y2bhZu19LNjmt\"],\"fee\":100001,\"alias\":\"_rich-account.with@30_symbols_\",\"id\":\"8HSsxBsxnzBep3522R2YDkNG8eKLwa9gVuT47U7zU43R\",\"type\":10,\"version\":2,\"timestamp\":1600000000000}"
                ),
                arguments(3, Id.as("Do5MYp5ueFNAdwTk6co66v6G3crf8XCXFHEK1s7h2aBm"),
                        Proof.list(Proof.as("3xkM66SY5Z4KP6GbBczCUkf6S1MzWr45bJwEQ7So6hMKTTSZtVmhccZjxMXWD2axCMxLmk3g5G14dcBywukyMkuv")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigD8gYgCh5fcmljaC1hY2NvdW50LndpdGhAMzBfc3ltYm9sc18="),
                        Base64.decode("ClYIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBChjQYggIC6u8guKAPyBiAKHl9yaWNoLWFjY291bnQud2l0aEAzMF9zeW1ib2xzXxJAlBu/1cYLhNpdWRk+4rwMcNP2TrVvbcw+hSm4Zx1a8d0RHo7FKuUuSyl3a1e7KBkXzw0Ie7dQirZ9QC9M7SpdiQ=="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"3xkM66SY5Z4KP6GbBczCUkf6S1MzWr45bJwEQ7So6hMKTTSZtVmhccZjxMXWD2axCMxLmk3g5G14dcBywukyMkuv\"],\"fee\":100001,\"alias\":\"_rich-account.with@30_symbols_\",\"id\":\"Do5MYp5ueFNAdwTk6co66v6G3crf8XCXFHEK1s7h2aBm\",\"type\":10,\"version\":3,\"timestamp\":1600000000000}"
                ),
                arguments(3, Id.as("Do5MYp5ueFNAdwTk6co66v6G3crf8XCXFHEK1s7h2aBm"),
                        Proof.list(Proof.as("31avR5BibAsBfCwfFaHfAExuMrDcsus9WiHub7ktNkx2AadDgixir1b4ifAMc9NVD63Hthb8fkFyRAt9Qjwvjdyk"), Proof.as("2VkG1AW6zGUN4psa8U1gKXa8gNJGewuJn8swPEhS8dUXSjWQBw5jegT4HfE2hM1eKiGvnyuLGKipLyFCGLXWMTkq"), Proof.as("3SpMic5Dx8pfDJsjszFpm7HF7t4bvwr44k112iT7zkxPzCfkrGiMT5wwYJdrn1nVQWH91hWZTHwkYkMFD4Js8zqA"), Proof.as("r4GMoa6mEo6q9P2sLHkKPRRDenQfV2s7ds1oZv1Vb8ji2Sw4sCutYNYuDJtish6pZTyGwVCe3rrsBueRZokSXur"), Proof.as("4cDQQwUFxyyKLpXkJbDzmr1W79is2LBfw5VHLMp9MENi1nNf7kDkXf8wFXavXXiHNFexwZs7p22xyp1vFn9YxLvC"), Proof.as("2kiAkccx5ZKPcmA5mT7iULQos74cqi6UsSoCJ1u9kD2rfKASXqovUibEKGgwCPcd2aLnhrWWY2SHB35ZW9isPG8i"), Proof.as("5GQZjaRfsLbNCgQSmX6vuKMb4NzKRrVEv6SopQrno5y6FV9711bnAq5HsKMduKcNi3qfz4VLMe71Zj8GQ2UiXfUn"), Proof.as("4Y5cFUSZTwevVvKZmxtTA7Wad3kKpFm3AA93xRKRGJVx42623izZr7kkFNoUDqUWnNKz9h1p7Ypay3fxvLk8Az7j")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigD8gYgCh5fcmljaC1hY2NvdW50LndpdGhAMzBfc3ltYm9sc18="),
                        Base64.decode("ClYIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBChjQYggIC6u8guKAPyBiAKHl9yaWNoLWFjY291bnQud2l0aEAzMF9zeW1ib2xzXxJAZInQ6VqEY9GIDCeKWpE6Uro2Ds37mMgWpAJg+cHcKLVKnLKobk4a+PvqtZ0UN/wIoMO3URazeHko7kNhMHyGixJASs5q6iBhyodr6NpwFpPYIYPFW01XcwYm284xl2cPNhjlwdG6bZ7OCb0cR3CXMnYhLK+MoWKP4pxhPr1yP9KhhhJAekwTSZmroJXunct7YNFQR57KMR+ptJqnSO1fcNgyRhCmmNQ3bbZH+297KKV4ZKN/72OLYi95MpeTyy3w6h3GhRJAKk3lb0bioHMjhiX1O/Cmz1vZaf8rgAPvfkUwTmD3k51omZ/enVRVtRopwpccMyD6PDJLeboI1Ox/A9Iub6txiRJAtGsH08LX3N0nsVC6Sc/45Zh+YI41pLSKyvrdBbHUqaud7d01Lg1+5/aZTqm0Rgvl7sLsGQdDwIN+x5Z6KthzgRJAV7XuQsrFV+Bf60Z+AzWPxifMiDCYfq3w/r+9ei0AaoTTEbTxlq5xC6H92impxhVOR9HkdLyd2StWRiEiBXFsixJA1VqRw74x6ePghp/354f+UrnkRWRU/hIAMKruUI3TIcTUYbsGdGnjzqX3JvTJykzck2tY1Er+gfdycV9uXrnOgxJAsNpMYBQ0+FCuZDdU7ztLDGbqVxe2d05J7kAHrvXmy3v8VGve5+JlYDxOgt6+q3WLxjLfut0fN+ly4q+r6lCFgg=="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"31avR5BibAsBfCwfFaHfAExuMrDcsus9WiHub7ktNkx2AadDgixir1b4ifAMc9NVD63Hthb8fkFyRAt9Qjwvjdyk\",\"2VkG1AW6zGUN4psa8U1gKXa8gNJGewuJn8swPEhS8dUXSjWQBw5jegT4HfE2hM1eKiGvnyuLGKipLyFCGLXWMTkq\",\"3SpMic5Dx8pfDJsjszFpm7HF7t4bvwr44k112iT7zkxPzCfkrGiMT5wwYJdrn1nVQWH91hWZTHwkYkMFD4Js8zqA\",\"r4GMoa6mEo6q9P2sLHkKPRRDenQfV2s7ds1oZv1Vb8ji2Sw4sCutYNYuDJtish6pZTyGwVCe3rrsBueRZokSXur\",\"4cDQQwUFxyyKLpXkJbDzmr1W79is2LBfw5VHLMp9MENi1nNf7kDkXf8wFXavXXiHNFexwZs7p22xyp1vFn9YxLvC\",\"2kiAkccx5ZKPcmA5mT7iULQos74cqi6UsSoCJ1u9kD2rfKASXqovUibEKGgwCPcd2aLnhrWWY2SHB35ZW9isPG8i\",\"5GQZjaRfsLbNCgQSmX6vuKMb4NzKRrVEv6SopQrno5y6FV9711bnAq5HsKMduKcNi3qfz4VLMe71Zj8GQ2UiXfUn\",\"4Y5cFUSZTwevVvKZmxtTA7Wad3kKpFm3AA93xRKRGJVx42623izZr7kkFNoUDqUWnNKz9h1p7Ypay3fxvLk8Az7j\"],\"fee\":100001,\"alias\":\"_rich-account.with@30_symbols_\",\"id\":\"Do5MYp5ueFNAdwTk6co66v6G3crf8XCXFHEK1s7h2aBm\",\"type\":10,\"version\":3,\"timestamp\":1600000000000}"
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("transactionsProvider")
    void createAliasTransaction(int version, Id expectedId, List<Proof> proofs,
                                byte[] expectedBody, byte[] expectedBytes, String expectedJson) throws IOException {
        CreateAliasTransaction builtTx = CreateAliasTransaction
                .with(alias)
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

        CreateAliasTransaction constructedTx = new CreateAliasTransaction(sender, alias,
                Waves.chainId, fee, timestamp, version, proofs);

        assertAll("Txs created via builder and constructor are equal",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(constructedTx.bodyBytes()),
                () -> assertThat(builtTx.id()).isEqualTo(constructedTx.id()),
                () -> assertThat(builtTx.toBytes()).isEqualTo(constructedTx.toBytes())
        );

        CreateAliasTransaction deserTx = CreateAliasTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> assertThat(deserTx.alias()).isEqualTo(alias),

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
