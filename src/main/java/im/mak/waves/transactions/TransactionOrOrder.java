package im.mak.waves.transactions;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.Hash;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Id;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.Waves;
import im.mak.waves.transactions.serializers.BinarySerializer;
import im.mak.waves.transactions.serializers.JsonSerializer;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public abstract class TransactionOrOrder {

    private Id id;
    private final int version;
    private final byte chainId;
    private final PublicKey sender;
    private final long fee;
    private final Asset feeAsset;
    private final long timestamp;
    private final List<Proof> proofs;
    private byte[] bodyBytes;

    protected TransactionOrOrder(int version, byte chainId, PublicKey sender, long fee, Asset feeAsset, long timestamp, List<Proof> proofs) {
        this.id = null;
        this.version = version;
        this.chainId = chainId;
        this.sender = sender;
        this.fee = fee;
        this.feeAsset = feeAsset;
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

    public long fee() {
        return fee;
    }

    public Asset feeAsset() {
        return feeAsset;
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

    public byte[] toBytes() {
        return BinarySerializer.toBytes(this);
    }

    public String toPrettyJson() {
        return JsonSerializer.toPrettyJson(this);
    }

    public String toJson() {
        return JsonSerializer.toJson(this);
    }

    //TODO support java 8 and 11
    //TODO implement clone in crypto lib and in all getters and constructors
    //TODO basic validations in builder/constructor
    //TODO check access to everything
    //TODO check all ") throws {", "throw new" and "catch". Maybe wrap to own exceptions with message patterns?
    //TODO immutable lists
    //TODO calculate fee (data, massTransfer)

    //todo boolean equals(String json)

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
        return Objects.hash(this.bodyBytes(), proofs);
    }

    protected static abstract class TransactionOrOrderBuilder
            <BUILDER extends TransactionOrOrderBuilder<BUILDER, TX_OR_ORDER>,
                    TX_OR_ORDER extends TransactionOrOrder> {
        protected int version;
        protected byte chainId;
        protected PublicKey sender;
        protected long fee;
        protected Asset feeAsset;
        protected long timestamp;

        protected TransactionOrOrderBuilder(int defaultVersion, long defaultFee) {
            this.version = defaultVersion;
            this.chainId = Waves.chainId;
            this.fee = defaultFee;
            this.feeAsset = Asset.WAVES;
        }

        private BUILDER builder() {
            //noinspection unchecked
            return (BUILDER) this;
        }

        //todo hide from public and constructors
        public BUILDER version(int version) {
            this.version = version;
            return builder();
        }

        public BUILDER chainId(byte chainId) {
            this.chainId = chainId;
            return builder();
        }

        //todo require to set, at least sender
        public BUILDER sender(PublicKey publicKey) {
            this.sender = publicKey;
            return builder();
        }

        //todo what if Amount? (TransferTx, InvokeTx)
        public BUILDER fee(long fee) {
            this.fee = fee;
            return builder();
        }

        //todo hide from public
        public BUILDER feeAsset(Asset asset) {
            this.feeAsset = asset;
            return builder();
        }

        public BUILDER timestamp(long timestamp) {
            this.timestamp = timestamp;
            return builder();
        }

        public TX_OR_ORDER get() {
            if (timestamp == 0)
                this.timestamp(System.currentTimeMillis());
            return _build();
        }

        protected abstract TX_OR_ORDER _build();
    }

}
