package im.mak.waves.transactions;

import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.transactions.common.*;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class LeaseCancelTransaction extends Transaction {

    public static final int TYPE = 9;
    public static final int LATEST_VERSION = 3;
    public static final long MIN_FEE = 100_000;

    private final Id leaseId;

    public LeaseCancelTransaction(PublicKey sender, Id leaseId) {
        this(sender, leaseId, WavesJConfig.chainId(), Amount.of(MIN_FEE), System.currentTimeMillis(), LATEST_VERSION,
                Proof.emptyList());
    }

    public LeaseCancelTransaction(PublicKey sender, Id leaseId, byte chainId, Amount fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, timestamp, proofs);

        this.leaseId = leaseId;
    }

    public static LeaseCancelTransaction fromBytes(byte[] bytes) throws IOException {
        return (LeaseCancelTransaction) Transaction.fromBytes(bytes);
    }

    public static LeaseCancelTransaction fromJson(String json) throws IOException {
        return (LeaseCancelTransaction) Transaction.fromJson(json);
    }

    public static LeaseCancelTransactionBuilder with(Id leaseId) {
        return new LeaseCancelTransactionBuilder(leaseId);
    }

    public Id leaseId() {
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
        private final Id leaseId;

        protected LeaseCancelTransactionBuilder(Id leaseId) {
            super(LATEST_VERSION, MIN_FEE);
            this.leaseId = leaseId;
        }

        protected LeaseCancelTransaction _build() {
            return new LeaseCancelTransaction(sender, leaseId, chainId, fee, timestamp, version, Proof.emptyList());
        }
    }

}
