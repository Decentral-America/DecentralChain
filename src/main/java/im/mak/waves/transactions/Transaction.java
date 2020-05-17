package im.mak.waves.transactions;

import com.wavesplatform.protobuf.transaction.TransactionOuterClass;
import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.WithBody;
import im.mak.waves.transactions.common.Waves;
import im.mak.waves.transactions.serializers.BinarySerializer;
import im.mak.waves.transactions.serializers.ProtobufConverter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public abstract class Transaction implements WithBody {

    private final int type;
    private final int version;
    private final byte chainId;
    private final PublicKey sender;
    private final long fee;
    private final Asset feeAsset;
    private final long timestamp;
    private final List<Proof> proofs;
    private byte[] bodyBytes;

    public static Transaction fromBytes(byte[] bytes) throws IOException {
        return BinarySerializer.fromBytes(bytes);
    }

    //todo method to calculate fee/size coefficient (and fee by the target coefficient)

    protected Transaction(int type, int version, byte chainId, PublicKey sender, long fee, Asset feeAsset, long timestamp, List<Proof> proofs) {
        this.type = type;
        this.version = version;
        this.chainId = chainId;
        this.sender = sender; //todo if null (genesisTx)?
        this.fee = fee;
        this.feeAsset = feeAsset;
        this.timestamp = timestamp;
        this.proofs = proofs == null ? Proof.emptyList() : new ArrayList<>(proofs);
    }

    public int type() {
        return type;
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

    @Override
    public byte[] bodyBytes() {
        if (this.bodyBytes == null)
            this.bodyBytes = BinarySerializer.bodyBytes(this);
        return this.bodyBytes;
    }

    @Override
    public byte[] toBytes() {
        return BinarySerializer.toBytes(this);
    }

    public TransactionOuterClass.SignedTransaction toProtobuf() {
        return ProtobufConverter.toProtobuf(this);
    }

    //TODO implement clone in crypto lib and in all getters and constructors
    //TODO this+children: hashCode, equals, toString
    //TODO basic validations in builder/constructor

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Transaction that = (Transaction) o;
        return Bytes.equal(this.bodyBytes(), that.bodyBytes())
                && this.proofs.equals(that.proofs);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.bodyBytes(), proofs);
    }

    protected static abstract class TransactionBuilder
            <BUILDER extends TransactionBuilder<BUILDER, TX>, TX extends Transaction> {
        protected int version;
        protected byte chainId;
        protected PublicKey sender;
        protected long fee;
        protected Asset feeAsset;
        protected long timestamp;

        protected TransactionBuilder(int defaultVersion, long defaultFee) {
            this.version = defaultVersion;
            this.chainId = Waves.chainId;
            this.fee = defaultFee;
            this.feeAsset = Asset.WAVES;
        }

        private BUILDER builder() {
            //noinspection unchecked
            return (BUILDER) this;
        }

        //todo hide from public
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

        public TX get() {
            if (timestamp == 0)
                this.timestamp(System.currentTimeMillis());
            return _build();
        }

        protected abstract TX _build();
    }

}
