package im.mak.waves.transactions.serializers.json;

import com.fasterxml.jackson.databind.module.SimpleModule;
import im.mak.waves.transactions.Transaction;
import im.mak.waves.transactions.account.Address;
import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.transactions.common.*;
import im.mak.waves.transactions.data.DataEntry;
import im.mak.waves.transactions.serializers.json.deser.*;
import im.mak.waves.transactions.serializers.json.ser.*;

public class WavesTransactionsModule extends SimpleModule {

    public WavesTransactionsModule() {
        addDeserializer(Address.class, new AddressDeser());
        addDeserializer(Alias.class, new AliasDeser());
        addDeserializer(AssetId.class, new AssetIdDeser());
        addDeserializer(Base58String.class, new Base58StringDeser());
        addDeserializer(Base64String.class, new Base64StringDeser());
        addDeserializer(DataEntry.class, new DataEntryDeser());
        addDeserializer(Id.class, new IdDeser());
        addDeserializer(PublicKey.class, new PublicKeyDeser());
        addDeserializer(Transaction.class, new TransactionDeser());

        addSerializer(Address.class, new AddressSer());
        addSerializer(Alias.class, new AliasSer());
        addSerializer(AssetId.class, new AssetIdSer());
        addSerializer(Base58String.class, new Base58StringSer());
        addSerializer(Base64String.class, new Base64StringSer());
        addSerializer(Id.class, new IdSer());
        addSerializer(PublicKey.class, new PublicKeySer());
    }

}
