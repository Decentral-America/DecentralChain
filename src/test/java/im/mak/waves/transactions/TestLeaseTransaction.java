package im.mak.waves.transactions;

import im.mak.waves.crypto.account.Address;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.params.provider.Arguments.arguments;

public class TestLeaseTransaction {

    static PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
    static long timestamp = 1600000000000L;

    @BeforeAll
    static void beforeAll() {
        Waves.chainId = 'R';
    }

    static Stream<Arguments> transactionsProvider() {
        Recipient minAlias = Recipient.as(Alias.as("rich"));
        Recipient maxAlias = Recipient.as(Alias.as("_rich-account.with@30_symbols_"));
        Recipient address = Recipient.as(Address.from(sender, Waves.chainId)); // 3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF
        return Stream.of(
                arguments(1, minAlias, 1, Proof.list(Proof.as("5naDD2BUShvyrmfsz2EdSFnAMHaL9FkRSHLcMaJftjdRHVHN4xzkG3tmXVLUqQ1nwqmQgX3iqNyTRhkchsPapRRE")), TxId.id("4HcJAJJSmPVLw2kyZH1AUen1VDKaG3DHr8cgRJLpfNc6"), Base64.decode("CI2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AlIABHJpY2gAAAAAAAAAAQAAAAAAAYagAAABdIdugAA="), Base64.decode("CI2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AlIABHJpY2gAAAAAAAAAAQAAAAAAAYagAAABdIdugADvXjnExC0WqqQk+bcYM5a2GfXHZK/ObAIymZVEX+45iVWMZ5CXB6OJurtFBqNg+if2oSMciIvLxNvzOMuWCPaF")),
                //{"senderPublicKey":"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV","amount":1,"sender":"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF","feeAssetId":null,"signature":"5naDD2BUShvyrmfsz2EdSFnAMHaL9FkRSHLcMaJftjdRHVHN4xzkG3tmXVLUqQ1nwqmQgX3iqNyTRhkchsPapRRE","proofs":["5naDD2BUShvyrmfsz2EdSFnAMHaL9FkRSHLcMaJftjdRHVHN4xzkG3tmXVLUqQ1nwqmQgX3iqNyTRhkchsPapRRE"],"fee":100000,"recipient":"alias:R:rich","id":"4HcJAJJSmPVLw2kyZH1AUen1VDKaG3DHr8cgRJLpfNc6","type":8,"version":1,"timestamp":1600000000000}
                arguments(1, maxAlias, Long.MAX_VALUE, Proof.list(Proof.as("nHvAeVrWkTcw4BxoWuBwj3NVHuRi289RvNREWN14fjEjj3xXN5fcZi7mRcTrPa91SMUoENG8TRt3ZB3HZKPQgbW")), TxId.id("2k76csSZ1761KGBLR95zqKQ1KnoTVkMomg5NfV1W9wGN"), Base64.decode("CI2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AlIAHl9yaWNoLWFjY291bnQud2l0aEAzMF9zeW1ib2xzX3//////////AAAAAAABhqAAAAF0h26AAA=="), Base64.decode("CI2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AlIAHl9yaWNoLWFjY291bnQud2l0aEAzMF9zeW1ib2xzX3//////////AAAAAAABhqAAAAF0h26AACcOzOZXDTE7bG+k17Fa0To+VVox1bU///zDGPcxit2ztvoWxWl+J/UUvZAho8b9oeBzLhfh/RiYgQTeR38rnIU=")),
                //{"senderPublicKey":"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV","amount":9223372036854775807,"sender":"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF","feeAssetId":null,"signature":"nHvAeVrWkTcw4BxoWuBwj3NVHuRi289RvNREWN14fjEjj3xXN5fcZi7mRcTrPa91SMUoENG8TRt3ZB3HZKPQgbW","proofs":["nHvAeVrWkTcw4BxoWuBwj3NVHuRi289RvNREWN14fjEjj3xXN5fcZi7mRcTrPa91SMUoENG8TRt3ZB3HZKPQgbW"],"fee":100000,"recipient":"alias:R:_rich-account.with@30_symbols_","id":"2k76csSZ1761KGBLR95zqKQ1KnoTVkMomg5NfV1W9wGN","type":8,"version":1,"timestamp":1600000000000}
                arguments(1, address, Long.MAX_VALUE, Proof.list(Proof.as("JNoppNTJfaasQ8NVdJmqub5ZULkcUHJBTBmrzsN6kGNv4Cs3wTbKmF3soxjf3qW1zSJq6jM8jc5PNCEtb1LcLKb")), TxId.id("BMt7mhihgaMqfKYomTo8cRrJgcsMMszJakDgtRuSWo9r"), Base64.decode("CI2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AVInicmF011n1oXcDpi6LyFthr6PvAaApjB//////////wAAAAAAAYagAAABdIdugAA="), Base64.decode("CI2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AVInicmF011n1oXcDpi6LyFthr6PvAaApjB//////////wAAAAAAAYagAAABdIdugAAO/AEopPRKef6isFkm1iohtiFqXZjKnthq7d5yLHPdPZVFD7IEW28avmOC9l5TjYoS+hQloZ8L6OnU9Kpgb4SK")),
                //{"senderPublicKey":"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV","amount":9223372036854775807,"sender":"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF","feeAssetId":null,"signature":"JNoppNTJfaasQ8NVdJmqub5ZULkcUHJBTBmrzsN6kGNv4Cs3wTbKmF3soxjf3qW1zSJq6jM8jc5PNCEtb1LcLKb","proofs":["JNoppNTJfaasQ8NVdJmqub5ZULkcUHJBTBmrzsN6kGNv4Cs3wTbKmF3soxjf3qW1zSJq6jM8jc5PNCEtb1LcLKb"],"fee":100000,"recipient":"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF","id":"BMt7mhihgaMqfKYomTo8cRrJgcsMMszJakDgtRuSWo9r","type":8,"version":1,"timestamp":1600000000000}
                arguments(2, minAlias, 1, Proof.list(Proof.as("W4ryRuxJPjpSUWLjtT4zyVixPi6N6iRk2zNUSiBqH2KMycvQYK4M3GVBpoT8BbzyxRN5BiGts4oP8B9cLTVGX8V")), TxId.id("8FYbDJnzetZ7BKdkDFWaPWaFhXbKRJPrPcNYGidtjeXy"), Base64.decode("CAIAjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QCUgAEcmljaAAAAAAAAAABAAAAAAABhqAAAAF0h26AAA=="), Base64.decode("AAgCAI2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AlIABHJpY2gAAAAAAAAAAQAAAAAAAYagAAABdIdugAABAAEAQBkQ38kMOoh8lWntPrJhj3G4ueB6HVNBbWJq705HGqZFQUqT1MP+5g7nRqp7leIa0vyaLl3Is6sXpprx+hD0MoI=")),
                //{"senderPublicKey":"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV","amount":1,"sender":"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF","feeAssetId":null,"proofs":["W4ryRuxJPjpSUWLjtT4zyVixPi6N6iRk2zNUSiBqH2KMycvQYK4M3GVBpoT8BbzyxRN5BiGts4oP8B9cLTVGX8V"],"fee":100000,"recipient":"alias:R:rich","id":"8FYbDJnzetZ7BKdkDFWaPWaFhXbKRJPrPcNYGidtjeXy","type":8,"version":2,"timestamp":1600000000000}
                arguments(2, maxAlias, Long.MAX_VALUE, Proof.list(Proof.as("2rYT5eKQHwyzzYthcqabK5VRjKe5Xs17vhTAhsBTH6a7Uze1sg7M5iYu9KiAouW6TZrYcDKiFpHDc2Rp8TD5Y66Z")), TxId.id("B4a2ADiQx61paTNS4CVuRj7XQZxbZib4u23JRiE5HCB1"), Base64.decode("CAIAjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QCUgAeX3JpY2gtYWNjb3VudC53aXRoQDMwX3N5bWJvbHNff/////////8AAAAAAAGGoAAAAXSHboAA"), Base64.decode("AAgCAI2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AlIAHl9yaWNoLWFjY291bnQud2l0aEAzMF9zeW1ib2xzX3//////////AAAAAAABhqAAAAF0h26AAAEAAQBAXL2HCBSaBqR8odtIcD3/lLpixHfPxC6pTpuC+lOomB1s94WLSj6BD5W739bbMogkJrs98iiNhpSZJBcL1w/sjg==")),
                //{"senderPublicKey":"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV","amount":9223372036854775807,"sender":"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF","feeAssetId":null,"proofs":["2rYT5eKQHwyzzYthcqabK5VRjKe5Xs17vhTAhsBTH6a7Uze1sg7M5iYu9KiAouW6TZrYcDKiFpHDc2Rp8TD5Y66Z"],"fee":100000,"recipient":"alias:R:_rich-account.with@30_symbols_","id":"B4a2ADiQx61paTNS4CVuRj7XQZxbZib4u23JRiE5HCB1","type":8,"version":2,"timestamp":1600000000000}
                arguments(2, address, Long.MAX_VALUE, Proof.list(Proof.as("EeQ2z9xfvZUvuKnMSxN5a81Vv9CbnecxiJQdTmqWFHp8kb4gPxBeda7o59wrh5wrjDD6itAiEw8dLHA1wvazKLY"), Proof.as("5str5fAhgyrFcLvUrGogkWUtxeAYLyoeRE5Yd1nkcBka66T3YMiKLagXMacexH43En16EyTDL9REW5a9pY4PedAf"), Proof.as("2uJSYB8rxpMV4dVGEqg7YN69sZegqAbaDEDFDw6YTiz3h7q9MnyDNjd2pWGMT7zFZbTcEcNyZ8j1Vm22neuYQ84T"), Proof.as("3LmqasTdBYFpCrB5ptAcQczwxeDBTmSN1Y9nhXNhb1PdmuWWZro35U32we1yjgZrwMphG3hz1YcAohUP27BZzjBo"), Proof.as("5eg4wfKThDSEeosrBv5bq2CtTwJyNNi6ubPyVCo26SfhKw6oARBD7H5Z2JZMKQhScg22gQhHJM35eBTBCGyhJxnv"), Proof.as("2nzLd6JxDyKtzCt2ExQzKqiroZhn5XjmtCbPCkb2i3d69mRb16X6LJrvZH9DaVi5NZwSh4QLhcz53bQU6t5X4ZXk"), Proof.as("2JtLocZgVFfmuHKB7cu5TN7zZA2LfAZpGknCnXwenYus9PnMwYbCzGup3UNiPaaHEXD9WnEv6vcp6crb9wNuseWJ"), Proof.as("4Zscra4iwjxoKNrUXnywhuGMCKYekBpysc4DWsKwNCEjENTXcnGdGkuQNBXLtgcmwwUWDvMqjJgZTWV5YAifVAhS")), TxId.id("4QLWNbA6nHcrEMq6yV8d6isEGMuZnPUP22YSuC9CAGDW"), Base64.decode("CAIAjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QBUieJyYXTXWfWhdwOmLovIW2Gvo+8BoCmMH//////////AAAAAAABhqAAAAF0h26AAA=="), Base64.decode("AAgCAI2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0AVInicmF011n1oXcDpi6LyFthr6PvAaApjB//////////wAAAAAAAYagAAABdIdugAABAAgAQAvESP+vhte0Wq+0RKPnAYHkxg7gDCF6jyyGDZAr7/MM0t/4jLsMJpqb+5Jh3zWHxPP83+kB2364VKfuIH41I40AQPP0+2jD6hx+3EQMVC1h49zvjxncQG1E/GYBVqQttLk4L7kERmhC3HPsJDFMmuYZdWk2A2vxW6apLqqTQL99nIgAQF8ef3UtrxTivYGQjC6o+rD6TyDP7i7qIvb0jekYDRwGkeBBQ2qiBIymTXfaisG4cWNC4O7gD69bCjnb2+t72owAQHUV5aukSoKRGTau71MYSe8iJUeb8WomuBpCxE32a4hhCd+cm/YmUK/R/tKR6myEmwP/9xOHBwbqsndwPvi324IAQOiOZ05k3kKazzBrOD39kgMOkCpHty3EWkMKth/dLztJX5CX3PwCL9b9lNJftj4LtALAHtJ0Eo2/8OE2oc2qrosAQFmtAie5Pk3Ph07jVE6h1vvY0TZ1GWrIKqC6MILLOHRHg4zayQb9yApaGXD5q6iMR66VA3lrgikOIWnAaKslVI8AQEFwxYAv8ElAbcqBooS9rzRC8UxfkTIS9XaiOLbVrYTHn6noSd+kqVvpPs6tKLtHKUxx3CVIEIqG47J0KVSaO4cAQLJmMSStw5WhaX8UIfFBFRBU4cV9FvT6PV1+KS7IjMM01wAoHcrPcrVPwBG8gGFzXVtKoQ8TJWUZLE4y0efdQI0=")),
                //{"senderPublicKey":"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV","amount":9223372036854775807,"sender":"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF","feeAssetId":null,"proofs":["EeQ2z9xfvZUvuKnMSxN5a81Vv9CbnecxiJQdTmqWFHp8kb4gPxBeda7o59wrh5wrjDD6itAiEw8dLHA1wvazKLY","5str5fAhgyrFcLvUrGogkWUtxeAYLyoeRE5Yd1nkcBka66T3YMiKLagXMacexH43En16EyTDL9REW5a9pY4PedAf","2uJSYB8rxpMV4dVGEqg7YN69sZegqAbaDEDFDw6YTiz3h7q9MnyDNjd2pWGMT7zFZbTcEcNyZ8j1Vm22neuYQ84T","3LmqasTdBYFpCrB5ptAcQczwxeDBTmSN1Y9nhXNhb1PdmuWWZro35U32we1yjgZrwMphG3hz1YcAohUP27BZzjBo","5eg4wfKThDSEeosrBv5bq2CtTwJyNNi6ubPyVCo26SfhKw6oARBD7H5Z2JZMKQhScg22gQhHJM35eBTBCGyhJxnv","2nzLd6JxDyKtzCt2ExQzKqiroZhn5XjmtCbPCkb2i3d69mRb16X6LJrvZH9DaVi5NZwSh4QLhcz53bQU6t5X4ZXk","2JtLocZgVFfmuHKB7cu5TN7zZA2LfAZpGknCnXwenYus9PnMwYbCzGup3UNiPaaHEXD9WnEv6vcp6crb9wNuseWJ","4Zscra4iwjxoKNrUXnywhuGMCKYekBpysc4DWsKwNCEjENTXcnGdGkuQNBXLtgcmwwUWDvMqjJgZTWV5YAifVAhS"],"fee":100000,"recipient":"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF","id":"4QLWNbA6nHcrEMq6yV8d6isEGMuZnPUP22YSuC9CAGDW","type":8,"version":2,"timestamp":1600000000000}
                arguments(3, minAlias, 1, Proof.list(Proof.as("3mYdtrBDiizLESUQ88ZF3Bi9Xt8nM4FwYpDPVfSA5JMHHKs58ZirSG1eXuhwB2qPLQq8VXm7QRubHHuxiJXUcFq2")), TxId.id("65jwmmr3Yb3z2iNUMSUQuqF7PRPckhB8Z7MUgQiBXxLh"), Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoI0GIICAurvILigD4gYKCgYSBHJpY2gQAQ=="), Base64.decode("CkAIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBCgjQYggIC6u8guKAPiBgoKBhIEcmljaBABEkCKcsPrOA/Pp1aeI0uKaXwb4TFvAxoXOksJLboVftMLLZQ9NWadkYPh9pc3Q2O+467DsbmvnnFGrObYnQH6b5eB")),
                //{"senderPublicKey":"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV","amount":1,"sender":"3MsX9C2MzzxE4ySF5aYcJoaiPfkyxZMg4cW","feeAssetId":null,"chainId":82,"proofs":["3mYdtrBDiizLESUQ88ZF3Bi9Xt8nM4FwYpDPVfSA5JMHHKs58ZirSG1eXuhwB2qPLQq8VXm7QRubHHuxiJXUcFq2"],"fee":100000,"recipient":"alias:R:rich","id":"65jwmmr3Yb3z2iNUMSUQuqF7PRPckhB8Z7MUgQiBXxLh","type":8,"version":3,"timestamp":1600000000000}
                arguments(3, maxAlias, Long.MAX_VALUE, Proof.list(Proof.as("3rAeZ2PVGxKMjHVfetxLxKeaTAmYCM5AddPzAQ5BhD6iia2d1snAT2pF5grZm7jHWuAFJ2ZxP9VyvzvPv4QwkprL")), TxId.id("5XXAMNKLxEy3a5Ews3cr4Vzaiw6UTuRUffQTmkDxwpbq"), Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoI0GIICAurvILigD4gYsCiASHl9yaWNoLWFjY291bnQud2l0aEAzMF9zeW1ib2xzXxD//////////38="), Base64.decode("CmIIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBCgjQYggIC6u8guKAPiBiwKIBIeX3JpY2gtYWNjb3VudC53aXRoQDMwX3N5bWJvbHNfEP//////////fxJAjm7kwi6bNKy5edF9kur+ApzwKVpZaWZvcSKRdG+SfnjSbVfR/i2Nf6hSiTRS3BUJz2LilsudZhhZbRGX8NFvgQ==")),
                //{"senderPublicKey":"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV","amount":9223372036854775807,"sender":"3MsX9C2MzzxE4ySF5aYcJoaiPfkyxZMg4cW","feeAssetId":null,"chainId":82,"proofs":["3rAeZ2PVGxKMjHVfetxLxKeaTAmYCM5AddPzAQ5BhD6iia2d1snAT2pF5grZm7jHWuAFJ2ZxP9VyvzvPv4QwkprL"],"fee":100000,"recipient":"alias:R:_rich-account.with@30_symbols_","id":"5XXAMNKLxEy3a5Ews3cr4Vzaiw6UTuRUffQTmkDxwpbq","type":8,"version":3,"timestamp":1600000000000}
                arguments(3, address, Long.MAX_VALUE, Proof.list(Proof.as("4hZmtnVwFkj1N5ypgoxmFsvzvgmcr32ffRbuHRv9eWQ5ZeiVP8EoJeitACXHJvitENBHgrGcEtWhM6WRGqabgDLr"), Proof.as("3WtzGAGW2BmWRvJCVQEgKeUyCwpidGiLmnAHXFVzrVL7wkdztZJ8TnBeme643JMUCCC7hURvkt9gpa5NXu7wxXxX"), Proof.as("5qTG4chcuyKGVnYQksyYwz1dCPenqz4jcbo7e51oCkKJ3k19hhdR3UfLsLEJrUAH8oudDdAGV7NDyUcvUW3jCvb2"), Proof.as("3kGPckN5hLuGNvNxhc292WS32dek7pfQ8uUTJC4nfMRvzqyXAtqnrwFtnpZGkVZLXxrqBREaAySD5rpgAGLGcady"), Proof.as("62uijRo8Wo7Z1sBhNNcrhM2jeBLKsKuXpWZRumxD3Pqt4GVzcB5ChYe58chRbxMWcL5R5MReQz9SiBbm9t2XNpFr"), Proof.as("hJUpAhoCqJWhpQBGD5VGeG9wnzH5b8gF1QasFwUg7kTycBQ7qvo7n3qS37XiEi5aYEzxeNRkBARwVb7jNkFce4h"), Proof.as("59Ejnjny6tZ8NHuJfik7wciCNxE2QNwakAnfHrQEdk4cbpzHPHZa5oJ1t3ccj2RVD12kpFmDLMHrC49BxP3sb9Mq"), Proof.as("4M5UhsF2ACXVJV1BmrQg8hUoCdy4YS7XGWHJJxpZzUtMTJ1QUQKw7N99uKGUUPMwrfBG9aMfahvbdLycHhYtAWBr")), TxId.id("96peWN7hJLzTRiT68VLxgZtAnw6gHWzX7P9mqmM2B56E"), Base64.decode("CFISII2Pso3AdXwKxUYtumBGAOwXiwd7VICSuiPRijFoYzd0GgQQoI0GIICAurvILigD4gYiChYKFCeJyYXTXWfWhdwOmLovIW2Gvo+8EP//////////fw=="), Base64.decode("ClgIUhIgjY+yjcB1fArFRi26YEYA7BeLB3tUgJK6I9GKMWhjN3QaBBCgjQYggIC6u8guKAPiBiIKFgoUJ4nJhdNdZ9aF3A6Yui8hbYa+j7wQ//////////9/EkC5CGOuvm0XFw0/oBoHm9fk1mpDdqAKbOXJmnxjr8KvqEnO9O3ISmd7BA++F9PnNEB/rGiqS9IZlEV9+LFo+uuHEkB90MHoN3RtcrYQpu/oxfDmxCBDqD0twu9U0/Ir7eJEmjQzbX4l/gTGrdB1ePqB9mPscVlhEYO3q2iT9yXLTiGEEkDx2hAksYCIJw9ld/iMPpKv9goEASOZs3B08QdsmTYcQ2BGQKtZQsb8P7TFPVnOcW2ENHSbB9++eG73eoTcsQ+BEkCJWCm9diw2dzPIT5V6MrjdrdOgn6TmrCr/RL9pY0fet9qj0O/Yo+mI0VlOdxM2hbA/USeJZMN5TxXlTtPKmBmMEkD7uzAvsSrSTonbwRR5o4Uu8EfMoTDbY20m7w/77qJ59dlUaBvSL6PU0TV6aN6ZHD7GUxrkzGcAq6YOTMKxyWKBEkAiwR6UZBo9Ce4UKdltAOPIfKCS/i5KUJKQfsZR2HC572T3vADEyyZ8GtkUzsi4aBuJd5bVgW4UJUQ/ENmGyymCEkDPK9BGTfF8eGx7YBCvoMSj/nSkfSzseB6g3VxUO/Blgyfrru3/hca+eXPPqLnqlyOyw94JUsmnTkY42otnXhiIEkCnXWRF4gHSKVKyp/Q2rVSkaMWLJPCkGBpv/Ay1y6l45g/nfRSmbiq7hUWnAPKxklE7SAOqMkws7e11fCwAeSSB"))
                //{"senderPublicKey":"AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV","amount":9223372036854775807,"sender":"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF","feeAssetId":null,"chainId":82,"proofs":["4hZmtnVwFkj1N5ypgoxmFsvzvgmcr32ffRbuHRv9eWQ5ZeiVP8EoJeitACXHJvitENBHgrGcEtWhM6WRGqabgDLr","3WtzGAGW2BmWRvJCVQEgKeUyCwpidGiLmnAHXFVzrVL7wkdztZJ8TnBeme643JMUCCC7hURvkt9gpa5NXu7wxXxX","5qTG4chcuyKGVnYQksyYwz1dCPenqz4jcbo7e51oCkKJ3k19hhdR3UfLsLEJrUAH8oudDdAGV7NDyUcvUW3jCvb2","3kGPckN5hLuGNvNxhc292WS32dek7pfQ8uUTJC4nfMRvzqyXAtqnrwFtnpZGkVZLXxrqBREaAySD5rpgAGLGcady","62uijRo8Wo7Z1sBhNNcrhM2jeBLKsKuXpWZRumxD3Pqt4GVzcB5ChYe58chRbxMWcL5R5MReQz9SiBbm9t2XNpFr","hJUpAhoCqJWhpQBGD5VGeG9wnzH5b8gF1QasFwUg7kTycBQ7qvo7n3qS37XiEi5aYEzxeNRkBARwVb7jNkFce4h","59Ejnjny6tZ8NHuJfik7wciCNxE2QNwakAnfHrQEdk4cbpzHPHZa5oJ1t3ccj2RVD12kpFmDLMHrC49BxP3sb9Mq","4M5UhsF2ACXVJV1BmrQg8hUoCdy4YS7XGWHJJxpZzUtMTJ1QUQKw7N99uKGUUPMwrfBG9aMfahvbdLycHhYtAWBr"],"fee":100000,"recipient":"3M4qwDomRabJKLZxuXhwfqLApQkU592nWxF","id":"96peWN7hJLzTRiT68VLxgZtAnw6gHWzX7P9mqmM2B56E","type":8,"version":3,"timestamp":1600000000000}
        );
    }

    @ParameterizedTest(name = "{index}: v{0} to {1} of {2} wavelets")
    @MethodSource("transactionsProvider")
    void leaseTransaction(int version, Recipient recipient, long amount, List<Proof> proofs, TxId expectedId, byte[] expectedBody, byte[] expectedBytes) throws IOException {
        LeaseTransaction builtTx = LeaseTransaction
                .with(recipient, amount)
                .chainId(Waves.chainId)
                .fee(LeaseTransaction.MIN_FEE)
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

        LeaseTransaction constructedTx = new LeaseTransaction(sender, recipient, amount, Waves.chainId, LeaseTransaction.MIN_FEE, timestamp, version, proofs);

        assertAll("Txs created via builder and constructor are equal",
                () -> assertThat(builtTx.bodyBytes()).isEqualTo(constructedTx.bodyBytes()),
                () -> assertThat(builtTx.id()).isEqualTo(constructedTx.id()),
                () -> assertThat(builtTx.toBytes()).isEqualTo(constructedTx.toBytes())
        );

        LeaseTransaction deserTx = LeaseTransaction.fromBytes(expectedBytes);

        assertAll("Tx must be deserializable from expected bytes",
                () -> assertThat(deserTx.recipient()).isEqualTo(recipient),
                () -> assertThat(deserTx.amount()).isEqualTo(amount),

                () -> assertThat(deserTx.version()).isEqualTo(version),
                () -> assertThat(deserTx.chainId()).isEqualTo(Waves.chainId),
                () -> assertThat(deserTx.sender()).isEqualTo(sender),
                () -> assertThat(deserTx.fee()).isEqualTo(LeaseTransaction.MIN_FEE),
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
    }

}
