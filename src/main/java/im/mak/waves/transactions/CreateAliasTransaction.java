package im.mak.waves.transactions;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.Hash;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.TxId;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

import static im.mak.waves.crypto.Bytes.concat;
import static im.mak.waves.crypto.Bytes.of;
import static java.nio.charset.StandardCharsets.UTF_8;

public class CreateAliasTransaction extends Transaction {

    public static final int TYPE = 10;
    public static final int LATEST_VERSION = 3;
    public static final long MIN_FEE = 100_000;

    private final String alias; //todo Alias, but what about constructor and builder.chainId()?

    public CreateAliasTransaction(PublicKey sender, String alias, byte chainId, long fee, long timestamp, int version) {
        this(sender, alias, chainId, fee, timestamp, version, Proof.emptyList());
    }

    public CreateAliasTransaction(PublicKey sender, String alias, byte chainId, long fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, Asset.WAVES, timestamp, proofs);

        this.alias = alias == null ? "" : alias;
    }

    public static CreateAliasTransaction fromBytes(byte[] bytes) throws IOException {
        return (CreateAliasTransaction) Transaction.fromBytes(bytes);
    }

    public static CreateAliasTransaction fromJson(String json) throws IOException {
        return (CreateAliasTransaction) Transaction.fromJson(json);
    }

    public static CreateAliasTransactionBuilder with(String alias) {
        return new CreateAliasTransactionBuilder(alias);
    }

    @Override
    public TxId id() {
        return version() < 3
                ? TxId.id(Hash.blake(concat(of((byte) type(), (byte) 2, chainId()), Bytes.toSizedByteArray(alias.getBytes(UTF_8)))))
                : super.id();
    }

    public String alias() {
        return alias;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        CreateAliasTransaction that = (CreateAliasTransaction) o;
        return this.alias.equals(that.alias);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), alias);
    }

    public static class CreateAliasTransactionBuilder
            extends TransactionBuilder<CreateAliasTransactionBuilder, CreateAliasTransaction> {
        private final String alias;

        protected CreateAliasTransactionBuilder(String alias) {
            super(LATEST_VERSION, MIN_FEE);
            this.alias = alias;
        }

        protected CreateAliasTransaction _build() {
            return new CreateAliasTransaction(sender, alias, chainId, fee, timestamp, version);
        }
    }

}
