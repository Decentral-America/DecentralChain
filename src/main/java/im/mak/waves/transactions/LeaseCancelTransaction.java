package im.mak.waves.transactions;

import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.TxId;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class LeaseCancelTransaction extends Transaction {

    public static final int TYPE = 9;
    public static final int LATEST_VERSION = 3;
    public static final long MIN_FEE = 100_000;

    private final TxId leaseId;

    public LeaseCancelTransaction(PublicKey sender, TxId leaseId, byte chainId, long fee, long timestamp, int version) {
        this(sender, leaseId, chainId, fee, timestamp, version, Proof.emptyList());
    }

    public LeaseCancelTransaction(PublicKey sender, TxId leaseId, byte chainId, long fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, Asset.WAVES, timestamp, proofs);

        this.leaseId = leaseId;
    }

    public static LeaseCancelTransaction fromBytes(byte[] bytes) throws IOException {
        return (LeaseCancelTransaction) Transaction.fromBytes(bytes);
    }

    public static LeaseCancelTransaction fromJson(String json) throws IOException {
        return (LeaseCancelTransaction) Transaction.fromJson(json);
    }

    public static LeaseCancelTransactionBuilder with(TxId leaseId) {
        return new LeaseCancelTransactionBuilder(leaseId);
    }

    public TxId leaseId() {
        return leaseId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        LeaseCancelTransaction that = (LeaseCancelTransaction) o;
        return this.leaseId.equals(that.leaseId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), leaseId);
    }

    public static class LeaseCancelTransactionBuilder
            extends TransactionBuilder<LeaseCancelTransactionBuilder, LeaseCancelTransaction> {
        private final TxId leaseId;

        protected LeaseCancelTransactionBuilder(TxId leaseId) {
            super(LATEST_VERSION, MIN_FEE);
            this.leaseId = leaseId;
        }

        protected LeaseCancelTransaction _build() {
            return new LeaseCancelTransaction(sender, leaseId, chainId, fee, timestamp, version, Proof.emptyList());
        }
    }

}
