package com.wavesplatform.transactions;

import com.wavesplatform.crypto.Bytes;
import com.wavesplatform.crypto.Hash;
import com.wavesplatform.transactions.account.PrivateKey;
import com.wavesplatform.transactions.account.PublicKey;
import com.wavesplatform.transactions.common.Amount;
import com.wavesplatform.transactions.common.Id;
import com.wavesplatform.transactions.common.Proof;
import com.wavesplatform.transactions.serializers.binary.BinarySerializer;
import com.wavesplatform.transactions.serializers.json.JsonSerializer;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

@SuppressWarnings({"UnusedReturnValue", "unchecked", "unused"})
public abstract class TransactionOrOrder {

    protected Id id;
    private final int version;
    private final byte chainId;
    private final PublicKey sender;
    private final Amount fee;
    private final long timestamp;
    private final List<Proof> proofs;
    private byte[] bodyBytes;

    protected TransactionOrOrder(int version, byte chainId, PublicKey sender, Amount fee, long timestamp, List<Proof> proofs) {
        this.id = null;
        this.version = version;
        this.chainId = chainId;
        this.sender = sender;
        this.fee = fee;
        this.timestamp = timestamp;
        this.proofs = proofs == null ? Proof.emptyList() : new ArrayList<>(proofs);
    }

    public int version() {
        return version;
    }

    public byte chainId() {
        return chainId;
    }

    public PublicKey sender() {
        return sender;
    }

    public Amount fee() {
        return fee;
    }

    public long timestamp() {
        return timestamp;
    }

    public List<Proof> proofs() {
        return proofs;
    }

    public byte[] bodyBytes() {
        if (this.bodyBytes == null)
            this.bodyBytes = BinarySerializer.bodyBytes(this);
        return this.bodyBytes;
    }

    public Id id() {
        if (id == null)
            id = new Id(Hash.blake(bodyBytes()));
        return id;
    }

    public <T extends TransactionOrOrder> T addProof(Proof proof) {
        proofs.add(proof);
        return (T) this;
    }

    public <T extends TransactionOrOrder> T addProof(PrivateKey privateKey) {
        addProof(Proof.as(privateKey.sign(bodyBytes())));
        return (T) this;
    }

    public <T extends TransactionOrOrder> T addProofs(List<Proof> proofs) {
        this.proofs.addAll(proofs);
        return (T) this;
    }

    public <T extends TransactionOrOrder> T setProof(int index, Proof proof) {
        for (int i = proofs.size(); i <= index; i++)
            proofs.add(Proof.as(Bytes.empty()));
        proofs.set(index, proof);
        return (T) this;
    }

    public <T extends TransactionOrOrder> T setProof(int index, PrivateKey privateKey) {
        setProof(index, Proof.as(privateKey.sign(bodyBytes())));
        return (T) this;
    }

    public byte[] toBytes() {
        return BinarySerializer.toBytes(this);
    }

    public String toPrettyJson() {
        return JsonSerializer.toPrettyJson(this);
    }

    public String toJson() {
        return JsonSerializer.toJson(this);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TransactionOrOrder that = (TransactionOrOrder) o;
        return Bytes.equal(this.bodyBytes(), that.bodyBytes())
                && this.proofs.equals(that.proofs);
    }

    @Override
    public int hashCode() {
        return Objects.hash(Arrays.hashCode(this.bodyBytes()), proofs);
    }

    @Override
    public String toString() {
        return this.toJson();
    }

    protected static abstract class TransactionOrOrderBuilder
            <BUILDER extends TransactionOrOrderBuilder<BUILDER, TX_OR_ORDER>,
                    TX_OR_ORDER extends TransactionOrOrder> {
        protected int version;
        protected byte chainId;
        protected PublicKey sender;
        protected long timestamp;
        protected Amount fee;
        protected long extraFee;

        protected TransactionOrOrderBuilder(int defaultVersion, long defaultFee) {
            this.version = defaultVersion;
            this.chainId = WavesConfig.chainId();
            this.fee = Amount.of(defaultFee);
            this.extraFee = 0;
        }

        protected Amount feeWithExtra() {
            return Amount.of(fee.value() + extraFee, fee.assetId());
        }

        private BUILDER builder() {
            //noinspection unchecked
            return (BUILDER) this;
        }

        public BUILDER version(int version) {
            this.version = version;
            return builder();
        }

        public BUILDER chainId(byte chainId) {
            this.chainId = chainId;
            return builder();
        }

        public BUILDER sender(PublicKey publicKey) {
            this.sender = publicKey;
            return builder();
        }

        public BUILDER fee(Amount fee) {
            this.fee = fee;
            return builder();
        }

        public BUILDER fee(long fee) {
            return fee(Amount.of(fee));
        }

        public BUILDER extraFee(long extraFee) {
            this.extraFee = extraFee;
            return builder();
        }

        public BUILDER timestamp(long timestamp) {
            this.timestamp = timestamp;
            return builder();
        }

        public TX_OR_ORDER getUnsigned() {
            if (timestamp == 0)
                this.timestamp(System.currentTimeMillis());
            return _build();
        }

        public TX_OR_ORDER getSignedWith(PrivateKey signer) {
            if (sender == null)
                sender = signer.publicKey();
            return getUnsigned().addProof(signer);
        }

        protected abstract TX_OR_ORDER _build();
    }

}
