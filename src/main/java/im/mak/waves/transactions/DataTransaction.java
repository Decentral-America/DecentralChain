package im.mak.waves.transactions;

import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.transactions.common.Amount;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.data.*;

import java.io.IOException;
import java.util.*;

import static java.util.stream.Collectors.toCollection;

public class DataTransaction extends Transaction {

    public static final int TYPE = 12;
    public static final int LATEST_VERSION = 2;
    public static final long MIN_FEE = 100_000;

    private final List<DataEntry> data;

    public DataTransaction(PublicKey sender, List<DataEntry> data) {
        this(sender, data, WavesConfig.chainId(), Amount.of(0), System.currentTimeMillis(), LATEST_VERSION, Proof.emptyList());
    }

    public DataTransaction(PublicKey sender, List<DataEntry> data, byte chainId, Amount fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, calculateFee(data, fee, version), timestamp, proofs);

        this.data = data == null ? Collections.emptyList() : data;
    }

    public static DataTransaction fromBytes(byte[] bytes) throws IOException {
        return (DataTransaction) Transaction.fromBytes(bytes);
    }

    public static DataTransaction fromJson(String json) throws IOException {
        return (DataTransaction) Transaction.fromJson(json);
    }

    public static DataTransactionBuilder builder(List<DataEntry> data) {
        return new DataTransactionBuilder(data);
    }

    public static DataTransactionBuilder builder(DataEntry... data) {
        return new DataTransactionBuilder(Arrays.asList(data));
    }

    private static Amount calculateFee(List<DataEntry> data, Amount fee, int version) {
        if (fee.value() > 0)
            return fee;

        DataTransaction tempTx = new DataTransaction(PublicKey.as("11111111111111111111111111111111"), data,
                WavesConfig.chainId(), Amount.of(MIN_FEE), System.currentTimeMillis(), version, Proof.emptyList());
        int payloadSize = tempTx.version() == 1
                ? tempTx.bodyBytes().length
                : tempTx.toProtobuf().getTransaction().getDataTransaction().toByteArray().length;

        long payloadFee = MIN_FEE * (1 + (payloadSize - 1) / 1024);
        return Amount.of(payloadFee);
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

        protected DataTransactionBuilder(List<DataEntry> data) {
            super(LATEST_VERSION, 0);
            this.data = data;
        }

        protected DataTransaction _build() {
            Amount calculatedFee = calculateFee(data, fee, version);
            Amount calculatedFeeWithExtra = Amount.of(calculatedFee.value() + extraFee, calculatedFee.assetId());
            return new DataTransaction(sender, data,
                    chainId, calculatedFeeWithExtra, timestamp, version, Proof.emptyList());
        }
    }

}
