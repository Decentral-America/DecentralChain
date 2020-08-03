package im.mak.waves.transactions.serializers.json;

import com.fasterxml.jackson.databind.module.SimpleModule;
import im.mak.waves.transactions.Transaction;
import im.mak.waves.transactions.account.Address;
import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.transactions.common.Alias;
import im.mak.waves.transactions.common.Id;
import im.mak.waves.transactions.data.DataEntry;
import im.mak.waves.transactions.serializers.json.deser.*;
import im.mak.waves.transactions.serializers.json.ser.*;

public class WavesTransactionsModule extends SimpleModule {

    public WavesTransactionsModule() {
        addDeserializer(Address.class, new AddressDeser()); //todo @JsonValue toString() + @JsonProperty
        addDeserializer(Alias.class, new AliasDeser()); //todo @JsonValue toString() + @JsonProperty
        addDeserializer(DataEntry.class, new DataEntryDeser());
        addDeserializer(Id.class, new IdDeser());
        addDeserializer(PublicKey.class, new PublicKeyDeser());
        //todo Recipient
        addDeserializer(Transaction.class, new TransactionDeser());

        addSerializer(Address.class, new AddressSer());
        addSerializer(Alias.class, new AliasSer());
        addSerializer(Id.class, new IdSer());
        addSerializer(PublicKey.class, new PublicKeySer());
    }

}
