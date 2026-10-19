package io.decentralchain.transactions.serializers.json;

import com.fasterxml.jackson.databind.module.SimpleModule;
import io.decentralchain.transactions.Transaction;
import io.decentralchain.transactions.account.Address;
import io.decentralchain.transactions.account.PublicKey;
import io.decentralchain.transactions.common.*;
import io.decentralchain.transactions.data.DataEntry;
import io.decentralchain.transactions.serializers.json.deser.*;
import io.decentralchain.transactions.serializers.json.ser.*;

public class DccTransactionsModule extends SimpleModule {

    public DccTransactionsModule() {
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
