package im.mak.waves.transactions;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.account.Address;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.crypto.base.Base58;
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

public class TransferTransactionTest {

    static PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
    static long timestamp = 1600000000000L;
    static long amount = Long.MAX_VALUE;

    @BeforeAll
    static void beforeAll() {
        Waves.chainId = 'R';
    }

    static Stream<Arguments> transactionsProvider() {
        Recipient alias = Recipient.as(Alias.as("_rich-account.with@30_symbols_"));
        Recipient address = Recipient.as(Address.from(sender, Waves.chainId));
        AssetId assetId = AssetId.as("9Z9DqJz4GbrJiMDHRFdGPz4GdVy6sWzzRQKZARkvsgMp");
        byte[] attachment = Base58.decode("zdRB3cqsKNeYxTf1AN4uJhWHe6hyT3DmguhM7oh4rdCjH8w9bbqChPcbTWTzTou9h84yq87Nt6NUGiLdUjpfypy3zSDe4n2DZcuQD2Y2zaUAq1m863kSAUuTYY1HdHyCJkpxE9PbKWAKR68v2WrVqskboaUYQdqaMWWeHDW8Z5c4kDQf3MLJzNSbUWCzu5A");

        long fee = TransferTransaction.MIN_FEE + 1;

        return Stream.of(
                arguments(1, address, assetId, Bytes.empty(), AssetId.WAVES, fee, Id.as("6EZtyjhgDk1h367vXz5wr8hNzykrmkkAQ5kYJtL41FwY"),
                        Proof.list(Proof.as("eS6eniKoVG2Ejxc8kNUsDayV666dXsd882euBPgYeMt2obdURQwgjsmuSQvC29odojG9PcHkBSv36pQfg3VTonE")),
                        Base64.decode("BI2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AX8ZYIoP0AM/RpZyk9YhbNsBC4lAHTeJoaDzCnGmZOuzAAAAAXSHboAAf/////////8AAAAAAAGGoQFSJ4nJhdNdZ9aF3A6Yui8hbYa+j7wGgKYwAAA="),
                        Base64.decode("BCBH0kKYk6eEIbwjty/heoNv9wLfQoJXQpeJqJK3q+GzxB/IgNDbQxLGjSOxukkSaPzFpPSAFm+MVQorceDcm4cEjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QBfxlgig/QAz9GlnKT1iFs2wELiUAdN4mhoPMKcaZk67MAAAABdIdugAB//////////wAAAAAAAYahAVInicmF011n1oXcDpi6LyFthr6PvAaApjAAAA=="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"amount\":9223372036854775807,\"signature\":\"eS6eniKoVG2Ejxc8kNUsDayV666dXsd882euBPgYeMt2obdURQwgjsmuSQvC29odojG9PcHkBSv36pQfg3VTonE\",\"fee\":100001,\"type\":4,\"version\":1,\"attachment\":\"\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"proofs\":[\"eS6eniKoVG2Ejxc8kNUsDayV666dXsd882euBPgYeMt2obdURQwgjsmuSQvC29odojG9PcHkBSv36pQfg3VTonE\"],\"assetId\":\"9Z9DqJz4GbrJiMDHRFdGPz4GdVy6sWzzRQKZARkvsgMp\",\"recipient\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"id\":\"6EZtyjhgDk1h367vXz5wr8hNzykrmkkAQ5kYJtL41FwY\",\"timestamp\":1600000000000}"
                ),
                arguments(1, alias, AssetId.WAVES, attachment, AssetId.WAVES, fee, Id.as("5BiMMPemNvcDkx4jCLPiV5VGycN6toHCQt9Gn5yLYeoF"),
                        Proof.list(Proof.as("2bjzDPMq3W9Zoue1wiUSjGoS796Moi1AYLoe9KS7vgF2uoKBhAZRb8GSnsERNHbquSoZwYcMTRy2fz2euBP3fsF7")),
                        Base64.decode("BI2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AAAAAAF0h26AAH//////////AAAAAAABhqECUgAeX3JpY2gtYWNjb3VudC53aXRoQDMwX3N5bWJvbHNfAIx0kpETJXfRomqfPtkbkh65Ox1XKaHKX4aMNZFyYuKW9FzvpRwMjmqnAjvzWfGoafJzkseBzdlwZYC+btsrBOnpOyPcnBCWk1vU46dMQIihyJreOPexebLrN1zRXG3Rns2Emo3MeTt+YdwlzmsdHGSNKB3FgUbl+ypw/3/Ajz0wmzWDqqPzFiv3X5OmuQ=="),
                        Base64.decode("BE/5+DRQ3S6Kx/UHzeg2iKwZcXhwT6LDVg54UmoOzGcDU5NefWMT9tSwz9uktJc8S2b/jUwK9WCEGXRbCXpoD4oEjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QAAAAAAXSHboAAf/////////8AAAAAAAGGoQJSAB5fcmljaC1hY2NvdW50LndpdGhAMzBfc3ltYm9sc18AjHSSkRMld9Giap8+2RuSHrk7HVcpocpfhow1kXJi4pb0XO+lHAyOaqcCO/NZ8ahp8nOSx4HN2XBlgL5u2ysE6ek7I9ycEJaTW9Tjp0xAiKHImt4497F5sus3XNFcbdGezYSajcx5O35h3CXOax0cZI0oHcWBRuX7KnD/f8CPPTCbNYOqo/MWK/dfk6a5"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"amount\":9223372036854775807,\"signature\":\"2bjzDPMq3W9Zoue1wiUSjGoS796Moi1AYLoe9KS7vgF2uoKBhAZRb8GSnsERNHbquSoZwYcMTRy2fz2euBP3fsF7\",\"fee\":100001,\"type\":4,\"version\":1,\"attachment\":\"zdRB3cqsKNeYxTf1AN4uJhWHe6hyT3DmguhM7oh4rdCjH8w9bbqChPcbTWTzTou9h84yq87Nt6NUGiLdUjpfypy3zSDe4n2DZcuQD2Y2zaUAq1m863kSAUuTYY1HdHyCJkpxE9PbKWAKR68v2WrVqskboaUYQdqaMWWeHDW8Z5c4kDQf3MLJzNSbUWCzu5A\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"proofs\":[\"2bjzDPMq3W9Zoue1wiUSjGoS796Moi1AYLoe9KS7vgF2uoKBhAZRb8GSnsERNHbquSoZwYcMTRy2fz2euBP3fsF7\"],\"assetId\":null,\"recipient\":\"alias:R:_rich-account.with@30_symbols_\",\"id\":\"5BiMMPemNvcDkx4jCLPiV5VGycN6toHCQt9Gn5yLYeoF\",\"timestamp\":1600000000000}"
                ),
                arguments(2, address, assetId, Bytes.empty(), AssetId.WAVES, fee, Id.as("68hXdLALf181LWJmV8AhUoW5XRmxjG5iG7Hu2PWb5nMT"),
                        Proof.list(Proof.as("66pA5k76M8ZUf4QmD1XyTorxB1BEaaoLSALMb8YeExFa5oqkXAspRMCy6M7sx413q2fCL1FG12dr3ebcrXG9Afbp")),
                        Base64.decode("BAKNj7KNwHV8CsVGLbpgRgDsF4sHe1SAkroj0YoxaGM3dAF/GWCKD9ADP0aWcpPWIWzbAQuJQB03iaGg8wpxpmTrswAAAAF0h26AAH//////////AAAAAAABhqEBUieJyYXTXWfWhdwOmLovIW2Gvo+8BoCmMAAA"),
                        Base64.decode("AAQCjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QBfxlgig/QAz9GlnKT1iFs2wELiUAdN4mhoPMKcaZk67MAAAABdIdugAB//////////wAAAAAAAYahAVInicmF011n1oXcDpi6LyFthr6PvAaApjAAAAEAAQBA/xkSpvOA06v0BN/DzAPX72jx8T1rUwYvGpr7K6s4anIyvznYF4YrbByC/Unv62tT+aq/DUlWqfc4vQOTbW58gw=="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"amount\":9223372036854775807,\"fee\":100001,\"type\":4,\"version\":2,\"attachment\":\"\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"proofs\":[\"66pA5k76M8ZUf4QmD1XyTorxB1BEaaoLSALMb8YeExFa5oqkXAspRMCy6M7sx413q2fCL1FG12dr3ebcrXG9Afbp\"],\"assetId\":\"9Z9DqJz4GbrJiMDHRFdGPz4GdVy6sWzzRQKZARkvsgMp\",\"recipient\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"id\":\"68hXdLALf181LWJmV8AhUoW5XRmxjG5iG7Hu2PWb5nMT\",\"timestamp\":1600000000000}"
                ),
                arguments(2, alias, AssetId.WAVES, attachment, assetId, 2, Id.as("4MnsP1xt96TGPHPNyFW8Mo41FnU2drewHyiCFvavMJDB"),
                        Proof.list(Proof.as("4aeNQfrgYCy6ZVZcEiGMceUSPMeLKM28bbBcpZdqVr8JsHfngoNEVGYGbGU5sWK5tyA7HuQPeStnBT7aM3aMJvJv"), Proof.as("3jQbrQdbURWnZrjpWjXbdzmceoiqtyqZugTG4aZLWaqY9bPkePFGmbmT7RAumKzZSixR3akGGdXVGc9jmbfDmacW"), Proof.as("67eFhUmCveoxAdgKCheMHpDKaKeE1fHqajJEjcCTWPbNub6xVmTH8kthD8Ap3txE3DhxL59GfBr4bU7drSN5GjhY"), Proof.as("5tuCQwh7tG53YnjpwM9ADDEzaxPxCfCheJeJWs6KhQG9utcFuC9nt2s2uLyPdomJbjsDeWwK9NpAxftW1bzmVRz4"), Proof.as("5SBnyDU4QmVM3dyEC6utXZANw2GCpJaZTNwbAMSU2D3VhciKqvomWsfxLEg3RGMMgm2KfQJ58ygM2S3fyjnJEfih"), Proof.as("2NsaEpeWzxWm65ZqkcgUwSuGPQQhw81G3AEwhKRsXp94oFMngyYc4wV96R8QZKSReEPtd5pnKHEC67LzzXiPz8xs"), Proof.as("2jakSJzkZy62gqDVeAawc8Ez8tMkCsUoPJEM1ZTmSScwmjqNHkfufn3aTFcCzGtpq7wAWRfEeoBTvYKLHDEafHAR"), Proof.as("55kV9ggm31BfUbJxUFJ4dexkJWdu8w2wvkmWrRUnCZBWf7K5nrtvRfmLW5bx732vAsXNgaHduvgnZmej4EZjcwEh")),
                        Base64.decode("BAKNj7KNwHV8CsVGLbpgRgDsF4sHe1SAkroj0YoxaGM3dAABfxlgig/QAz9GlnKT1iFs2wELiUAdN4mhoPMKcaZk67MAAAF0h26AAH//////////AAAAAAAAAAICUgAeX3JpY2gtYWNjb3VudC53aXRoQDMwX3N5bWJvbHNfAIx0kpETJXfRomqfPtkbkh65Ox1XKaHKX4aMNZFyYuKW9FzvpRwMjmqnAjvzWfGoafJzkseBzdlwZYC+btsrBOnpOyPcnBCWk1vU46dMQIihyJreOPexebLrN1zRXG3Rns2Emo3MeTt+YdwlzmsdHGSNKB3FgUbl+ypw/3/Ajz0wmzWDqqPzFiv3X5OmuQ=="),
                        Base64.decode("AAQCjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QAAX8ZYIoP0AM/RpZyk9YhbNsBC4lAHTeJoaDzCnGmZOuzAAABdIdugAB//////////wAAAAAAAAACAlIAHl9yaWNoLWFjY291bnQud2l0aEAzMF9zeW1ib2xzXwCMdJKREyV30aJqnz7ZG5IeuTsdVymhyl+GjDWRcmLilvRc76UcDI5qpwI781nxqGnyc5LHgc3ZcGWAvm7bKwTp6Tsj3JwQlpNb1OOnTECIocia3jj3sXmy6zdc0Vxt0Z7NhJqNzHk7fmHcJc5rHRxkjSgdxYFG5fsqcP9/wI89MJs1g6qj8xYr91+TprkBAAgAQLMQht9Mr3g4D+qcs4IMafynhfAsUtFXpc3mPMV3d090amonWla3sMrKDiCJlQsjtsCnvGm7BbgTVRCW7gybq4sAQIiaptEsaJ+WNoQtmrHyCMxQDBuuuPvLxSnKV3TyTYK4yvSGPC+OuIr8IyAqBwyi10X4IctkO10RmqtjmQHMK48AQP/QJKqb9zvJynC0zwCqSf1Retd98s7iruBp8JVbzEf9uXwFCIg+BafBJ0hr4elbWc1Zon/g7bEuTAFg3k3bvo8AQPTTFMHfVUEaU2gwakDMrBdPj89/V3aEO6K0d2hjOPjqjjdXWLeAukFb3b0RajPOy45kMATSrf+74bR7RVlUE40AQN3JmmEcuZ11qNFc8iL3l8X8QDnEt72iHdzwS9rXBnr886UoYCKTiJfMgj3eaE2dPohi7h3rFFZC4eC9t2Z1VIIAQETg59R3+YUawQ4rkB18jel+k5lDfP8BZYvkAc1sYeR6RohGwJorJkvxs6QeSM4SJ0GtOBOFUVkbBvEhPvLCWowAQFa87SD/rSHxdeQELUAA87vHqFq4bpRD0fTrbdoIql0eR2yaDSB/kuYhhdjw0GhjaQm/4TroS2bpkERJWx/Z/IIAQMwp+5fxsLIoCWVxlHI/be35v3cxH8hz0x+0gbSshXZ9+atcaV1W/7csNYNRb0rNK27ARWA1mNBHY1OVstNvsYo="),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"amount\":9223372036854775807,\"fee\":2,\"type\":4,\"version\":2,\"attachment\":\"zdRB3cqsKNeYxTf1AN4uJhWHe6hyT3DmguhM7oh4rdCjH8w9bbqChPcbTWTzTou9h84yq87Nt6NUGiLdUjpfypy3zSDe4n2DZcuQD2Y2zaUAq1m863kSAUuTYY1HdHyCJkpxE9PbKWAKR68v2WrVqskboaUYQdqaMWWeHDW8Z5c4kDQf3MLJzNSbUWCzu5A\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":\"9Z9DqJz4GbrJiMDHRFdGPz4GdVy6sWzzRQKZARkvsgMp\",\"proofs\":[\"4aeNQfrgYCy6ZVZcEiGMceUSPMeLKM28bbBcpZdqVr8JsHfngoNEVGYGbGU5sWK5tyA7HuQPeStnBT7aM3aMJvJv\",\"3jQbrQdbURWnZrjpWjXbdzmceoiqtyqZugTG4aZLWaqY9bPkePFGmbmT7RAumKzZSixR3akGGdXVGc9jmbfDmacW\",\"67eFhUmCveoxAdgKCheMHpDKaKeE1fHqajJEjcCTWPbNub6xVmTH8kthD8Ap3txE3DhxL59GfBr4bU7drSN5GjhY\",\"5tuCQwh7tG53YnjpwM9ADDEzaxPxCfCheJeJWs6KhQG9utcFuC9nt2s2uLyPdomJbjsDeWwK9NpAxftW1bzmVRz4\",\"5SBnyDU4QmVM3dyEC6utXZANw2GCpJaZTNwbAMSU2D3VhciKqvomWsfxLEg3RGMMgm2KfQJ58ygM2S3fyjnJEfih\",\"2NsaEpeWzxWm65ZqkcgUwSuGPQQhw81G3AEwhKRsXp94oFMngyYc4wV96R8QZKSReEPtd5pnKHEC67LzzXiPz8xs\",\"2jakSJzkZy62gqDVeAawc8Ez8tMkCsUoPJEM1ZTmSScwmjqNHkfufn3aTFcCzGtpq7wAWRfEeoBTvYKLHDEafHAR\",\"55kV9ggm31BfUbJxUFJ4dexkJWdu8w2wvkmWrRUnCZBWf7K5nrtvRfmLW5bx732vAsXNgaHduvgnZmej4EZjcwEh\"],\"assetId\":null,\"recipient\":\"alias:R:_rich-account.with@30_symbols_\",\"id\":\"4MnsP1xt96TGPHPNyFW8Mo41FnU2drewHyiCFvavMJDB\",\"timestamp\":1600000000000}"
                ),
                arguments(3, address, assetId, Bytes.empty(), AssetId.WAVES, fee, Id.as("CBviNdkSRVnfqXiEH1pzCTyZjPdeCbHoDWuZm28Dcxpm"),
                        Proof.list(Proof.as("gqt8rnTLaFRNk57wAMAAhiYmAdzkDMZcXVBqDp2UjAtb7D2354NjZ6Crt815rpW3eyX1Y2wxS9CrjjrKVfXbLq5")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoY0GIICAurvILigDwgZGChYKFCeJyYXTXWfWhdwOmLovIW2Gvo+8EiwKIH8ZYIoP0AM/RpZyk9YhbNsBC4lAHTeJoaDzCnGmZOuzEP//////////fw=="),
                        Base64.decode("CnwIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBChjQYggIC6u8guKAPCBkYKFgoUJ4nJhdNdZ9aF3A6Yui8hbYa+j7wSLAogfxlgig/QAz9GlnKT1iFs2wELiUAdN4mhoPMKcaZk67MQ//////////9/EkAiW+FWXu5vIlI6EG3cvecuRmqhEJFi27b9RRhbTwavV/eaDKdYzyqPtTLjberSLqkKs59oyxbb8blVNxoNZXyA"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"amount\":9223372036854775807,\"fee\":100001,\"type\":4,\"version\":3,\"attachment\":\"\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":null,\"chainId\":82,\"proofs\":[\"gqt8rnTLaFRNk57wAMAAhiYmAdzkDMZcXVBqDp2UjAtb7D2354NjZ6Crt815rpW3eyX1Y2wxS9CrjjrKVfXbLq5\"],\"assetId\":\"9Z9DqJz4GbrJiMDHRFdGPz4GdVy6sWzzRQKZARkvsgMp\",\"recipient\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"id\":\"CBviNdkSRVnfqXiEH1pzCTyZjPdeCbHoDWuZm28Dcxpm\",\"timestamp\":1600000000000}"
                ),
                arguments(3, alias, AssetId.WAVES, attachment, assetId, 2, Id.as("GnjzppeMsiej7Ru5eQC65Q28dwiPWAaks1wjjU1ML4Ps"),
                        Proof.list(Proof.as("tbkxnAg1frBhHhjGfrNzsFYxoXnPawSZn4P9DLaigfFgfoyBgz43aEqknRBT9gPAa3aoVZfaGLSdoe9MVGsQCXW"), Proof.as("7wiSgHzWvvHAGrfxmafA9U3QTa9rPJXJ3ANtYFRM8fCw2bV2EFtYnd7EcmqVZaRdQyZ6nabHMaPq6eMYsLgG6KR"), Proof.as("4jDmZoGCyE534ZhGSsMv8VpgXbMzikygSMppmqd2gjgeoZ7rC7Z1MrqC6sTiQVyTqnBJL2E7hGjZukHiYe2zmjkG"), Proof.as("2ig44SEVyM5EnqbXWcdHNiNH3FR8t7yYMkVU3qJqGSL9ibf6KFxT44kA3J8EvDx4Y8V7CfR9Z7fm92P6DQef2FAd"), Proof.as("5LoJkxKJ2qtzyF49h1WwKCDS2BKJBXj6pEWYicALfnFMJCjsCGTorfh6koNKbuejYxEgKgWPZpNC9nLTEMaVADVv"), Proof.as("22xpeFbish1fZcoA4VeY2E69k21XR4bU3EVrAcM9qs94KykqsZ6YBTdrYtidH6u1SYkExieo5AnNCeZQrbT9J8hU"), Proof.as("2ga2bNTkz8G57nsUy3hvyj7eaRjH7kZTkDuCNsZmtJyyJuYZJuDfce2Eub76KUTJyqa7g14LZgBCc4ginhqx3zYw"), Proof.as("4oL4tCNXiGk5D5aPcK6CKuoA1Qs4uShZzFcQjWjwnoUVXSEZ5MLDYuTiguETK2hMZCPWfuZoUkqqPEL2FBqQ63st")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GiQKIH8ZYIoP0AM/RpZyk9YhbNsBC4lAHTeJoaDzCnGmZOuzEAIggIC6u8guKAPCBr0BCiASHl9yaWNoLWFjY291bnQud2l0aEAzMF9zeW1ib2xzXxIKEP//////////fxqMAXSSkRMld9Giap8+2RuSHrk7HVcpocpfhow1kXJi4pb0XO+lHAyOaqcCO/NZ8ahp8nOSx4HN2XBlgL5u2ysE6ek7I9ycEJaTW9Tjp0xAiKHImt4497F5sus3XNFcbdGezYSajcx5O35h3CXOax0cZI0oHcWBRuX7KnD/f8CPPTCbNYOqo/MWK/dfk6a5"),
                        Base64.decode("CpQCCFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GiQKIH8ZYIoP0AM/RpZyk9YhbNsBC4lAHTeJoaDzCnGmZOuzEAIggIC6u8guKAPCBr0BCiASHl9yaWNoLWFjY291bnQud2l0aEAzMF9zeW1ib2xzXxIKEP//////////fxqMAXSSkRMld9Giap8+2RuSHrk7HVcpocpfhow1kXJi4pb0XO+lHAyOaqcCO/NZ8ahp8nOSx4HN2XBlgL5u2ysE6ek7I9ycEJaTW9Tjp0xAiKHImt4497F5sus3XNFcbdGezYSajcx5O35h3CXOax0cZI0oHcWBRuX7KnD/f8CPPTCbNYOqo/MWK/dfk6a5EkAsf0wvuZmdfmzAhjuF1bKV4P273CZnU72Nd03TANIzKLkO7hFaA3KJQDdDGW1ZBPASqDFgqWspOZhx0hKsCfWNEkAF/Njqww1cXkvQB4N53Ew8Dx2UrERgTz2Xcukpt80qSDtMJ0obs3fAKst2W3BmKm3x1NeVkCoJi/NSr/L0Xk6IEkC6dcWB9+2C4S8wQzdwo5umeVzVJ2pq660FGAJMTYAgEGNIIxkzrcwbnAX+jznigQIkxzourC4EP7TkUxpNWzCFEkBV9Fl8KMdzBJuJ327zk0TIFRsciFXtUNcBADHa8sXei/3MwsWzq1paEoJaCoETeqgEMw+RBNn+cfz/cmA7rBeOEkDZJDCeGVP8qjbR/cr+uDoUWsbgHxFK2l6gNdJBo87mwZSzU8r7OI/KxVxv7Kj7cp6MNtxKEd6OePCvuDwEN/iFEkAztZaxU9avqJbwRf+DTTtPNuyl7zgmJQvy1EGoo0/LoXfxfE3x3Cs4UAnEXPItyQtHkpmbgWKfBsLB8/QtxmaPEkBUI+Letvi8UC8+Be+Ft9MxwfVWg2zRK0C44N0tbiGuCowJQ95nZPrc0GN7O0S4SZjGwbOMCfrm6QDIsuXFGoqAEkC+AM3utirXr792FnFkffraE7wxMQXo4AZxWnsVAUIORYrFVPgKQEerYgG8TiwSjwJx4H4awoua2zCZeoAxByeH"),
                        "{\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"amount\":9223372036854775807,\"fee\":2,\"type\":4,\"version\":3,\"attachment\":\"zdRB3cqsKNeYxTf1AN4uJhWHe6hyT3DmguhM7oh4rdCjH8w9bbqChPcbTWTzTou9h84yq87Nt6NUGiLdUjpfypy3zSDe4n2DZcuQD2Y2zaUAq1m863kSAUuTYY1HdHyCJkpxE9PbKWAKR68v2WrVqskboaUYQdqaMWWeHDW8Z5c4kDQf3MLJzNSbUWCzu5A\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"feeAssetId\":\"9Z9DqJz4GbrJiMDHRFdGPz4GdVy6sWzzRQKZARkvsgMp\",\"chainId\":82,\"proofs\":[\"tbkxnAg1frBhHhjGfrNzsFYxoXnPawSZn4P9DLaigfFgfoyBgz43aEqknRBT9gPAa3aoVZfaGLSdoe9MVGsQCXW\",\"7wiSgHzWvvHAGrfxmafA9U3QTa9rPJXJ3ANtYFRM8fCw2bV2EFtYnd7EcmqVZaRdQyZ6nabHMaPq6eMYsLgG6KR\",\"4jDmZoGCyE534ZhGSsMv8VpgXbMzikygSMppmqd2gjgeoZ7rC7Z1MrqC6sTiQVyTqnBJL2E7hGjZukHiYe2zmjkG\",\"2ig44SEVyM5EnqbXWcdHNiNH3FR8t7yYMkVU3qJqGSL9ibf6KFxT44kA3J8EvDx4Y8V7CfR9Z7fm92P6DQef2FAd\",\"5LoJkxKJ2qtzyF49h1WwKCDS2BKJBXj6pEWYicALfnFMJCjsCGTorfh6koNKbuejYxEgKgWPZpNC9nLTEMaVADVv\",\"22xpeFbish1fZcoA4VeY2E69k21XR4bU3EVrAcM9qs94KykqsZ6YBTdrYtidH6u1SYkExieo5AnNCeZQrbT9J8hU\",\"2ga2bNTkz8G57nsUy3hvyj7eaRjH7kZTkDuCNsZmtJyyJuYZJuDfce2Eub76KUTJyqa7g14LZgBCc4ginhqx3zYw\",\"4oL4tCNXiGk5D5aPcK6CKuoA1Qs4uShZzFcQjWjwnoUVXSEZ5MLDYuTiguETK2hMZCPWfuZoUkqqPEL2FBqQ63st\"],\"assetId\":null,\"recipient\":\"alias:R:_rich-account.with@30_symbols_\",\"id\":\"GnjzppeMsiej7Ru5eQC65Q28dwiPWAaks1wjjU1ML4Ps\",\"timestamp\":1600000000000}"
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("transactionsProvider")
    void transferTransaction(int version, Recipient recipient, AssetId assetId, byte[] attachment, AssetId feeAssetId, long fee, Id expectedId, List<Proof> proofs,
                             byte[] expectedBody, byte[] expectedBytes, String expectedJson) throws IOException {
        TransferTransaction builtTx = TransferTransaction
                .with(recipient, Amount.of(amount, assetId))
                .attachment(attachment)
                .chainId(Waves.chainId)
                .fee(Amount.of(fee, feeAssetId))
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

        TransferTransaction constructedTx = new TransferTransaction(sender, recipient, Amount.of(amount, assetId),
                attachment, Waves.chainId, Amount.of(fee, feeAssetId), timestamp, version, proofs);

        assertAll("Txs created via builder and constructor are equal",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(constructedTx.bodyBytes()),
                () -> assertThat(builtTx.id()).isEqualTo(constructedTx.id()),
                () -> assertThat(builtTx.toBytes()).isEqualTo(constructedTx.toBytes())
        );

        TransferTransaction deserTx = TransferTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> assertThat(deserTx.recipient()).isEqualTo(recipient),
                () -> assertThat(deserTx.amount().value()).isEqualTo(amount),
                () -> assertThat(deserTx.amount().assetId()).isEqualTo(assetId),
                () -> assertThat(deserTx.attachmentBytes()).isEqualTo(attachment),

                () -> assertThat(deserTx.version()).isEqualTo(version),
                () -> assertThat(deserTx.chainId()).isEqualTo(Waves.chainId),
                () -> assertThat(deserTx.sender()).isEqualTo(sender),
                () -> assertThat(deserTx.fee()).isEqualTo(Amount.of(fee, feeAssetId)),
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
