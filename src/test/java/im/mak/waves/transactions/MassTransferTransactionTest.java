package im.mak.waves.transactions;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.transactions.account.Address;
import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.crypto.base.Base58;
import im.mak.waves.crypto.base.Base64;
import im.mak.waves.transactions.common.*;
import im.mak.waves.transactions.mass.Transfer;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.util.List;
import java.util.stream.Stream;

import static im.mak.waves.transactions.serializers.json.JsonSerializer.JSON_MAPPER;
import static java.util.Arrays.asList;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.params.provider.Arguments.arguments;

public class MassTransferTransactionTest {

    static PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
    static long timestamp = 1600000000000L;
    static long minAmount = 0;
    static long maxAmount = Long.MAX_VALUE;
    static long fee = MassTransferTransaction.MIN_FEE + 1;

    @BeforeAll
    static void beforeAll() {
        WavesJConfig.chainId('R');
    }

    static Stream<Arguments> transactionsProvider() {
        List<Transfer> alias = asList(
                Transfer.to(Alias.as("rich"), minAmount),
                Transfer.to(Alias.as("_rich-account.with@30_symbols_"), maxAmount)
        );
        List<Transfer> address = asList(
                Transfer.to(Address.from(WavesJConfig.chainId(), sender), maxAmount),
                Transfer.to(Address.from(WavesJConfig.chainId(), sender), minAmount)
        );
        AssetId assetId = AssetId.as("CjwUuXHmQvBXtykMLDD9QXWHMqawZCW3VoomauCM1XVJ");
        byte[] attachment = Base58.decode("2euEyjatz3mkRYDDPGe4rXbZrrVa3qk9Ghvc9fEVpw9mn6eTNeVimm1ae2Y5Lc1jjDXFuyj7uGxBgG8TzxZM4kaBKG1nZ4ReXEA1ACaQrL5HGmfHhHPiwEBYgXFR5opqjFcd4USi3PTevRkp6CkJghJBXozpvmC9vcBHBADQZ34PdDBkUk135d7pMrcS8siy");

        return Stream.of(
                arguments(1, address, AssetId.WAVES, Bytes.empty(), Id.as("9BctskM13RG8ZpSnCexp9ZyE2ktdnK38qSMQmjxZcJTS"),
                        Proof.list(Proof.as("5FQQuuzeTp6tS1pTNEd3citefhB75ax6vbq38kC7xieTKsRTL3dv2sRQJFXJU4Zk5rHasCTFzZt8kjQPAQpcSJBm")),
                        Base64.decode("CwGNj7KNwHV8CsVGLbpgRgDsF4sHe1SAkroj0YoxaGM3dAAAAgFSJ4nJhdNdZ9aF3A6Yui8hbYa+j7wGgKYwf/////////8BUieJyYXTXWfWhdwOmLovIW2Gvo+8BoCmMAAAAAAAAAAAAAABdIdugAAAAAAAAAGGoQAA"),
                        Base64.decode("CwGNj7KNwHV8CsVGLbpgRgDsF4sHe1SAkroj0YoxaGM3dAAAAgFSJ4nJhdNdZ9aF3A6Yui8hbYa+j7wGgKYwf/////////8BUieJyYXTXWfWhdwOmLovIW2Gvo+8BoCmMAAAAAAAAAAAAAABdIdugAAAAAAAAAGGoQAAAQABAEDUfTnMeCd0Fp6O+edbGkUIHIe3EhtswBteKlznRzqIqv/BTFeBi427lPGbNe904ycuxcsLQCz1jOOj/1jY+3uM"),
                        "{\"type\":11,\"id\":\"9BctskM13RG8ZpSnCexp9ZyE2ktdnK38qSMQmjxZcJTS\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"fee\":100001,\"feeAssetId\":null,\"timestamp\":1600000000000,\"proofs\":[\"5FQQuuzeTp6tS1pTNEd3citefhB75ax6vbq38kC7xieTKsRTL3dv2sRQJFXJU4Zk5rHasCTFzZt8kjQPAQpcSJBm\"],\"version\":1,\"assetId\":null,\"attachment\":\"\",\"transfers\":[{\"recipient\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"amount\":9223372036854775807},{\"recipient\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"amount\":0}]}"
                ),
                arguments(1, alias, assetId, attachment, Id.as("31JjDMAjiZs7z5WQ946nNVqfnswPJr1BKY4VqPKwnSCp"),
                        Proof.list(Proof.as("4mtzaKLLdh1uJt721UxeD92VymykWUtcUkpsAQBVovMJDKht4QUmfnRFdVe5YwVzkyxLcnaNwCxBZGRodeDJu6J7"), Proof.as("pJzmF6KFfWdNaL9BwUaRGQoWFZqbzGMyHTCb8kFfqYZZgcdT77T7obp5K7HeY8WikwgbRYC6Js7Wsc9eMtyXFcN"), Proof.as("2H68Q5PbKUchYcVzPsdJHUNL7AxE2yoTV3y4yJX8m8fviZAZz3xfLP4kFh5Tusz8tp5qaEH3fqw7xznoscpCEV4J"), Proof.as("5u6R34QFKM1ChKk2tVaYFaUAQveY6T8nSrjfoqpNcD9zBksLfkU33jrzJ76Ucsjh6Y8LyJ2zPPCXdbtd6jfe4cqv"), Proof.as("227aNJpans7MAqs9TqhoRKXSMeYVNsdPNNVW3sVWEkWDGnxwRdExumUZkbcEVst64jp5XRBDBjZwmT6w6VKVsobD"), Proof.as("5xJ82iJwJ89TLdzVgh2SVZN4w3uxMdHYbEGJmSHKug5AvR48oYB8ssc17UrrXq7bcZiPFj8MXnjByAdTeYGMDCvw"), Proof.as("3iqPkM85pak9o7zo1EX9HTASsM68ivF3hUQ9LjkN3adPB42Q3ndZWtrKNNaxnDQTEwdYZCsqB6TkcHsBn6de7Jos"), Proof.as("5xmCTJNSYxL6vBFgf6GKGc6LHnyH4Xfxo4aVHe67wwrNMTpStLZqDRk2C3W8LAhd41cVtBApsbgwfRLDnTgAEwNz")),
                        Base64.decode("CwGNj7KNwHV8CsVGLbpgRgDsF4sHe1SAkroj0YoxaGM3dAGucI1bwtimUPqsjCs4YL6vk36ZLEQAqsoooz7LtZOTQQACAlIABHJpY2gAAAAAAAAAAAJSAB5fcmljaC1hY2NvdW50LndpdGhAMzBfc3ltYm9sc19//////////wAAAXSHboAAAAAAAAABhqEAjMH+IimjxAOvYBD63pDyDoDKGXqb2AaLxRHzzaJcGIK5BCrrrVgegMNYSkimx35XXcNqoyxlKLlMs+PsxbstPVx54ARIHiWJ6hzemfOddd1B+XxYc1SHsR9h+6MFTW3uWWutOb560vUN0Q9sC+ES/oOT2C1XLIEnXKYwq+w7MEhyf3czCThZvFzGfsxS"),
                        Base64.decode("CwGNj7KNwHV8CsVGLbpgRgDsF4sHe1SAkroj0YoxaGM3dAGucI1bwtimUPqsjCs4YL6vk36ZLEQAqsoooz7LtZOTQQACAlIABHJpY2gAAAAAAAAAAAJSAB5fcmljaC1hY2NvdW50LndpdGhAMzBfc3ltYm9sc19//////////wAAAXSHboAAAAAAAAABhqEAjMH+IimjxAOvYBD63pDyDoDKGXqb2AaLxRHzzaJcGIK5BCrrrVgegMNYSkimx35XXcNqoyxlKLlMs+PsxbstPVx54ARIHiWJ6hzemfOddd1B+XxYc1SHsR9h+6MFTW3uWWutOb560vUN0Q9sC+ES/oOT2C1XLIEnXKYwq+w7MEhyf3czCThZvFzGfsxSAQAIAEC8xJmNnL0hPkDIHWCuxxOXVHlt8Kzn3CRrO35fvfkbDWBIQ6IqOZPWM3chkIMWqjzIECZ1VTCT4WLkG8FKh1KEAEAozHAMdJolKDMEYuMaAwf5iNrznDuKXXoCb7qB/zuZRbrBrSORZcuzBG89pNg4ZyqBWOHeRwGc2+SyoQjLkeKLAEA/5Bp6pAP1EU7TWwy778AnxjOJe14br0AIlmVXkIZz1cmJKVACr1WoOj08cVFG+Fk8UXBFHV61r57AvR+2CZCHAED0/cdTk2CcDqy0ka1aUPfx3pPk1ygxTQhpLUWdEIu4wS2BihuChfwF4Hbjyk8SWQEuHIeSy7+grKchergQFPOJAEAy+iTMxebQGcvgt26TPT3SVmlp6HT7wHJiiZvxHWBoXD6AGns/BezxLIWsyafM6WdMY3pvBw2ToP1JBrqD6jaIAED3wKHQqQiKx+zxbPU+13gy36jvUi2kC86anFJ7kaHGtbODSukyY499fu1KYTVE/yAm1ZH87CpalPUCu/2tvWyEAECIHD/xFM4INxRtYa071L0oe8n7sMCUyxw4vdXb/oplPZX2iY2StaWsYMNNLUSZT+yEBtqQiHHXeuTOK66CDRKCAED4J7EynrMYrwA1goq7mJU469kDgwRGuET1N7sqfp/KlvlIwwPeZlPUNbNCXg5oqZBeR18VcoJZgCNzctYJZcSL"),
                        "{\"type\":11,\"id\":\"31JjDMAjiZs7z5WQ946nNVqfnswPJr1BKY4VqPKwnSCp\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"fee\":100001,\"feeAssetId\":null,\"timestamp\":1600000000000,\"proofs\":[\"4mtzaKLLdh1uJt721UxeD92VymykWUtcUkpsAQBVovMJDKht4QUmfnRFdVe5YwVzkyxLcnaNwCxBZGRodeDJu6J7\",\"pJzmF6KFfWdNaL9BwUaRGQoWFZqbzGMyHTCb8kFfqYZZgcdT77T7obp5K7HeY8WikwgbRYC6Js7Wsc9eMtyXFcN\",\"2H68Q5PbKUchYcVzPsdJHUNL7AxE2yoTV3y4yJX8m8fviZAZz3xfLP4kFh5Tusz8tp5qaEH3fqw7xznoscpCEV4J\",\"5u6R34QFKM1ChKk2tVaYFaUAQveY6T8nSrjfoqpNcD9zBksLfkU33jrzJ76Ucsjh6Y8LyJ2zPPCXdbtd6jfe4cqv\",\"227aNJpans7MAqs9TqhoRKXSMeYVNsdPNNVW3sVWEkWDGnxwRdExumUZkbcEVst64jp5XRBDBjZwmT6w6VKVsobD\",\"5xJ82iJwJ89TLdzVgh2SVZN4w3uxMdHYbEGJmSHKug5AvR48oYB8ssc17UrrXq7bcZiPFj8MXnjByAdTeYGMDCvw\",\"3iqPkM85pak9o7zo1EX9HTASsM68ivF3hUQ9LjkN3adPB42Q3ndZWtrKNNaxnDQTEwdYZCsqB6TkcHsBn6de7Jos\",\"5xmCTJNSYxL6vBFgf6GKGc6LHnyH4Xfxo4aVHe67wwrNMTpStLZqDRk2C3W8LAhd41cVtBApsbgwfRLDnTgAEwNz\"],\"version\":1,\"assetId\":\"CjwUuXHmQvBXtykMLDD9QXWHMqawZCW3VoomauCM1XVJ\",\"attachment\":\"2euEyjatz3mkRYDDPGe4rXbZrrVa3qk9Ghvc9fEVpw9mn6eTNeVimm1ae2Y5Lc1jjDXFuyj7uGxBgG8TzxZM4kaBKG1nZ4ReXEA1ACaQrL5HGmfHhHPiwEBYgXFR5opqjFcd4USi3PTevRkp6CkJghJBXozpvmC9vcBHBADQZ34PdDBkUk135d7pMrcS8siy\",\"transfers\":[{\"recipient\":\"alias:R:rich\",\"amount\":0},{\"recipient\":\"alias:R:_rich-account.with@30_symbols_\",\"amount\":9223372036854775807}]}"
                ),
                arguments(2, address, AssetId.WAVES, Bytes.empty(), Id.as("ByZGfrDr5YLvUCHWm2Rn4N2NrvYTkLjckGejw33aAFa3"),
                        Proof.list(Proof.as("4Y6QTs5R1vBEb9rJWjWKJcN2yrEacb4xur5HJ3obFGNQdAaNZaoSaoB3FH7q2RSHpr8jEgroaLDYdPnxnFhjYU2H")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigC+gY+EiIKFgoUJ4nJhdNdZ9aF3A6Yui8hbYa+j7wQ//////////9/EhgKFgoUJ4nJhdNdZ9aF3A6Yui8hbYa+j7w="),
                        Base64.decode("CnQIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBChjQYggIC6u8guKAL6Bj4SIgoWChQnicmF011n1oXcDpi6LyFthr6PvBD//////////38SGAoWChQnicmF011n1oXcDpi6LyFthr6PvBJAsN1UxZp8jk13dap9jMkG7Pd8kXfLAU/XJIr5phpYCsaiN1FBqxW3ft0JxdVBegbD9RcAxo31S3qczRGT4Wn0jg=="),
                        "{\"type\":11,\"id\":\"ByZGfrDr5YLvUCHWm2Rn4N2NrvYTkLjckGejw33aAFa3\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"fee\":100001,\"feeAssetId\":null,\"timestamp\":1600000000000,\"proofs\":[\"4Y6QTs5R1vBEb9rJWjWKJcN2yrEacb4xur5HJ3obFGNQdAaNZaoSaoB3FH7q2RSHpr8jEgroaLDYdPnxnFhjYU2H\"],\"version\":2,\"chainId\":82,\"assetId\":null,\"attachment\":\"\",\"transfers\":[{\"recipient\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"amount\":9223372036854775807},{\"recipient\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"amount\":0}]}"
                ),
                arguments(2, alias, assetId, attachment, Id.as("9fwbZPRhfGE5QJCf83QgW56tupfL5NiyeAr1yqxoMR9k"),
                        Proof.list(Proof.as("3BgvqHsECX2QhxT71PPgUEQKKasgNuWTFo2gB8Uc6FfhX7LGizXL1TaS1jkGxMSJKX2pyuaX9CWaScQ8pbQ3EAtv"), Proof.as("2LHhVLB77di41A2eiahzTvjoKk78F7TnBneRG1LiozzF77P4th6hJFiTYsyYkadZFtPiZzpkjBWJiiAGAGs8VEnm"), Proof.as("5gA3bnt7VKWyDbQM6zt5FRSnaGxFzE5Zft48jGwuGKFrKTX3WHSVA3WyMGBXbmtF7kz2U2cUxeFT6cFZZYgxM7zK"), Proof.as("55VRmZbyC879dpHHHnK9mQ49S7ETaSBtrjWQRoqvmvr74njBeCigyLa6E5kCVPF4WdtXVxo2x8FxbjtWeW9qxHTL"), Proof.as("4J4TTs4bwDtAaq5s7mzyXrAvvVJ1GwBEE2CLYDdDH5vkGDnEwFaps45XBjajMMcHQTF31Umx2i6QLGSF8SrUSsxC"), Proof.as("3TSt3w3XatkKuUqrywUu8ziCP5RVknNgRHDtkdDn2dQZtK6LVi6s5S4jLrdzKK7P6Y82NCHh3FHYAoe9KV65sQYN"), Proof.as("KFyiV8H4PaVEhVJb7haqE5L3zG5zfLVJutTayYmt25ZTqtdhwkKEyWyjrbYDznRBYVeKWFyyxg7CiHTCCBZm5CP"), Proof.as("2yEZadLuEBJRB8BUGasq9LfpGgB8SEKjt9GAHX9fAQM8i6ZurYGtF9Df9Qx62Q8YAmMs9QokJcR5dDwE4fh7tzYc")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigC+gbpAQogrnCNW8LYplD6rIwrOGC+r5N+mSxEAKrKKKM+y7WTk0ESCAoGEgRyaWNoEiwKIBIeX3JpY2gtYWNjb3VudC53aXRoQDMwX3N5bWJvbHNfEP//////////fxqMAcH+IimjxAOvYBD63pDyDoDKGXqb2AaLxRHzzaJcGIK5BCrrrVgegMNYSkimx35XXcNqoyxlKLlMs+PsxbstPVx54ARIHiWJ6hzemfOddd1B+XxYc1SHsR9h+6MFTW3uWWutOb560vUN0Q9sC+ES/oOT2C1XLIEnXKYwq+w7MEhyf3czCThZvFzGfsxS"),
                        Base64.decode("CqACCFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigC+gbpAQogrnCNW8LYplD6rIwrOGC+r5N+mSxEAKrKKKM+y7WTk0ESCAoGEgRyaWNoEiwKIBIeX3JpY2gtYWNjb3VudC53aXRoQDMwX3N5bWJvbHNfEP//////////fxqMAcH+IimjxAOvYBD63pDyDoDKGXqb2AaLxRHzzaJcGIK5BCrrrVgegMNYSkimx35XXcNqoyxlKLlMs+PsxbstPVx54ARIHiWJ6hzemfOddd1B+XxYc1SHsR9h+6MFTW3uWWutOb560vUN0Q9sC+ES/oOT2C1XLIEnXKYwq+w7MEhyf3czCThZvFzGfsxSEkBtQFP4wk3qpVVkuodZFjfkLH232G5Kq+e+IxSlHn2dSPfcYl/t4lITDByucO4+6yq0w9A8OSky5wIngEn9C2SPEkBCpnAwVh9S2//9qQLmwMra6F0RLGsZ/fH02yLuEzI0TbTaQ2BtKIlwe+7VtbC9f8PsZ6tEXbuc9ry6hsL44ZeCEkDp1af6p+6FKmvWY31yLDx+OT5UhRjcuiseIvQTZFjIYaBbjAbyyImGS5/P4ty59Ywnbra/aFJrtfoJakDSRFKEEkDL8KqkBBdxDMQoQzc1yAoN//rICWYFP1OskPO8M2pc/cu/34UbImZpLb1QH9Aq0cF+7ArsKy+jnkMYnCBr3+OPEkCkwzW7G+xKX+v9jJMzL5xByKWifKWe/uyZEI0cZHzeuujwu7TRgANCWWzfXmmEawWjNSCM8tvw4QZmRqLHnpGBEkB61xejNLz/C5NowNWZtXeAadldn4h0t4XLhVoK6D3vCDmpmGoG+Wy41I0fcY/FxsjCXQEcWOoKocDA8Nst/PeHEkAPvsY3uNTHfCWW7qL5OcaS6Q0XZ8qNiuSkV2rAdrDVoDGXyor/O2H7t5FYK56cd+roJ9XmJFIeKSbnsnUrrV6EEkBigssqW4i7G5xMPnov8SZDsg2JQEYCEcssTEIZOEAlUz52lOR04pi5yQHxvHySFz1uwOvqsWPNXo5F/VGW/5+F"),
                        "{\"type\":11,\"id\":\"9fwbZPRhfGE5QJCf83QgW56tupfL5NiyeAr1yqxoMR9k\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"fee\":100001,\"feeAssetId\":null,\"timestamp\":1600000000000,\"proofs\":[\"3BgvqHsECX2QhxT71PPgUEQKKasgNuWTFo2gB8Uc6FfhX7LGizXL1TaS1jkGxMSJKX2pyuaX9CWaScQ8pbQ3EAtv\",\"2LHhVLB77di41A2eiahzTvjoKk78F7TnBneRG1LiozzF77P4th6hJFiTYsyYkadZFtPiZzpkjBWJiiAGAGs8VEnm\",\"5gA3bnt7VKWyDbQM6zt5FRSnaGxFzE5Zft48jGwuGKFrKTX3WHSVA3WyMGBXbmtF7kz2U2cUxeFT6cFZZYgxM7zK\",\"55VRmZbyC879dpHHHnK9mQ49S7ETaSBtrjWQRoqvmvr74njBeCigyLa6E5kCVPF4WdtXVxo2x8FxbjtWeW9qxHTL\",\"4J4TTs4bwDtAaq5s7mzyXrAvvVJ1GwBEE2CLYDdDH5vkGDnEwFaps45XBjajMMcHQTF31Umx2i6QLGSF8SrUSsxC\",\"3TSt3w3XatkKuUqrywUu8ziCP5RVknNgRHDtkdDn2dQZtK6LVi6s5S4jLrdzKK7P6Y82NCHh3FHYAoe9KV65sQYN\",\"KFyiV8H4PaVEhVJb7haqE5L3zG5zfLVJutTayYmt25ZTqtdhwkKEyWyjrbYDznRBYVeKWFyyxg7CiHTCCBZm5CP\",\"2yEZadLuEBJRB8BUGasq9LfpGgB8SEKjt9GAHX9fAQM8i6ZurYGtF9Df9Qx62Q8YAmMs9QokJcR5dDwE4fh7tzYc\"],\"version\":2,\"chainId\":82,\"assetId\":\"CjwUuXHmQvBXtykMLDD9QXWHMqawZCW3VoomauCM1XVJ\",\"attachment\":\"2euEyjatz3mkRYDDPGe4rXbZrrVa3qk9Ghvc9fEVpw9mn6eTNeVimm1ae2Y5Lc1jjDXFuyj7uGxBgG8TzxZM4kaBKG1nZ4ReXEA1ACaQrL5HGmfHhHPiwEBYgXFR5opqjFcd4USi3PTevRkp6CkJghJBXozpvmC9vcBHBADQZ34PdDBkUk135d7pMrcS8siy\",\"transfers\":[{\"recipient\":\"alias:R:rich\",\"amount\":0},{\"recipient\":\"alias:R:_rich-account.with@30_symbols_\",\"amount\":9223372036854775807}]}"
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("transactionsProvider")
    void massTransferTransaction(int version, List<Transfer> transfers, AssetId assetId, byte[] attachment,
                                 Id expectedId, List<Proof> proofs, byte[] expectedBody, byte[] expectedBytes,
                                 String expectedJson) throws IOException {
        MassTransferTransaction builtTx = MassTransferTransaction
                .with(transfers)
                .assetId(assetId)
                .attachment(attachment)
                .chainId(WavesJConfig.chainId())
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

        MassTransferTransaction constructedTx = new MassTransferTransaction(sender, assetId, transfers, attachment,
                WavesJConfig.chainId(), Amount.of(fee), timestamp, version, proofs);

        assertAll("Txs created via builder and constructor are equal",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(constructedTx.bodyBytes()),
                () -> assertThat(builtTx.id()).isEqualTo(constructedTx.id()),
                () -> assertThat(builtTx.toBytes()).isEqualTo(constructedTx.toBytes())
        );

        MassTransferTransaction deserTx = MassTransferTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> assertThat(deserTx.transfers()).isEqualTo(transfers),
                () -> assertThat(deserTx.assetId()).isEqualTo(assetId),
                () -> assertThat(deserTx.attachmentBytes()).isEqualTo(attachment),

                () -> assertThat(deserTx.version()).isEqualTo(version),
                () -> assertThat(deserTx.chainId()).isEqualTo(WavesJConfig.chainId()),
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
