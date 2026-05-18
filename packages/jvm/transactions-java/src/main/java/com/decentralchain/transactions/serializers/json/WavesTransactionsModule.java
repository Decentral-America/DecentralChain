package com.decentralchain.transactions.serializers.json;

import com.fasterxml.jackson.databind.module.SimpleModule;
import com.decentralchain.transactions.Transaction;
import com.decentralchain.transactions.account.Address;
import com.decentralchain.transactions.account.PublicKey;
import com.decentralchain.transactions.common.*;
import com.decentralchain.transactions.data.DataEntry;
import com.decentralchain.transactions.serializers.json.deser.*;
import com.decentralchain.transactions.serializers.json.ser.*;

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
