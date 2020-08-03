package im.mak.waves.transactions;

import im.mak.waves.transactions.account.Address;
import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.crypto.base.Base64;
import im.mak.waves.transactions.common.*;
import im.mak.waves.transactions.invocation.*;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static im.mak.waves.transactions.serializers.JsonSerializer.JSON_MAPPER;
import static java.util.Arrays.asList;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.params.provider.Arguments.arguments;

public class InvokeScriptTransactionTest {

    static PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
    static long timestamp = 1600000000000L;

    @BeforeAll
    static void beforeAll() {
        Waves.chainId = 'R';
    }

    static Stream<Arguments> transactionsProvider() {
        Recipient alias = Recipient.as(Alias.as("dapp"));
        Recipient address = Recipient.as(Address.from(sender, Waves.chainId));
        AssetId assetId = AssetId.as("5hpg8uUDZhwsXsuexJ9GbhEDgnrTjXS61ZCrRL5rriJd");

        String str = new String(new char[16]).replace("\0", "a");
        List<Arg> argsV1 = new ArrayList<>(asList(
                BooleanArg.as(true),
                BooleanArg.as(false),
                BinaryArg.as(str.getBytes()),
                IntegerArg.as(Long.MAX_VALUE),
                StringArg.as(str)
        ));
        List<Arg> argsV2 = new ArrayList<>(argsV1);
        argsV2.add(ListArg.as(argsV1));

        Amount fee = Amount.of(InvokeScriptTransaction.MIN_FEE + 1);
        Amount sponsoredFee = Amount.of(2, assetId);

        return Stream.of(
                arguments(1, address, Function.asDefault(), payments(),
                        sponsoredFee, Id.as("ChSBYroE3h1o95utywa82GH8RhvBh2tZSCwRuHYrUDWM"),
                        Proof.list(Proof.as("3sUwpnJ8Nb1sgktRJXLjrd6pCfGN4fCaccjpixRNGmckvsLg98QyxAK9n6ds9kdt48UzzZmcg3CXo233TJLbPwnC")),
                        Base64.decode("EAFSjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QBUieJyYXTXWfWhdwOmLovIW2Gvo+8BoCmMAAAAAAAAAAAAAACAUXj4tcmd+xwuDRa9gttQ1ufnMZUUc40uD57TxE/pci6AAABdIdugAA="),
                        Base64.decode("ABABUo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AVInicmF011n1oXcDpi6LyFthr6PvAaApjAAAAAAAAAAAAAAAgFF4+LXJnfscLg0WvYLbUNbn5zGVFHONLg+e08RP6XIugAAAXSHboAAAQABAECPkU4OwCnqdJNt7+QwL9L2rDVizT/1CpVZ1MZeE+dVcxWcftkXoK2G9B/QTL/uO1QONH+5DSCcYDjVOQBYM+uF"),
                        "{\"type\":16,\"id\":\"ChSBYroE3h1o95utywa82GH8RhvBh2tZSCwRuHYrUDWM\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"fee\":2,\"feeAssetId\":\"5hpg8uUDZhwsXsuexJ9GbhEDgnrTjXS61ZCrRL5rriJd\",\"timestamp\":1600000000000,\"proofs\":[\"3sUwpnJ8Nb1sgktRJXLjrd6pCfGN4fCaccjpixRNGmckvsLg98QyxAK9n6ds9kdt48UzzZmcg3CXo233TJLbPwnC\"],\"version\":1,\"dApp\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"payment\":[]}"
                ),
                arguments(1, alias, Function.as("default"), payments(Amount.of(10)),
                        fee, Id.as("346JhuGSgcDyrYf1CYR7aX9ySo6Lpx6136kfwGmVFYBK"),
                        Proof.list(Proof.as("4ca8WVtrB7WBQy4B5vKRVL57Bi8wCSUay4aUYurRJov8PF3XiwQyvV48nWpBSmFKBYTko85r1EXhVvsES2QV4vfX")),
                        Base64.decode("EAFSjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QCUgAEZGFwcAEJAQAAAAdkZWZhdWx0AAAAAAABAAkAAAAAAAAACgAAAAAAAAehIQAAAAF0h26AAA=="),
                        Base64.decode("ABABUo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AlIABGRhcHABCQEAAAAHZGVmYXVsdAAAAAAAAQAJAAAAAAAAAAoAAAAAAAAHoSEAAAABdIdugAABAAEAQLS56zyvVMFu7fgkGYyPfeJz7JiHCsl96X3rAkLwcLH2GgQzmQT0W/2E7hgYb15hwN4mUUqT22RvhEwccWM8EIY="),
                        "{\"type\":16,\"id\":\"346JhuGSgcDyrYf1CYR7aX9ySo6Lpx6136kfwGmVFYBK\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"fee\":500001,\"feeAssetId\":null,\"timestamp\":1600000000000,\"proofs\":[\"4ca8WVtrB7WBQy4B5vKRVL57Bi8wCSUay4aUYurRJov8PF3XiwQyvV48nWpBSmFKBYTko85r1EXhVvsES2QV4vfX\"],\"version\":1,\"dApp\":\"alias:R:dapp\",\"payment\":[{\"amount\":10,\"assetId\":null}],\"call\":{\"function\":\"default\",\"args\":[]}}"
                ),
                arguments(1, alias, Function.as("function", argsV1), payments(Amount.of(20, assetId)),
                        fee, Id.as("3yhi3JvhMYfTWVFR8We3X9gWhSH7vJousayvvjrFEuVk"),
                        Proof.list(Proof.as("3iUS3Kt76SL1AyYVPS1k28mXDLLxgso9m5DSX86hf1hgPWXc84o13FsBVCh8SEb5gKXJbRAX9g4srnGtj4Jn8bsV"), Proof.as("RPyUdaVirzoD8EbfrwWEtNkqP5tgSPGg575XM74mejT2j2D2LAKHjDijGoW3mjT4YV5pfm5gTNBhTzZaupKtWLr"), Proof.as("2srtWKt787GDVW2B1WHctqt7p1ntVG3pLJPpq3GxdcrAnchVFEAeXEv44hVbo4WFbBjnpLXapEmF4gK2MuYJHmVA"), Proof.as("4yuL9Ug3fkyDAHbJ54Fkf3F5jMhi2drGyZaftRxb622Au3gS6HRMhn2pHVPTRsygXsQ8KaAaRmeJT1aHgUk8dixc"), Proof.as("4wr3Mhk91sHuyyowpm5uo9GzfhXikz8JqeSj5hawXZNm84GHz4gYgDy5gHKcFqnXnD57iZHEhJiwpyJk89VMXxSn"), Proof.as("5sHkeDA6KFzVFBRs6UdNvbTxSxwpT2MDs3yhVFEB6pZ8GF7r6kx1csJfUMEmfECC6qbauWHVwdnNCvRhMuRLumzX"), Proof.as("g9A5owMquDZq9xp2ahYGxYuzwTnqvSn6BUGWfS6RhfWoCm4oc9mNhuP5NwepHsBZ3gK8GY1dqA78hey7uys5Tcy"), Proof.as("39etNTkHPQmfUD14qv7rKoxiW4oeXyXu7NALeYfxedfmBDLoYVJrvBazFbks121WvJcgVJF4PcLtkTgF273deVi6")),
                        Base64.decode("EAFSjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QCUgAEZGFwcAEJAQAAAAhmdW5jdGlvbgAAAAUGBwEAAAAQYWFhYWFhYWFhYWFhYWFhYQB//////////wIAAAAQYWFhYWFhYWFhYWFhYWFhYQABACkAAAAAAAAAFAFF4+LXJnfscLg0WvYLbUNbn5zGVFHONLg+e08RP6XIugAAAAAAB6EhAAAAAXSHboAA"),
                        Base64.decode("ABABUo2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AlIABGRhcHABCQEAAAAIZnVuY3Rpb24AAAAFBgcBAAAAEGFhYWFhYWFhYWFhYWFhYWEAf/////////8CAAAAEGFhYWFhYWFhYWFhYWFhYWEAAQApAAAAAAAAABQBRePi1yZ37HC4NFr2C21DW5+cxlRRzjS4PntPET+lyLoAAAAAAAehIQAAAAF0h26AAAEACABAh8x325VaHjA9McwuGBAKguCt7ifvLDl81fB7/d7EIX6O35RM/11mjuxE3ySrus1tIVXd5OgpYsgfTbMmICt9gABAFQnMCLl2QH2pbITFg/FNkPNDamkpVGczQSQuFkd6D15VBpyg70/P2I1Tmxbls6Mx+XXPC2l+mT4urhafbC8MiwBAXeB5UTU6cPZxhharXkDiaTWDE7ft/X4saZ487mI0RDeEEadTVnYjyYPEunoUPxrkxl2OsTcOXL6UQ5DrjEbHgQBAxx8Pd2V//Mad8yNmZDatagg+6qdlGMHbeO8SqefGUQ1mrbCREfWkjMEZdZtREYqkMKTNXt//j9Ojeuga9wIejQBAxVkCqIxLkR0TgOy8HgWDIVt7lIREIn294Xd9q01bftz8BxuNveDg5bs6fSIwm3Lt3SJd0rUQNzSFrTPifh4EgwBA829nsyxyjLXWnNu8RrYQ3D7j6MQDuVKnJCxU4jV+RyY1lpof7tyM/w1m0Y9RYmrY+k5oS2FfNzsOJ3q9+1XJiABAIcDedj6a6nZaA/u0pi2+Zo149gbJ3d6YtS/fgeI1IGuUe6pCNceOjwhPsS1KwGnmuLNgmplKfpRaeMJPE8QkjgBAa38GQ2PL+lK7k2NjpHhEd4dkTNQLe03ABBqWn9UEHATsyH2/HWgopObFQZemHy9YXn6TzCitmvd5M8osVSGGhw=="),
                        "{\"type\":16,\"id\":\"3yhi3JvhMYfTWVFR8We3X9gWhSH7vJousayvvjrFEuVk\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"fee\":500001,\"feeAssetId\":null,\"timestamp\":1600000000000,\"proofs\":[\"3iUS3Kt76SL1AyYVPS1k28mXDLLxgso9m5DSX86hf1hgPWXc84o13FsBVCh8SEb5gKXJbRAX9g4srnGtj4Jn8bsV\",\"RPyUdaVirzoD8EbfrwWEtNkqP5tgSPGg575XM74mejT2j2D2LAKHjDijGoW3mjT4YV5pfm5gTNBhTzZaupKtWLr\",\"2srtWKt787GDVW2B1WHctqt7p1ntVG3pLJPpq3GxdcrAnchVFEAeXEv44hVbo4WFbBjnpLXapEmF4gK2MuYJHmVA\",\"4yuL9Ug3fkyDAHbJ54Fkf3F5jMhi2drGyZaftRxb622Au3gS6HRMhn2pHVPTRsygXsQ8KaAaRmeJT1aHgUk8dixc\",\"4wr3Mhk91sHuyyowpm5uo9GzfhXikz8JqeSj5hawXZNm84GHz4gYgDy5gHKcFqnXnD57iZHEhJiwpyJk89VMXxSn\",\"5sHkeDA6KFzVFBRs6UdNvbTxSxwpT2MDs3yhVFEB6pZ8GF7r6kx1csJfUMEmfECC6qbauWHVwdnNCvRhMuRLumzX\",\"g9A5owMquDZq9xp2ahYGxYuzwTnqvSn6BUGWfS6RhfWoCm4oc9mNhuP5NwepHsBZ3gK8GY1dqA78hey7uys5Tcy\",\"39etNTkHPQmfUD14qv7rKoxiW4oeXyXu7NALeYfxedfmBDLoYVJrvBazFbks121WvJcgVJF4PcLtkTgF273deVi6\"],\"version\":1,\"dApp\":\"alias:R:dapp\",\"payment\":[{\"amount\":20,\"assetId\":\"5hpg8uUDZhwsXsuexJ9GbhEDgnrTjXS61ZCrRL5rriJd\"}],\"call\":{\"function\":\"function\",\"args\":[{\"type\":\"boolean\",\"value\":true},{\"type\":\"boolean\",\"value\":false},{\"type\":\"binary\",\"value\":\"base64:YWFhYWFhYWFhYWFhYWFhYQ==\"},{\"type\":\"integer\",\"value\":9223372036854775807},{\"type\":\"string\",\"value\":\"aaaaaaaaaaaaaaaa\"}]}}"
                ),
                arguments(2, address, Function.asDefault(), payments(),
                        sponsoredFee, Id.as("2jrfokXkPtiU9Ygttxv9BnE1LYiyP7XP1muyV8rpHkCr"),
                        Proof.list(Proof.as("41gpnbnVP8GxXkLtrTKVAbrzCA1BhkEKMy1fLKd2QkSzTeo2ThUJoy8QrUnb56rKaUxSU9jRicPUNbEGAJCo8Wyf")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GiQKIEXj4tcmd+xwuDRa9gttQ1ufnMZUUc40uD57TxE/pci6EAIggIC6u8guKAKiBxsKFgoUJ4nJhdNdZ9aF3A6Yui8hbYa+j7wSAQA="),
                        Base64.decode("CnEIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaJAogRePi1yZ37HC4NFr2C21DW5+cxlRRzjS4PntPET+lyLoQAiCAgLq7yC4oAqIHGwoWChQnicmF011n1oXcDpi6LyFthr6PvBIBABJAlqSiz19o6E66aCHVhgSfCRF3r4GetH81ckLTrh/+GFE6z6rhMo0qY1BtGau65aYmMvJ+VK2D2uIMhPRcwHKxgg=="),
                        "{\"type\":16,\"id\":\"2jrfokXkPtiU9Ygttxv9BnE1LYiyP7XP1muyV8rpHkCr\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"fee\":2,\"feeAssetId\":\"5hpg8uUDZhwsXsuexJ9GbhEDgnrTjXS61ZCrRL5rriJd\",\"timestamp\":1600000000000,\"proofs\":[\"41gpnbnVP8GxXkLtrTKVAbrzCA1BhkEKMy1fLKd2QkSzTeo2ThUJoy8QrUnb56rKaUxSU9jRicPUNbEGAJCo8Wyf\"],\"version\":2,\"chainId\":82,\"dApp\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"payment\":[]}"
                ),
                arguments(2, alias, Function.as("default"), payments(Amount.of(10)),
                        fee, Id.as("jVGXJgbxhCg9gLZ1bSKPiJonAaACbQa3u9j6mpd4z4y"),
                        Proof.list(Proof.as("R4dQVSMzTkSRY9ULgAu6fPLEgFL4ihBwyW4r4jthCKBCnyLfevgj1MC6Mkcgx1eLoy18R9NvkEGrgUb1HHRDLBq")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQocIeIICAurvILigCogcgCgYSBGRhcHASEgEJAQAAAAdkZWZhdWx0AAAAABoCEAo="),
                        Base64.decode("ClYIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBChwh4ggIC6u8guKAKiByAKBhIEZGFwcBISAQkBAAAAB2RlZmF1bHQAAAAAGgIQChJAFMApDGazkxjTi9JYYBMr0rjVUQuGvryW42oKIXcer1gMT4L9fTcepNwO7XOJRH7MJg8/7/8UnFUmgbUPnk7hgA=="),
                        "{\"type\":16,\"id\":\"jVGXJgbxhCg9gLZ1bSKPiJonAaACbQa3u9j6mpd4z4y\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"fee\":500001,\"feeAssetId\":null,\"timestamp\":1600000000000,\"proofs\":[\"R4dQVSMzTkSRY9ULgAu6fPLEgFL4ihBwyW4r4jthCKBCnyLfevgj1MC6Mkcgx1eLoy18R9NvkEGrgUb1HHRDLBq\"],\"version\":2,\"chainId\":82,\"dApp\":\"alias:R:dapp\",\"payment\":[{\"amount\":10,\"assetId\":null}],\"call\":{\"function\":\"default\",\"args\":[]}}"
                ),
                arguments(2, alias, Function.as("function", argsV2), payments(Amount.of(10), Amount.of(20, assetId)),
                        fee, Id.as("71EnNwbpssbWm2567KUBqEJn94AfwPBdhTin3NJbDojv"),
                        Proof.list(Proof.as("4UtmZ676eY2N3A22FMfvgQaMFgPNVTWhtnpopHWkGfhb7x3vip3sCBxkMwwkFzpAgi1yZfHbKNGfJQuiwSVwjdkD"), Proof.as("3wbYJ1FJGSBgqBEEKMpBqKgPndgqEe6mykAoqrZ7PJKKhPXP2cscTupTAy9jhY3hFbNw9suo6RMQoLtA8Gncc5XZ"), Proof.as("3VgdyvpVMKHjm215zfSpCpBcSuNiRv8Rteo2GJuGcCwKxb49Ad3ZhbjkSUGCGfpqj6tTef5sUswz3fm9R5sARBsu"), Proof.as("4rWyizG2FQLowanbjcowYeuwbVCD31F8kWZonQhTRXQ5NEewFhsGSb3WSJNRG7ZaU7u9e522qVru2BpwyjLxwEoE"), Proof.as("2QfRtAeuLmoN99T2bhcgKfdy9VQgodj1447zDLRd6aLQjeVguyQXzw92qeXZrxFPc5QR4neueoUFCZLAXupE56Je"), Proof.as("f4ZNC5i6dvbHUnJm52f7TgZHM3khjLGAzpJjx29fdpPxoH7VuL9hYL9N3AY2gT9igdCR1mM4MUGt5iweMA4MwGR"), Proof.as("56DKwqh3Mpe3WG7JQt9sZwCevhm87LAny9ESncAtwAcNmJXuDM1ePMLZBsNsovWm2Tbb6efPsSFfMPa2oLrEPpUh"), Proof.as("3Ka1JwQQg2xLz4ATqmfnbEsUCFMxMog26Qpq8AdgQ38cpi3gnccd5KsJc6uv8pbfqqdvxVdXSSgYMbcEKj4fGbaq")),
                        Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQocIeIICAurvILigCoge3AQoGEgRkYXBwEoIBAQkBAAAACGZ1bmN0aW9uAAAABgYHAQAAABBhYWFhYWFhYWFhYWFhYWFhAH//////////AgAAABBhYWFhYWFhYWFhYWFhYWFhCwAAAAUGBwEAAAAQYWFhYWFhYWFhYWFhYWFhYQB//////////wIAAAAQYWFhYWFhYWFhYWFhYWFhYRoCEAoaJAogRePi1yZ37HC4NFr2C21DW5+cxlRRzjS4PntPET+lyLoQFA=="),
                        Base64.decode("Cu4BCFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQocIeIICAurvILigCoge3AQoGEgRkYXBwEoIBAQkBAAAACGZ1bmN0aW9uAAAABgYHAQAAABBhYWFhYWFhYWFhYWFhYWFhAH//////////AgAAABBhYWFhYWFhYWFhYWFhYWFhCwAAAAUGBwEAAAAQYWFhYWFhYWFhYWFhYWFhYQB//////////wIAAAAQYWFhYWFhYWFhYWFhYWFhYRoCEAoaJAogRePi1yZ37HC4NFr2C21DW5+cxlRRzjS4PntPET+lyLoQFBJArhq+5Z8wxh521C/gek66VgLYnAxK3QxOWxl/leZW3x5Dt8FGcJTnpWEjSA9OLbuFwHXuAubJqc5XZ6jWqQf0ihJAkx12pDO5KuR/6OnSsXJAo7eB6LIPLMO+6e2mV8p+oui4Vxa5VVwVaYsfVF4GHajlZDMBnjiLEU/+gk5cBl8vhBJAfMT8hxs1+U7ESfrjXz6mcbLa5QwAN1jGE4lxjnpXjpTS2S87yuSNSOY9/IoUOyaxq0E78ccp/fhg/9wFru4egBJAwMChC96myDCGMUM7n/uyt8qymRBUSJP6Nxd7N/nOnJrE+RPkkZMsxVAttuD8Q6FSJfYUZD+lKd8mk6r/4ZABjRJARmw2DC3vGKjwRA5E2NTij9TleT3EwcOSc5WXubodPHe/npnWCuBQFKHG4xYtFghesdkofuJGm9S10glkBNg/gxJAINKZzc72DZUgDpVPZjGVCSiPW8CQTaMuYFGGMhSlU0cJscuKRmdeG105Y4XgWa74VwjDFJojRdCEfqrE7gw3hhJAzJAmBW3hZSF7MtSCBtzjHNlKPwPuTdHasyOiUdWD3UXP1og5RYxTwud8248BjvDhlMNsBed/bJW791As+FFpghJAdAwYYgs4iQnxIYjnF2XZXBF087jl0xlQHfAriKaKzEarkX5UVZ2WUdBBRj6gW+kFauIEbkURPO4mEIusE9DWig=="),
                        "{\"type\":16,\"id\":\"71EnNwbpssbWm2567KUBqEJn94AfwPBdhTin3NJbDojv\",\"sender\":\"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF\",\"senderPublicKey\":\"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV\",\"fee\":500001,\"feeAssetId\":null,\"timestamp\":1600000000000,\"proofs\":[\"4UtmZ676eY2N3A22FMfvgQaMFgPNVTWhtnpopHWkGfhb7x3vip3sCBxkMwwkFzpAgi1yZfHbKNGfJQuiwSVwjdkD\",\"3wbYJ1FJGSBgqBEEKMpBqKgPndgqEe6mykAoqrZ7PJKKhPXP2cscTupTAy9jhY3hFbNw9suo6RMQoLtA8Gncc5XZ\",\"3VgdyvpVMKHjm215zfSpCpBcSuNiRv8Rteo2GJuGcCwKxb49Ad3ZhbjkSUGCGfpqj6tTef5sUswz3fm9R5sARBsu\",\"4rWyizG2FQLowanbjcowYeuwbVCD31F8kWZonQhTRXQ5NEewFhsGSb3WSJNRG7ZaU7u9e522qVru2BpwyjLxwEoE\",\"2QfRtAeuLmoN99T2bhcgKfdy9VQgodj1447zDLRd6aLQjeVguyQXzw92qeXZrxFPc5QR4neueoUFCZLAXupE56Je\",\"f4ZNC5i6dvbHUnJm52f7TgZHM3khjLGAzpJjx29fdpPxoH7VuL9hYL9N3AY2gT9igdCR1mM4MUGt5iweMA4MwGR\",\"56DKwqh3Mpe3WG7JQt9sZwCevhm87LAny9ESncAtwAcNmJXuDM1ePMLZBsNsovWm2Tbb6efPsSFfMPa2oLrEPpUh\",\"3Ka1JwQQg2xLz4ATqmfnbEsUCFMxMog26Qpq8AdgQ38cpi3gnccd5KsJc6uv8pbfqqdvxVdXSSgYMbcEKj4fGbaq\"],\"version\":2,\"chainId\":82,\"dApp\":\"alias:R:dapp\",\"payment\":[{\"amount\":10,\"assetId\":null},{\"amount\":20,\"assetId\":\"5hpg8uUDZhwsXsuexJ9GbhEDgnrTjXS61ZCrRL5rriJd\"}],\"call\":{\"function\":\"function\",\"args\":[{\"type\":\"boolean\",\"value\":true},{\"type\":\"boolean\",\"value\":false},{\"type\":\"binary\",\"value\":\"base64:YWFhYWFhYWFhYWFhYWFhYQ==\"},{\"type\":\"integer\",\"value\":9223372036854775807},{\"type\":\"string\",\"value\":\"aaaaaaaaaaaaaaaa\"},{\"type\":\"list\",\"value\":[{\"type\":\"boolean\",\"value\":true},{\"type\":\"boolean\",\"value\":false},{\"type\":\"binary\",\"value\":\"base64:YWFhYWFhYWFhYWFhYWFhYQ==\"},{\"type\":\"integer\",\"value\":9223372036854775807},{\"type\":\"string\",\"value\":\"aaaaaaaaaaaaaaaa\"}]}]}}"
                )
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("transactionsProvider")
    void invokeScriptTransaction(int version, Recipient dApp, Function function, List<Amount> payments, Amount fee,
                                 Id expectedId, List<Proof> proofs, byte[] expectedBody, byte[] expectedBytes,
                                 String expectedJson) throws IOException {
        InvokeScriptTransaction builtTx = InvokeScriptTransaction
                .with(dApp, function)
                .payments(payments)
                .chainId(Waves.chainId)
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

        InvokeScriptTransaction constructedTx = new InvokeScriptTransaction(sender, dApp, function, payments,
                Waves.chainId, fee, timestamp, version, proofs);

        assertAll("Txs created via builder and constructor are equal",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(constructedTx.bodyBytes()),
                () -> assertThat(builtTx.id()).isEqualTo(constructedTx.id()),
                () -> assertThat(builtTx.toBytes()).isEqualTo(constructedTx.toBytes())
        );

        InvokeScriptTransaction deserTx = InvokeScriptTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> assertThat(deserTx.dApp()).isEqualTo(dApp),
                () -> assertThat(deserTx.function()).isEqualTo(function),
                () -> assertThat(deserTx.payments()).isEqualTo(payments),

                () -> assertThat(deserTx.version()).isEqualTo(version),
                () -> assertThat(deserTx.chainId()).isEqualTo(Waves.chainId),
                () -> assertThat(deserTx.sender()).isEqualTo(sender),
                () -> assertThat(deserTx.fee()).isEqualTo(fee),
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

    private static List<Amount> payments(Amount... amounts) {
        return new ArrayList<>(asList(amounts));
    }

}
