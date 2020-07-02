package im.mak.waves.transactions;

import im.mak.waves.crypto.account.PrivateKey;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.crypto.base.Base64;
import im.mak.waves.transactions.common.*;
import im.mak.waves.transactions.exchange.Order;
import im.mak.waves.transactions.exchange.OrderType;
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

public class OrderTest {

    static PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
    static PrivateKey matcher = PrivateKey.as("9eTCRWv2phrBmCfpYt4bGS5MqY2Wnqvjop9yT272xxTh");
    static long timestamp = 1600000000000L;
    static long expiration = timestamp + 30 * 60 * 1000;

    static Asset asset = Asset.id("2wBMrTzvncodBbNiXaXju4Z9QpdCFtMp9ZoCRrykk9Dk");
    static Amount amount = Amount.of(20, asset);
    static Amount price = Amount.of(10);

    static Amount wavesFee = Amount.of(Order.MIN_FEE + 1);
    static Amount sponsoredFee = Amount.of(5, asset);

    @BeforeAll
    static void beforeAll() {
        Waves.chainId = 'R';
    }

    static Stream<Arguments> ordersProvider() {
        return Stream.of(
                arguments(1, OrderType.BUY, wavesFee, Id.as("Bea2BQsswtozYBNCtmqMAvFN62ePe8y8vvErxB9EFzKg"),
                        Proof.list(Proof.as("2nnKPPeksC3MrRgdHZPa17vJ5fu8KKMCS7PqaEzmjNME1xkpeQsdeUuaMkoYPDrZoDQF4wiKGGk8YmAghmQXWonT")),
                        Base64.decode("jY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3R7cmfYmspV54WgnQM0k1SqvHeoIndVtd2dY5XqT43lHAEcvMOhErFe5XG+6rZYJkd2UiQTXKK5FpVOp2mvtUBSqwAAAAAAAAAAAAoAAAAAAAAAFAAAAXSHboAAAAABdIeJ90AAAAAAAAST4Q=="),
                        Base64.decode("jY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3R7cmfYmspV54WgnQM0k1SqvHeoIndVtd2dY5XqT43lHAEcvMOhErFe5XG+6rZYJkd2UiQTXKK5FpVOp2mvtUBSqwAAAAAAAAAAAAoAAAAAAAAAFAAAAXSHboAAAAABdIeJ90AAAAAAAAST4Vl/QHiGPmhYc9Z2U9mpzwJ4AcddZWoPLTtPncK8U3PhsPmaTU1o/2DYeMLwrgk/qXtFu8uAiZq0q7hNGs/7dow="),
                        "{\"version\":1,\"id\":\"Bea2BQsswtozYBNCtmqMAvFN62ePe8y8vvErxB9EFzKg\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"matcherPublicKey\":\"9JtL1azypH6XRnQcrYRT2qvy8zcRRctTiC4A1M6QywUP\",\"assetPair\":{\"amountAsset\":\"2wBMrTzvncodBbNiXaXju4Z9QpdCFtMp9ZoCRrykk9Dk\",\"priceAsset\":null},\"orderType\":\"buy\",\"amount\":20,\"price\":10,\"timestamp\":1600000000000,\"expiration\":1600001800000,\"matcherFee\":300001,\"signature\":\"2nnKPPeksC3MrRgdHZPa17vJ5fu8KKMCS7PqaEzmjNME1xkpeQsdeUuaMkoYPDrZoDQF4wiKGGk8YmAghmQXWonT\",\"proofs\":[\"2nnKPPeksC3MrRgdHZPa17vJ5fu8KKMCS7PqaEzmjNME1xkpeQsdeUuaMkoYPDrZoDQF4wiKGGk8YmAghmQXWonT\"]}"
                ),
                arguments(1, OrderType.SELL, wavesFee, Id.as("CsMYW2s8FwktKZKFpsoteHGKSqyrL2ezveodQ4XVjGEP"),
                        Proof.list(Proof.as("59EZ8DfdD9PNWQcb6iFHhBCU2rY828KTgV8Ha4uyUSJZB4mHMdeyEfTAAkL4Ys3NMsiXzRKpkMpFikieUcAdYtnv")),
                        Base64.decode("jY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3R7cmfYmspV54WgnQM0k1SqvHeoIndVtd2dY5XqT43lHAEcvMOhErFe5XG+6rZYJkd2UiQTXKK5FpVOp2mvtUBSqwABAAAAAAAAAAoAAAAAAAAAFAAAAXSHboAAAAABdIeJ90AAAAAAAAST4Q=="),
                        Base64.decode("jY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3R7cmfYmspV54WgnQM0k1SqvHeoIndVtd2dY5XqT43lHAEcvMOhErFe5XG+6rZYJkd2UiQTXKK5FpVOp2mvtUBSqwABAAAAAAAAAAoAAAAAAAAAFAAAAXSHboAAAAABdIeJ90AAAAAAAAST4c8rHR2RvxuKFDuRlc3vjC7fQ5+nA5SKc+oB/yumI6laBialqGHFHXzIlbqZVZr/IURBPzLxiiBAqJC+Z+8q5Ys="),
                        "{\"version\":1,\"id\":\"CsMYW2s8FwktKZKFpsoteHGKSqyrL2ezveodQ4XVjGEP\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"matcherPublicKey\":\"9JtL1azypH6XRnQcrYRT2qvy8zcRRctTiC4A1M6QywUP\",\"assetPair\":{\"amountAsset\":\"2wBMrTzvncodBbNiXaXju4Z9QpdCFtMp9ZoCRrykk9Dk\",\"priceAsset\":null},\"orderType\":\"sell\",\"amount\":20,\"price\":10,\"timestamp\":1600000000000,\"expiration\":1600001800000,\"matcherFee\":300001,\"signature\":\"59EZ8DfdD9PNWQcb6iFHhBCU2rY828KTgV8Ha4uyUSJZB4mHMdeyEfTAAkL4Ys3NMsiXzRKpkMpFikieUcAdYtnv\",\"proofs\":[\"59EZ8DfdD9PNWQcb6iFHhBCU2rY828KTgV8Ha4uyUSJZB4mHMdeyEfTAAkL4Ys3NMsiXzRKpkMpFikieUcAdYtnv\"]}"
                ),
                arguments(2, OrderType.SELL, wavesFee, Id.as("2d81nLUDgsmr9HvGd7RekXcU9FWBD5gbJA2rtXgLroek"),
                        Proof.list(Proof.as("6UyBjYxRYZoicZPVNk9i1f6hzjRttf7WnWB859oR9kTbsHU5heBBAVBENJLRh2H8TaZ8k4b4uCztt69TUjHKPWE")),
                        Base64.decode("Ao2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0e3Jn2JrKVeeFoJ0DNJNUqrx3qCJ3VbXdnWOV6k+N5RwBHLzDoRKxXuVxvuq2WCZHdlIkE1yiuRaVTqdpr7VAUqsAAQAAAAAAAAAKAAAAAAAAABQAAAF0h26AAAAAAXSHifdAAAAAAAAEk+E="),
                        Base64.decode("Ao2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0e3Jn2JrKVeeFoJ0DNJNUqrx3qCJ3VbXdnWOV6k+N5RwBHLzDoRKxXuVxvuq2WCZHdlIkE1yiuRaVTqdpr7VAUqsAAQAAAAAAAAAKAAAAAAAAABQAAAF0h26AAAAAAXSHifdAAAAAAAAEk+EBAAEAQAS6R8Wo6Un6/QmvPfqzrPuxNAxtBDkcJJlcOpgtZQ03/+lp1QjfDVjZ6LAaXoIEQmoqeu5Ww1tmt+2BvoxCs4c="),
                        "{\"version\":2,\"id\":\"2d81nLUDgsmr9HvGd7RekXcU9FWBD5gbJA2rtXgLroek\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"matcherPublicKey\":\"9JtL1azypH6XRnQcrYRT2qvy8zcRRctTiC4A1M6QywUP\",\"assetPair\":{\"amountAsset\":\"2wBMrTzvncodBbNiXaXju4Z9QpdCFtMp9ZoCRrykk9Dk\",\"priceAsset\":null},\"orderType\":\"sell\",\"amount\":20,\"price\":10,\"timestamp\":1600000000000,\"expiration\":1600001800000,\"matcherFee\":300001,\"signature\":\"6UyBjYxRYZoicZPVNk9i1f6hzjRttf7WnWB859oR9kTbsHU5heBBAVBENJLRh2H8TaZ8k4b4uCztt69TUjHKPWE\",\"proofs\":[\"6UyBjYxRYZoicZPVNk9i1f6hzjRttf7WnWB859oR9kTbsHU5heBBAVBENJLRh2H8TaZ8k4b4uCztt69TUjHKPWE\"]}"
                ),
                arguments(2, OrderType.SELL, wavesFee, Id.as("2d81nLUDgsmr9HvGd7RekXcU9FWBD5gbJA2rtXgLroek"),
                        Proof.list(Proof.as("4jVSDnLmvCJmrKq3tfgRsxEQTKUb2316JKLCrfaPWRrttktvxyZwLuXfB5r8gdY4LBbUFFV3QXtZKJHPFoikZzSC"), Proof.as("wyiXi3to5UrLqZyzmN6d8WzkaExnjrFBqAv6niJ3731dmYsSmgmE7hTRV2H1RzrbSyc4wm1ogcynXUpcesmKgRD"), Proof.as("2L5miuMpomymLH41hjec4ez3958XvNG5qt94TLWs82KBfnnnVvuh34pE5BA7D2VWYh4aL5Q1WcoxQXvx3nhPYnyA"), Proof.as("2wcd2q9g8p4fv6BpgLHhivyuPAnzGmeaKcuaW3GKwexVHXELKodhTGhekvQrxrTK7w3LTk6DEfNaiGmyJpTDxo1w"), Proof.as("2oQ9trqLNCtJ9zFvSr74xAqjA2LJiMgD6h51j1EJScU5jgsRjQWGnqUs2jAiCfx3VLmw3Y71B7A3Wk8t5MnYRYnr"), Proof.as("2LjYbpN9UVzByN9ervewRbixsUmzM7ZM9PzKdN7HAFDTxjiDwixwTop6mfRqyDucK7rGcbZXNQhtqTRk2n49C8y4"), Proof.as("247bHEMc4vAMmjNMrFMmFLpH2jFP9SFh7xKu1SVfcuu9oX7GZNTH7JrpRcCSz9PrnY8FKf2ZKu3oykRjsE6znxye"), Proof.as("uivpAGyjUzUhXhxV7ayB71Wdn42P35kHZDdX9DvqFesmHhcnxQZon3wwYHcqjLyDs8JWFmCZkPMjU9M4Gz14jFR")),
                        Base64.decode("Ao2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0e3Jn2JrKVeeFoJ0DNJNUqrx3qCJ3VbXdnWOV6k+N5RwBHLzDoRKxXuVxvuq2WCZHdlIkE1yiuRaVTqdpr7VAUqsAAQAAAAAAAAAKAAAAAAAAABQAAAF0h26AAAAAAXSHifdAAAAAAAAEk+E="),
                        Base64.decode("Ao2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0e3Jn2JrKVeeFoJ0DNJNUqrx3qCJ3VbXdnWOV6k+N5RwBHLzDoRKxXuVxvuq2WCZHdlIkE1yiuRaVTqdpr7VAUqsAAQAAAAAAAAAKAAAAAAAAABQAAAF0h26AAAAAAXSHifdAAAAAAAAEk+EBAAgAQLqxZw+XW4J7gA3+ez06TPyLHYs110XJd04o3i4q7GC5KdfAoc9elYQAht/P1mRz8ume9JnYE6yzupOTy/ILHIkAQC9pK5y4bEkCj/ydTTFKkJeBnjmxSN+yQO6f1546bTeC1X/673oG09FN1XXUO9WRep4Gl+MsICTDtnvY+LnDeIgAQEJ5Cme4wq/v+Ie2ci2p0GYSc1+TrzJ3s/FVk3OWkpXGablsr613FmVMpczss4dQMCRyXehswrOIdHMSWs/0DoUAQGEdOqaHutlFmmX1ySVYhz+d5Ol0LeyuvKPTpAOxIB8H+byfjQLHpZVKj1Lhso/9AV1vlb9KAfil9DVmd5bRZoYAQFoHp8Bz0RBYg4zlE7GUcn5crUUOUxOMWdAg0BYFcZ6QKuNbPjD20MPIN60CbOsJVfx9GjaTg2zaQx0oCIU0248AQEMI0YQ6aDOj7FliwkgkRO7DET6+aB9i2GTTiAPJ3vFkJ9Ys50ny4D+XrIJyFrYN095TWp4+k0Hdg10ga9ljqIcAQDSzu6Wcr8faH84W0oFGBLHOeJMJBRI3inlJV9LOqO86ZHoHiQZWp3zjOoKsOrtP9QGaAY8Fh+KszERMUTK/8YkAQC13WlFXGtxGVHbO5EJ4AFZNkTpIGg8Sr9nISxoGzo+tuVDN1MVLHSyKqt0u8CjWZaJcb8De/wImoIi6lqEER4Q="),
                        "{\"version\":2,\"id\":\"2d81nLUDgsmr9HvGd7RekXcU9FWBD5gbJA2rtXgLroek\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"matcherPublicKey\":\"9JtL1azypH6XRnQcrYRT2qvy8zcRRctTiC4A1M6QywUP\",\"assetPair\":{\"amountAsset\":\"2wBMrTzvncodBbNiXaXju4Z9QpdCFtMp9ZoCRrykk9Dk\",\"priceAsset\":null},\"orderType\":\"sell\",\"amount\":20,\"price\":10,\"timestamp\":1600000000000,\"expiration\":1600001800000,\"matcherFee\":300001,\"signature\":\"4jVSDnLmvCJmrKq3tfgRsxEQTKUb2316JKLCrfaPWRrttktvxyZwLuXfB5r8gdY4LBbUFFV3QXtZKJHPFoikZzSC\",\"proofs\":[\"4jVSDnLmvCJmrKq3tfgRsxEQTKUb2316JKLCrfaPWRrttktvxyZwLuXfB5r8gdY4LBbUFFV3QXtZKJHPFoikZzSC\",\"wyiXi3to5UrLqZyzmN6d8WzkaExnjrFBqAv6niJ3731dmYsSmgmE7hTRV2H1RzrbSyc4wm1ogcynXUpcesmKgRD\",\"2L5miuMpomymLH41hjec4ez3958XvNG5qt94TLWs82KBfnnnVvuh34pE5BA7D2VWYh4aL5Q1WcoxQXvx3nhPYnyA\",\"2wcd2q9g8p4fv6BpgLHhivyuPAnzGmeaKcuaW3GKwexVHXELKodhTGhekvQrxrTK7w3LTk6DEfNaiGmyJpTDxo1w\",\"2oQ9trqLNCtJ9zFvSr74xAqjA2LJiMgD6h51j1EJScU5jgsRjQWGnqUs2jAiCfx3VLmw3Y71B7A3Wk8t5MnYRYnr\",\"2LjYbpN9UVzByN9ervewRbixsUmzM7ZM9PzKdN7HAFDTxjiDwixwTop6mfRqyDucK7rGcbZXNQhtqTRk2n49C8y4\",\"247bHEMc4vAMmjNMrFMmFLpH2jFP9SFh7xKu1SVfcuu9oX7GZNTH7JrpRcCSz9PrnY8FKf2ZKu3oykRjsE6znxye\",\"uivpAGyjUzUhXhxV7ayB71Wdn42P35kHZDdX9DvqFesmHhcnxQZon3wwYHcqjLyDs8JWFmCZkPMjU9M4Gz14jFR\"]}"
                ),
                arguments(3, OrderType.BUY, wavesFee, Id.as("CVSxQaBe4cpisdVgRJGZ4DnmFDjpNnzgi6rV2DKdPVPh"),
                        Proof.list(Proof.as("5nRX4Hw3CEHdgHtGfDmrnsNY39357ZDowP2Xg7gKhbRMmNZdw3XkwQeziTbK9sdaejt2JnqLkjvpk7dy5Z9ZnyjX")),
                        Base64.decode("A42Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0e3Jn2JrKVeeFoJ0DNJNUqrx3qCJ3VbXdnWOV6k+N5RwBHLzDoRKxXuVxvuq2WCZHdlIkE1yiuRaVTqdpr7VAUqsAAAAAAAAAAAAKAAAAAAAAABQAAAF0h26AAAAAAXSHifdAAAAAAAAEk+EA"),
                        Base64.decode("A42Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0e3Jn2JrKVeeFoJ0DNJNUqrx3qCJ3VbXdnWOV6k+N5RwBHLzDoRKxXuVxvuq2WCZHdlIkE1yiuRaVTqdpr7VAUqsAAAAAAAAAAAAKAAAAAAAAABQAAAF0h26AAAAAAXSHifdAAAAAAAAEk+EAAQABAEDvPSP05v2SfKGBm/xtiRnrYI+EBKuR/WMkhHz8Y4fr+v+/NHzL4otdsCZOi68HeSjIWSkUlNLaekJinoIwVKOK"),
                        "{\"version\":3,\"id\":\"CVSxQaBe4cpisdVgRJGZ4DnmFDjpNnzgi6rV2DKdPVPh\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"matcherPublicKey\":\"9JtL1azypH6XRnQcrYRT2qvy8zcRRctTiC4A1M6QywUP\",\"assetPair\":{\"amountAsset\":\"2wBMrTzvncodBbNiXaXju4Z9QpdCFtMp9ZoCRrykk9Dk\",\"priceAsset\":null},\"orderType\":\"buy\",\"amount\":20,\"price\":10,\"timestamp\":1600000000000,\"expiration\":1600001800000,\"matcherFee\":300001,\"signature\":\"5nRX4Hw3CEHdgHtGfDmrnsNY39357ZDowP2Xg7gKhbRMmNZdw3XkwQeziTbK9sdaejt2JnqLkjvpk7dy5Z9ZnyjX\",\"proofs\":[\"5nRX4Hw3CEHdgHtGfDmrnsNY39357ZDowP2Xg7gKhbRMmNZdw3XkwQeziTbK9sdaejt2JnqLkjvpk7dy5Z9ZnyjX\"],\"matcherFeeAssetId\":null}"
                ),
                arguments(3, OrderType.SELL, sponsoredFee, Id.as("DBBrHvxuwvyVAPdbD3GgjtP15Esg8ccBA3pRRtw8ovWR"),
                        Proof.list(Proof.as("2SJbQLVvACezbiMGPYPSQTc3CeVAAzJdC9wuZ8WSWqvEeJJTGtNm6hDkV7CosCDTbLu8zovc5eYYC582P6B7otZL")),
                        Base64.decode("A42Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0e3Jn2JrKVeeFoJ0DNJNUqrx3qCJ3VbXdnWOV6k+N5RwBHLzDoRKxXuVxvuq2WCZHdlIkE1yiuRaVTqdpr7VAUqsAAQAAAAAAAAAKAAAAAAAAABQAAAF0h26AAAAAAXSHifdAAAAAAAAAAAUBHLzDoRKxXuVxvuq2WCZHdlIkE1yiuRaVTqdpr7VAUqs="),
                        Base64.decode("A42Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0e3Jn2JrKVeeFoJ0DNJNUqrx3qCJ3VbXdnWOV6k+N5RwBHLzDoRKxXuVxvuq2WCZHdlIkE1yiuRaVTqdpr7VAUqsAAQAAAAAAAAAKAAAAAAAAABQAAAF0h26AAAAAAXSHifdAAAAAAAAAAAUBHLzDoRKxXuVxvuq2WCZHdlIkE1yiuRaVTqdpr7VAUqsBAAEAQEfWbucztaBXER4h1CbMs5HYlJbWvjjU69DIaBZjr/IsGRg5zQZwfDOCx6BME/HKE94jyicvbtV+sHlCPQ/X9I8="),
                        "{\"version\":3,\"id\":\"DBBrHvxuwvyVAPdbD3GgjtP15Esg8ccBA3pRRtw8ovWR\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"matcherPublicKey\":\"9JtL1azypH6XRnQcrYRT2qvy8zcRRctTiC4A1M6QywUP\",\"assetPair\":{\"amountAsset\":\"2wBMrTzvncodBbNiXaXju4Z9QpdCFtMp9ZoCRrykk9Dk\",\"priceAsset\":null},\"orderType\":\"sell\",\"amount\":20,\"price\":10,\"timestamp\":1600000000000,\"expiration\":1600001800000,\"matcherFee\":5,\"signature\":\"2SJbQLVvACezbiMGPYPSQTc3CeVAAzJdC9wuZ8WSWqvEeJJTGtNm6hDkV7CosCDTbLu8zovc5eYYC582P6B7otZL\",\"proofs\":[\"2SJbQLVvACezbiMGPYPSQTc3CeVAAzJdC9wuZ8WSWqvEeJJTGtNm6hDkV7CosCDTbLu8zovc5eYYC582P6B7otZL\"],\"matcherFeeAssetId\":\"2wBMrTzvncodBbNiXaXju4Z9QpdCFtMp9ZoCRrykk9Dk\"}"
                ),
                arguments(3, OrderType.BUY, wavesFee, Id.as("CVSxQaBe4cpisdVgRJGZ4DnmFDjpNnzgi6rV2DKdPVPh"),
                        Proof.list(Proof.as("4DWL9D4yH4ZTbuNvHQTxNVp5JE6Y2iBtqFjFKpiYLJTBC7egtGTmRK3QPWAcmdZtfhpC1nMxkDTFNoj5dBF3wckK"), Proof.as("hpoex52jrDabZn7VNoD1sKVWkPuyrkQpyMTBAjNTXG6nQrWv3uJLp5KtY5brfiZZpnQ5QufDWexb1duknZSkabi"), Proof.as("5pXaLf7QCEZeGmYrGhmMkUWxTRFFtJGCsSUJQwdTyQbnBrgsTa7twXvCqeyttDi89Z3WkMdeLW9vZRX7jQWkx2Ka"), Proof.as("57x2WYBnPRpLd2bYdkxF7dKz6q86YjUYeePTguPC2MiPsCVgixxkNxCYEXQPSvkUdf85KymeSg9oTugowDw7PBRW"), Proof.as("2hwSg8vvJCnWCftL4s1FCZanBjqrYByDXc5zBVSV7Ed9idTuZgrwxkfNJCTCCU5PvhjRHoc1w1EUmNrJiSz4nNqc"), Proof.as("5oDPSGnFUaCqqRhW4aitxnp8sc5KpZTnpByzEePtGqGbTR7LogEurwcpWnrN7eoC7tcYrFGCrz1fvHRS91ED9fPP"), Proof.as("RrTXvgRudxct4hsjEbRM4LpVZKWEnruGTpDmnzkuX8jcfjPiJMzyD1bXSMqD6TPuXH2krqoPdTofMvoJEjZgqfN"), Proof.as("4udJs17xHuVLUVmZYmPqqC21KQ3q59bUBGfY37sPu8aTrjkvrdqfpQ5jm4zwEjNrAXJAizxobYn97uu1iwQuWkdi")),
                        Base64.decode("A42Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0e3Jn2JrKVeeFoJ0DNJNUqrx3qCJ3VbXdnWOV6k+N5RwBHLzDoRKxXuVxvuq2WCZHdlIkE1yiuRaVTqdpr7VAUqsAAAAAAAAAAAAKAAAAAAAAABQAAAF0h26AAAAAAXSHifdAAAAAAAAEk+EA"),
                        Base64.decode("A42Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0e3Jn2JrKVeeFoJ0DNJNUqrx3qCJ3VbXdnWOV6k+N5RwBHLzDoRKxXuVxvuq2WCZHdlIkE1yiuRaVTqdpr7VAUqsAAAAAAAAAAAAKAAAAAAAAABQAAAF0h26AAAAAAXSHifdAAAAAAAAEk+EAAQAIAECg1d6VPiKYl3gcNwaiePH1Iw5yXlfnl5fVJCpHIyA67nxvx12jG/gI6NCCnsqi6vG+ajn8z3lGEH7VCWNYlUOMAEAjNItm233E34XqRzojof4vb5CwW+z95HhxJcl/LDi6oxVxVetgbmQ4GghERxgDzlzlli9057//0iIvVe0tmbGJAEDxDbkSnCHTAIbf3OPADdWmzyc8pXxDczf72axc1sCdwSKozvEESdfbDTK+sWmtbNAjwElzxH6w8k8cDoNNct+BAEDOD3B2ZEF+FrZ5ayDd9ySwj/ztpak1y11dLVyEEPtXVipEZPhT0Y3/20U1No9gPyKMy6qW7uhVn1pX20yJHSyFAEBVUinQ0a61cFdlrDZdPpo9Us+c1QJCZb2lQVWWmR/VLJCCGMipHW2FxMcW9+/CCb3IkO3FmNGDIkdCWnGbtUmPAEDv67rD4nB2ekykdw1LM3zIcfX7g6kvXkmksm8toGsQ41pdlZrkrhmS8VE/Sd1aDDDBLTFp07m3EgE0qOJJ48SKAEAVbpoLJ/QaQwfU0WJdlZ/a9KSdiiye7TVIJ45n/QVC+CxRejjYsHrXAHL3BPn7swcdueA5CXrrA3aZpt4/al2JAEDDbwROGHjvAdUWg8UPbHGomcdR1f6fI+sYdlLNlD9/1GzrA8OAnrizPBRLAo5XIHOAvFBZNA0PYtoOacw5BlSF"),
                        "{\"version\":3,\"id\":\"CVSxQaBe4cpisdVgRJGZ4DnmFDjpNnzgi6rV2DKdPVPh\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"matcherPublicKey\":\"9JtL1azypH6XRnQcrYRT2qvy8zcRRctTiC4A1M6QywUP\",\"assetPair\":{\"amountAsset\":\"2wBMrTzvncodBbNiXaXju4Z9QpdCFtMp9ZoCRrykk9Dk\",\"priceAsset\":null},\"orderType\":\"buy\",\"amount\":20,\"price\":10,\"timestamp\":1600000000000,\"expiration\":1600001800000,\"matcherFee\":300001,\"signature\":\"4DWL9D4yH4ZTbuNvHQTxNVp5JE6Y2iBtqFjFKpiYLJTBC7egtGTmRK3QPWAcmdZtfhpC1nMxkDTFNoj5dBF3wckK\",\"proofs\":[\"4DWL9D4yH4ZTbuNvHQTxNVp5JE6Y2iBtqFjFKpiYLJTBC7egtGTmRK3QPWAcmdZtfhpC1nMxkDTFNoj5dBF3wckK\",\"hpoex52jrDabZn7VNoD1sKVWkPuyrkQpyMTBAjNTXG6nQrWv3uJLp5KtY5brfiZZpnQ5QufDWexb1duknZSkabi\",\"5pXaLf7QCEZeGmYrGhmMkUWxTRFFtJGCsSUJQwdTyQbnBrgsTa7twXvCqeyttDi89Z3WkMdeLW9vZRX7jQWkx2Ka\",\"57x2WYBnPRpLd2bYdkxF7dKz6q86YjUYeePTguPC2MiPsCVgixxkNxCYEXQPSvkUdf85KymeSg9oTugowDw7PBRW\",\"2hwSg8vvJCnWCftL4s1FCZanBjqrYByDXc5zBVSV7Ed9idTuZgrwxkfNJCTCCU5PvhjRHoc1w1EUmNrJiSz4nNqc\",\"5oDPSGnFUaCqqRhW4aitxnp8sc5KpZTnpByzEePtGqGbTR7LogEurwcpWnrN7eoC7tcYrFGCrz1fvHRS91ED9fPP\",\"RrTXvgRudxct4hsjEbRM4LpVZKWEnruGTpDmnzkuX8jcfjPiJMzyD1bXSMqD6TPuXH2krqoPdTofMvoJEjZgqfN\",\"4udJs17xHuVLUVmZYmPqqC21KQ3q59bUBGfY37sPu8aTrjkvrdqfpQ5jm4zwEjNrAXJAizxobYn97uu1iwQuWkdi\"],\"matcherFeeAssetId\":null}"
                ),
                arguments(4, OrderType.SELL, wavesFee, Id.as("3HqWSTfN4E7XgmUrJvmfg1DLLhFxXLDdzcCwn2ngomB8"),
                        Proof.list(Proof.as("2f1r3PvUFu5dhU9xtAb4Zz58nR3f2Cfd7MXkC1oX8PWLojzQsE1cegH6x4XzkcvJrp2axo3CpjGmdTMMag51dyw9")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GiB7cmfYmspV54WgnQM0k1SqvHeoIndVtd2dY5XqT43lHCIiCiAcvMOhErFe5XG+6rZYJkd2UiQTXKK5FpVOp2mvtUBSqygBMBQ4CkCAgLq7yC5IwO6nvMguUgQQ4acSWAQ="),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GiB7cmfYmspV54WgnQM0k1SqvHeoIndVtd2dY5XqT43lHCIiCiAcvMOhErFe5XG+6rZYJkd2UiQTXKK5FpVOp2mvtUBSqygBMBQ4CkCAgLq7yC5IwO6nvMguUgQQ4acSWARiQFLMoL1UUIpuAOj2+rSFaGIbMi6HMNnD07S7Fwew61dUev+5SFx3VgJLoiL2FpEIkDigIWYETFQpneOHyMn5QoQ="),
                        "{\"version\":4,\"id\":\"3HqWSTfN4E7XgmUrJvmfg1DLLhFxXLDdzcCwn2ngomB8\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"matcherPublicKey\":\"9JtL1azypH6XRnQcrYRT2qvy8zcRRctTiC4A1M6QywUP\",\"assetPair\":{\"amountAsset\":\"2wBMrTzvncodBbNiXaXju4Z9QpdCFtMp9ZoCRrykk9Dk\",\"priceAsset\":null},\"orderType\":\"sell\",\"amount\":20,\"price\":10,\"timestamp\":1600000000000,\"expiration\":1600001800000,\"matcherFee\":300001,\"signature\":\"2f1r3PvUFu5dhU9xtAb4Zz58nR3f2Cfd7MXkC1oX8PWLojzQsE1cegH6x4XzkcvJrp2axo3CpjGmdTMMag51dyw9\",\"proofs\":[\"2f1r3PvUFu5dhU9xtAb4Zz58nR3f2Cfd7MXkC1oX8PWLojzQsE1cegH6x4XzkcvJrp2axo3CpjGmdTMMag51dyw9\"],\"matcherFeeAssetId\":null}"
                ),
                arguments(4, OrderType.BUY, sponsoredFee, Id.as("DWn4ay9gyeaddoWyemDa9KodcA68r1mmTzwW742SyPeS"),
                        Proof.list(Proof.as("4qbBT3MBcBSAhTgoxuSPqAwUjkfCCACUzbEsj9yAwpPf3zLWmKR5ULJ8J6SX1AswtsfdbQSBNgTb5MJquBWyjE9y")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GiB7cmfYmspV54WgnQM0k1SqvHeoIndVtd2dY5XqT43lHCIiCiAcvMOhErFe5XG+6rZYJkd2UiQTXKK5FpVOp2mvtUBSqzAUOApAgIC6u8guSMDup7zILlIkCiAcvMOhErFe5XG+6rZYJkd2UiQTXKK5FpVOp2mvtUBSqxAFWAQ="),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GiB7cmfYmspV54WgnQM0k1SqvHeoIndVtd2dY5XqT43lHCIiCiAcvMOhErFe5XG+6rZYJkd2UiQTXKK5FpVOp2mvtUBSqzAUOApAgIC6u8guSMDup7zILlIkCiAcvMOhErFe5XG+6rZYJkd2UiQTXKK5FpVOp2mvtUBSqxAFWARiQL/z2+i4d7bokF9VPtxA/JJza8FjEoBvh+6m+ML4khJcNXGq8ADDr8K7I1YoiG3wAaIFwa04It/06/1ZKR3jIIw="),
                        "{\"version\":4,\"id\":\"DWn4ay9gyeaddoWyemDa9KodcA68r1mmTzwW742SyPeS\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"matcherPublicKey\":\"9JtL1azypH6XRnQcrYRT2qvy8zcRRctTiC4A1M6QywUP\",\"assetPair\":{\"amountAsset\":\"2wBMrTzvncodBbNiXaXju4Z9QpdCFtMp9ZoCRrykk9Dk\",\"priceAsset\":null},\"orderType\":\"buy\",\"amount\":20,\"price\":10,\"timestamp\":1600000000000,\"expiration\":1600001800000,\"matcherFee\":5,\"signature\":\"4qbBT3MBcBSAhTgoxuSPqAwUjkfCCACUzbEsj9yAwpPf3zLWmKR5ULJ8J6SX1AswtsfdbQSBNgTb5MJquBWyjE9y\",\"proofs\":[\"4qbBT3MBcBSAhTgoxuSPqAwUjkfCCACUzbEsj9yAwpPf3zLWmKR5ULJ8J6SX1AswtsfdbQSBNgTb5MJquBWyjE9y\"],\"matcherFeeAssetId\":\"2wBMrTzvncodBbNiXaXju4Z9QpdCFtMp9ZoCRrykk9Dk\"}"
                ),
                arguments(4, OrderType.BUY, wavesFee, Id.as("7ZGMgJBRXGr96TSS2nkgA4WRTTjHpci5BSFUX4FFsEwE"),
                        Proof.list(Proof.as("ntSVDVdry2qTCDeD41GhBJaBe1wGnPURUmViLybX3SGUDY8RHKzr4eZehkmBpKLo4XQFZEvw6T4qL9qYEaoJe7F"), Proof.as("2eCxoMPk7yJyPd21LbD41kNdjoxkfwF5dz2PJTDYQ64eMosKyb1har2ELuFQ6Yrnbtq3Cj4pXSNb1Xz7fHPR1Hv7"), Proof.as("2evcEtGUdVnNnYirqRPTBMKMWFTGxiEwvKjgh6TG9stAr4N24bQ2sDW6nU2rAH8Z6x3FDu4FtSZvLWnKWzMnSrtT"), Proof.as("5N9Nv6QwqgonMrHh4fFgrgr95L54sQRyKqEUZHZK1QDAhvR6VjhFyAGT4ckzK54VZn8LqwGrwPukZHUh55oFRjKh"), Proof.as("3VmAw42NEzQ9pvR2AuvXDZuPkzBBEnSC5gp4Xp9DnCeDZXsNrAVhN6Rs5ytGjENA7BpPNzRsxaToboq73bjnejUd"), Proof.as("4pCUaLUGZXLpoVwqx3zYQ9KDSwGLAC7Ce45jN7a1oCHPw5xkfWYdmKJHK4PoAqcoqEYpRVaW3RixjbQyEsbSz3M2"), Proof.as("5qpq1RkC1rLbZvT5wFnhEsncm9q6fcJSPX2SbNeyUfMMmv8xJdghTiz3nkeAA8by4gy8nXuf1us4xmady8BJ3jQ7"), Proof.as("2rcSpcgjgVfKAzZALieuA5vqYUGpTckBnc6oh22JZVRuZdou4a9Q2sh1WiQXEZUds7QRGxyjd71rNve8YuDJE8G8")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GiB7cmfYmspV54WgnQM0k1SqvHeoIndVtd2dY5XqT43lHCIiCiAcvMOhErFe5XG+6rZYJkd2UiQTXKK5FpVOp2mvtUBSqzAUOApAgIC6u8guSMDup7zILlIEEOGnElgE"),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GiB7cmfYmspV54WgnQM0k1SqvHeoIndVtd2dY5XqT43lHCIiCiAcvMOhErFe5XG+6rZYJkd2UiQTXKK5FpVOp2mvtUBSqzAUOApAgIC6u8guSMDup7zILlIEEOGnElgEYkAnkjQ1/hkPRMMW+o7Ks9MLSn/1SccwG3eHQPsFzXzEhN0U1kIrL1zQV9WeGGnaAF4xxmY7UjA9fmiowGOyUXmGYkBSGi0FJtR5AOD2WJJKH5DxlnNfNc5h+D5ZCtEOqBSeAoVlWqkOqlCPL0nrGud+faM0wCVzR/IxI63WZU6cqg6IYkBSuLDRHo6yx2cPnNiqzjJWfokLuMkrnppLy93vMjsM2RERJsza0DlHVsQK21Obcm5ewjE5xcjy7GbiUzaA/c6EYkDaTVpqv9KnpFqyddTkprKKIVv3g1NW3PdlyjDhMAh+VZzBM6DXDt9KrFiMEcrg0a2nyPr1CAnwPSqPcFPG2vKEYkB81j4jcVFzIF1ibP8Metf+s3M0xtRThYyWU7asQcQZlqaOa4X6GxdO3fvmMvSXnfgnzgs0a8q+rUFV7vQzEkWCYkC+wKxx2N9SgibLYC53Z2yQsMM8HXfzy9hoPy4GnqP52w3Pg/dIFwsMYsPvRg/q5KL1ansWjVLiXs0fJHlnW46JYkDyLCg6OG+9NTIjjvbu+1SNsdFPNUaOWUr1Eg4ey4cSWAPruE6VPAXfnvyzwmHTUAs3uK8sXlEf5KHzecEDIaWEYkBczLxRK9pIajBMfJ3i/ZLg/BVs/QKsthm0lIWj9Xz0RHq+V3FIoJ+d/PCRyftWDCXXCagzYqMBEE0Lsvwu+FSB"),
                        "{\"version\":4,\"id\":\"7ZGMgJBRXGr96TSS2nkgA4WRTTjHpci5BSFUX4FFsEwE\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"matcherPublicKey\":\"9JtL1azypH6XRnQcrYRT2qvy8zcRRctTiC4A1M6QywUP\",\"assetPair\":{\"amountAsset\":\"2wBMrTzvncodBbNiXaXju4Z9QpdCFtMp9ZoCRrykk9Dk\",\"priceAsset\":null},\"orderType\":\"buy\",\"amount\":20,\"price\":10,\"timestamp\":1600000000000,\"expiration\":1600001800000,\"matcherFee\":300001,\"signature\":\"ntSVDVdry2qTCDeD41GhBJaBe1wGnPURUmViLybX3SGUDY8RHKzr4eZehkmBpKLo4XQFZEvw6T4qL9qYEaoJe7F\",\"proofs\":[\"ntSVDVdry2qTCDeD41GhBJaBe1wGnPURUmViLybX3SGUDY8RHKzr4eZehkmBpKLo4XQFZEvw6T4qL9qYEaoJe7F\",\"2eCxoMPk7yJyPd21LbD41kNdjoxkfwF5dz2PJTDYQ64eMosKyb1har2ELuFQ6Yrnbtq3Cj4pXSNb1Xz7fHPR1Hv7\",\"2evcEtGUdVnNnYirqRPTBMKMWFTGxiEwvKjgh6TG9stAr4N24bQ2sDW6nU2rAH8Z6x3FDu4FtSZvLWnKWzMnSrtT\",\"5N9Nv6QwqgonMrHh4fFgrgr95L54sQRyKqEUZHZK1QDAhvR6VjhFyAGT4ckzK54VZn8LqwGrwPukZHUh55oFRjKh\",\"3VmAw42NEzQ9pvR2AuvXDZuPkzBBEnSC5gp4Xp9DnCeDZXsNrAVhN6Rs5ytGjENA7BpPNzRsxaToboq73bjnejUd\",\"4pCUaLUGZXLpoVwqx3zYQ9KDSwGLAC7Ce45jN7a1oCHPw5xkfWYdmKJHK4PoAqcoqEYpRVaW3RixjbQyEsbSz3M2\",\"5qpq1RkC1rLbZvT5wFnhEsncm9q6fcJSPX2SbNeyUfMMmv8xJdghTiz3nkeAA8by4gy8nXuf1us4xmady8BJ3jQ7\",\"2rcSpcgjgVfKAzZALieuA5vqYUGpTckBnc6oh22JZVRuZdou4a9Q2sh1WiQXEZUds7QRGxyjd71rNve8YuDJE8G8\"],\"matcherFeeAssetId\":null}"
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("ordersProvider")
    void order(int version, OrderType type, Amount fee, Id expectedId, List<Proof> proofs,
               byte[] expectedBody, byte[] expectedBytes, String expectedJson) throws IOException {
        Order builtOrder = Order
                .with(type, amount, price, matcher.publicKey())
                .expiration(expiration)
                .chainId(Waves.chainId)
                .fee(fee.value())
                .feeAsset(fee.asset())
                .timestamp(timestamp)
                .sender(sender)
                .version(version)
                .get();
        proofs.forEach(p -> builtOrder.proofs().add(p));

        assertAll("Order created via builder must be equal to expected bytes",
                () -> assertThat(builtOrder.bodyBytes()).isEqualTo(expectedBody),
                () -> assertThat(builtOrder.id()).isEqualTo(expectedId),
                () -> assertThat(builtOrder.toBytes()).isEqualTo(expectedBytes)
        );

        Order constructedOrder = new Order(sender, type, amount, price, matcher.publicKey(),
                Waves.chainId, fee.value(), fee.asset(), timestamp, expiration, version, proofs);

        assertAll("Orders created via builder and constructor are equal",
                () -> assertThat(builtOrder.bodyBytes()).isEqualTo(constructedOrder.bodyBytes()),
                () -> assertThat(builtOrder.id()).isEqualTo(constructedOrder.id()),
                () -> assertThat(builtOrder.toBytes()).isEqualTo(constructedOrder.toBytes())
        );

        Order deserOrder = Order.fromBytes(expectedBytes);

        assertAll("Order must be deserializable from expected bytes",
                () -> assertThat(deserOrder.type()).isEqualTo(type),
                () -> assertThat(deserOrder.matcher()).isEqualTo(matcher.publicKey()),
                () -> assertThat(deserOrder.amount()).isEqualTo(amount),
                () -> assertThat(deserOrder.price()).isEqualTo(price),
                () -> assertThat(deserOrder.expiration()).isEqualTo(expiration),

                () -> assertThat(deserOrder.version()).isEqualTo(version),
                () -> assertThat(deserOrder.chainId()).isEqualTo(Waves.chainId),
                () -> assertThat(deserOrder.sender()).isEqualTo(sender),
                () -> assertThat(deserOrder.fee()).isEqualTo(fee.value()),
                () -> assertThat(deserOrder.feeAsset()).isEqualTo(fee.asset()),
                () -> assertThat(deserOrder.timestamp()).isEqualTo(timestamp),
                () -> assertThat(deserOrder.proofs()).isEqualTo(proofs),

                () -> assertThat(deserOrder.bodyBytes()).isEqualTo(expectedBody),
                () -> assertThat(deserOrder.toBytes()).isEqualTo(expectedBytes),
                () -> assertThat(deserOrder.id()).isEqualTo(expectedId)
        );

        assertThat(builtOrder)
                .describedAs("Order must be equal to deserialized order")
                .isEqualTo(deserOrder);

        assertThat(JSON_MAPPER.readTree(Order.fromJson(expectedJson).toJson()))
                .describedAs("Order serialized to json must be equal to expected")
                .isEqualTo(JSON_MAPPER.readTree(expectedJson));
    }

}
