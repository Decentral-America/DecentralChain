package com.wavesplatform.transactions;

import com.wavesplatform.protobuf.transaction.TransactionOuterClass;
import com.wavesplatform.transactions.account.PublicKey;
import com.wavesplatform.transactions.common.Amount;
import com.wavesplatform.transactions.common.Id;
import com.wavesplatform.transactions.common.Proof;
import com.wavesplatform.transactions.serializers.ProtobufConverter;
import com.wavesplatform.transactions.serializers.binary.BinarySerializer;
import com.wavesplatform.transactions.serializers.json.JsonSerializer;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public abstract class Transaction extends TransactionOrOrder {

    private final int type;

    protected Transaction(int type, int version, byte chainId, PublicKey sender, Amount fee, long timestamp, List<Proof> proofs) {
        this(null, type, version, chainId, sender, fee, timestamp, proofs);
    }

    protected Transaction(Id id, int type, int version, byte chainId, PublicKey sender, Amount fee, long timestamp, List<Proof> proofs) {
        super(id, version, chainId, sender, fee, timestamp, proofs);
        this.type = type;
    }

    public static Transaction fromBytes(byte[] bytes) throws IOException {
        return BinarySerializer.transactionFromBytes(bytes);
    }

    public static Transaction fromJson(String json) throws IOException {
        return JsonSerializer.fromJson(json);
    }

    public static Transaction fromProtobuf(TransactionOuterClass.SignedTransaction protobufTx) throws IOException {
        return ProtobufConverter.fromProtobuf(protobufTx);
    }

    public int type() {
        return type;
    }

    public TransactionOuterClass.SignedTransaction toProtobuf() {
        return ProtobufConverter.toProtobuf(this);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        Transaction that = (Transaction) o;
        return this.type == that.type;
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), type);
    }

    public static abstract class TransactionBuilder
            <BUILDER extends TransactionBuilder<BUILDER, TX>, TX extends Transaction>
            extends TransactionOrOrderBuilder<BUILDER, TX> {

        protected TransactionBuilder(int defaultVersion, long defaultFee) {
            super(defaultVersion, defaultFee);
        }

    }

}
