package im.mak.waves.transactions;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.crypto.base.Base64;
import im.mak.waves.transactions.common.Amount;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.WavesJConfig;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

import static java.nio.charset.StandardCharsets.UTF_8;

public class IssueTransaction extends Transaction {

    public static final int TYPE = 3;
    public static final int LATEST_VERSION = 3;
    public static final long MIN_FEE = 100_000_000;
    public static final long NFT_MIN_FEE = 100_000;

    private final byte[] name;
    private final byte[] description;
    private final long quantity;
    private final int decimals;
    private final boolean isReissuable;
    private final byte[] compiledScript;

    public IssueTransaction(PublicKey sender, String name, String description, long quantity, int decimals,
                            boolean isReissuable, byte[] compiledScript) {
        this(sender, name, description, quantity, decimals, isReissuable, compiledScript, WavesJConfig.chainId(),
                Amount.of(MIN_FEE), System.currentTimeMillis(), LATEST_VERSION, Proof.emptyList());
    }

    public IssueTransaction(PublicKey sender, String name, String description, long quantity, int decimals,
                            boolean isReissuable, byte[] compiledScript, byte chainId, Amount fee, long timestamp,
                            int version, List<Proof> proofs) {
        this(sender, name == null ? Bytes.empty() : name.getBytes(UTF_8),
                description == null ? Bytes.empty() : description.getBytes(UTF_8), quantity, decimals, isReissuable,
                compiledScript, chainId, fee, timestamp, version, proofs);
    }

    @Deprecated
    public IssueTransaction(PublicKey sender, byte[] name, byte[] description, long quantity, int decimals,
                            boolean isReissuable, byte[] compiledScript, byte chainId, Amount fee, long timestamp,
                            int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, timestamp, proofs);

        this.name = name == null ? Bytes.empty() : name;
        this.description = description == null ? Bytes.empty() : description;
        this.quantity = quantity;
        this.decimals = decimals;
        this.isReissuable = isReissuable;
        this.compiledScript = compiledScript == null ? Bytes.empty() : compiledScript;
    }

    public static IssueTransaction fromBytes(byte[] bytes) throws IOException {
        return (IssueTransaction) Transaction.fromBytes(bytes);
    }

    public static IssueTransaction fromJson(String json) throws IOException {
        return (IssueTransaction) Transaction.fromJson(json);
    }

    public static IssueTransaction.IssueTransactionBuilder with(String name, long quantity, int decimals) {
        return new IssueTransaction.IssueTransactionBuilder(name, quantity, decimals);
    }

    public static IssueTransaction.IssueTransactionNFTBuilder withNft(String name) {
        return new IssueTransaction.IssueTransactionNFTBuilder(name);
    }

    public String name() {
        return new String(name, UTF_8);
    }

    public byte[] nameBytes() {
        return name;
    }

    public String description() {
        return new String(description, UTF_8);
    }

    public byte[] descriptionBytes() {
        return description;
    }

    public long quantity() {
        return quantity;
    }

    public int decimals() {
        return decimals;
    }

    public boolean isReissuable() {
        return isReissuable;
    }

    public String compiledBase64Script() {
        return Base64.encode(compiledScript);
    }

    public byte[] compiledScript() {
        return compiledScript;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        IssueTransaction that = (IssueTransaction) o;
        return Bytes.equal(this.name, that.name)
                && Bytes.equal(this.description, that.description)
                && this.quantity == that.quantity
                && this.decimals == that.decimals
                && this.isReissuable == that.isReissuable
                && Bytes.equal(this.compiledScript, that.compiledScript);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), name, description, quantity, decimals, isReissuable, compiledScript);
    }

    public static class IssueTransactionBuilder
            extends TransactionBuilder<IssueTransaction.IssueTransactionBuilder, IssueTransaction> {
        private final byte[] name;
        private byte[] description;
        private final long quantity;
        private final int decimals;
        private boolean isReissuable;
        private byte[] compiledScript;

        protected IssueTransactionBuilder(String name, long quantity, int decimals) {
            super(LATEST_VERSION, MIN_FEE);
            this.name = name == null ? Bytes.empty() : name.getBytes(UTF_8);
            this.quantity = quantity;
            this.decimals = decimals;
            this.description = Bytes.empty();
            this.isReissuable = true;
            this.compiledScript = Bytes.empty();
        }

        public IssueTransactionBuilder description(String description) {
            this.description = description.getBytes(UTF_8);
            return this;
        }

        public IssueTransactionBuilder isReissuable(boolean isReissuable) {
            this.isReissuable = isReissuable;
            return this;
        }

        public IssueTransactionBuilder compiledScript(String compiledBase64Script) {
            return compiledScript(compiledBase64Script == null ? null : Base64.decode(compiledBase64Script));
        }

        public IssueTransactionBuilder compiledScript(byte[] compiledScript) {
            this.compiledScript = compiledScript;
            return this;
        }

        protected IssueTransaction _build() {
            return new IssueTransaction(sender, name, description, quantity, decimals, isReissuable, compiledScript,
                    chainId, fee, timestamp, version, Proof.emptyList());
        }
    }

    public static class IssueTransactionNFTBuilder
            extends TransactionBuilder<IssueTransactionNFTBuilder, IssueTransaction> {
        private final byte[] name;
        private byte[] description;
        private byte[] compiledScript;

        private static final long QUANTITY = 1;
        private static final int DECIMALS = 0;
        private static final boolean REISSUABLE = false;

        protected IssueTransactionNFTBuilder(String name) {
            super(LATEST_VERSION, NFT_MIN_FEE);
            this.name = name == null ? Bytes.empty() : name.getBytes(UTF_8);
            this.description = Bytes.empty();
            this.compiledScript = Bytes.empty();
        }

        public IssueTransactionNFTBuilder description(String description) {
            this.description = description.getBytes(UTF_8);
            return this;
        }

        public IssueTransactionNFTBuilder compiledScript(String compiledBase64Script) {
            return compiledScript(compiledBase64Script == null ? null : Base64.decode(compiledBase64Script));
        }

        public IssueTransactionNFTBuilder compiledScript(byte[] compiledScript) {
            this.compiledScript = compiledScript;
            return this;
        }

        protected IssueTransaction _build() {
            return new IssueTransaction(sender, name, description, QUANTITY, DECIMALS, REISSUABLE, compiledScript,
                    chainId, feeWithExtra(), timestamp, version, Proof.emptyList());
        }
    }
    
}
