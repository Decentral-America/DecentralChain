package im.mak.waves.transactions;

import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.data.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

import static java.util.stream.Collectors.toCollection;

public class DataTransaction extends Transaction {

    public static final int TYPE = 12;
    public static final int LATEST_VERSION = 2;
    public static final long MIN_FEE = 100_000;

    private final List<DataEntry> data;

    public DataTransaction(PublicKey sender, List<DataEntry> data, byte chainId, long fee, long timestamp, int version) {
        this(sender, data, chainId, fee, timestamp, version, Proof.emptyList());
    }

    public DataTransaction(PublicKey sender, List<DataEntry> data, byte chainId, long fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, Asset.WAVES, timestamp, proofs);

        this.data = data == null ? Collections.emptyList() : data;
    }

    public static DataTransaction fromBytes(byte[] bytes) throws IOException {
        return (DataTransaction) Transaction.fromBytes(bytes);
    }

    public static DataTransaction fromJson(String json) throws IOException {
        return (DataTransaction) Transaction.fromJson(json);
    }

    public static DataTransactionBuilder with() {
        return new DataTransactionBuilder();
    }

    public static DataTransactionBuilder with(List<DataEntry> data) {
        return new DataTransactionBuilder(data);
    }

    public List<DataEntry> data() {
        return data;
    }

     public List<String> dataKeys() {
         return data.stream().map(DataEntry::key).collect(toCollection(ArrayList::new));
     }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        DataTransaction that = (DataTransaction) o;
        return this.data.equals(that.data);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), data);
    }

    public static class DataTransactionBuilder
            extends TransactionBuilder<DataTransactionBuilder, DataTransaction> {
        private final List<DataEntry> data;

        protected DataTransactionBuilder() {
            this(new ArrayList<>());
        }

        protected DataTransactionBuilder(List<DataEntry> data) {
            super(LATEST_VERSION, MIN_FEE);
            this.data = data;
        }

        public DataTransactionBuilder entry(DataEntry entry) {
            data.add(entry);
            return this;
        }

        public DataTransactionBuilder binary(String key, byte[] value) {
            data.add(new BinaryEntry(key, value));
            return this;
        }

        public DataTransactionBuilder bool(String key, boolean value) {
            data.add(new BooleanEntry(key, value));
            return this;
        }

        public DataTransactionBuilder integer(String key, long value) {
            data.add(new IntegerEntry(key, value));
            return this;
        }

        public DataTransactionBuilder string(String key, String value) {
            data.add(new StringEntry(key, value));
            return this;
        }

        public DataTransactionBuilder delete(String key) {
            data.add(new DeleteEntry(key));
            return this;
        }

        protected DataTransaction _build() {
            return new DataTransaction(sender, data, chainId, fee, timestamp, version);
        }
    }

}
