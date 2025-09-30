package com.wavesplatform.transactions;

import com.google.common.primitives.Ints;
import com.wavesplatform.crypto.BlsUtils;
import com.wavesplatform.crypto.Bytes;
import com.wavesplatform.transactions.account.BlsPublicKey;
import com.wavesplatform.transactions.account.BlsSignature;
import com.wavesplatform.transactions.account.PrivateKey;
import com.wavesplatform.transactions.account.PublicKey;
import com.wavesplatform.transactions.common.Amount;
import com.wavesplatform.transactions.common.Proof;
import supranational.blst.SecretKey;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class CommitToGenerationTransaction extends Transaction {

    public static final int TYPE = 20;
    public static final int LATEST_VERSION = 1;
    public static final long MIN_FEE = 100_00000;

    private final Integer generationPeriodStart;
    private final BlsPublicKey endorserPublicKey;
    private final BlsSignature commitmentSignature;

    public CommitToGenerationTransaction(PublicKey sender, int generationPeriodStart, BlsPublicKey endorserPublicKey, BlsSignature commitmentSignature, Amount fee, int version, byte chainId, long timestamp, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, timestamp, proofs);
        this.generationPeriodStart = generationPeriodStart;
        this.endorserPublicKey = endorserPublicKey;
        this.commitmentSignature = commitmentSignature;
    }

    public static CommitToGenerationTransaction fromBytes(byte[] bytes) throws IOException {
        return (CommitToGenerationTransaction) Transaction.fromBytes(bytes);
    }

    public static CommitToGenerationTransaction fromJson(String json) throws IOException {
        return (CommitToGenerationTransaction) Transaction.fromJson(json);
    }


    public int generationPeriodStart() {
        return generationPeriodStart;
    }

    public BlsPublicKey endorserPublicKey() {
        return endorserPublicKey;
    }

    public BlsSignature commitmentSignature() {
        return commitmentSignature;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        CommitToGenerationTransaction that = (CommitToGenerationTransaction) o;
        return this.generationPeriodStart.equals(that.generationPeriodStart)
                && this.endorserPublicKey.equals(that.endorserPublicKey)
                && this.commitmentSignature.equals(that.commitmentSignature);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), generationPeriodStart, endorserPublicKey, commitmentSignature);
    }

    public static CommitToGenerationTransactionBuilder builder(int generationPeriodStart) {
        return new CommitToGenerationTransactionBuilder(generationPeriodStart);
    }

    public static class CommitToGenerationTransactionBuilder
            extends TransactionBuilder<CommitToGenerationTransactionBuilder, CommitToGenerationTransaction> {
        private final Integer generationPeriodStart;
        private BlsPublicKey endorserPublicKey;
        private BlsSignature commitmentSignature;

        protected CommitToGenerationTransactionBuilder(int generationPeriodStart) {
            super(LATEST_VERSION, MIN_FEE);
            this.generationPeriodStart = generationPeriodStart;
            this.endorserPublicKey = null;
            this.commitmentSignature = null;
        }

        public CommitToGenerationTransactionBuilder endorserPublicKey(BlsPublicKey pk) {
            this.endorserPublicKey = pk;
            return this;
        }

        public CommitToGenerationTransactionBuilder commitmentSignature(BlsSignature commitmentSignature) {
            this.commitmentSignature = commitmentSignature;
            return this;
        }

        protected CommitToGenerationTransaction _build() {
            return new CommitToGenerationTransaction(sender, generationPeriodStart, endorserPublicKey, commitmentSignature, feeWithExtra(), version, chainId,  timestamp, Proof.emptyList());
        }

        @Override
        public CommitToGenerationTransaction getSignedWith(PrivateKey privateKey) {
            if (sender == null) {
                sender = privateKey.publicKey();
            }
            CommitToGenerationTransaction unsignedTx = getUnsigned();
            SecretKey blsSk = BlsUtils.mkBlsSecretKey(privateKey.bytes());

            byte[] blsPubBytes = this.endorserPublicKey != null
                    ? this.endorserPublicKey.bytes()
                    : BlsUtils.mkBlsPublicKey(blsSk);

            byte[] blsSigBytes = this.commitmentSignature != null
                    ? this.commitmentSignature.bytes()
                    : BlsUtils.sign(blsSk, Bytes.concat(blsPubBytes, Ints.toByteArray(unsignedTx.generationPeriodStart()))
            );

            CommitToGenerationTransaction txWithBls = new CommitToGenerationTransaction(
                    unsignedTx.sender(),
                    unsignedTx.generationPeriodStart(),
                    BlsPublicKey.as(blsPubBytes),
                    BlsSignature.as(blsSigBytes),
                    unsignedTx.fee(),
                    unsignedTx.version(),
                    unsignedTx.chainId(),
                    unsignedTx.timestamp(),
                    Proof.emptyList()
            );

            return txWithBls.addProof(privateKey);
        }

    }


}
