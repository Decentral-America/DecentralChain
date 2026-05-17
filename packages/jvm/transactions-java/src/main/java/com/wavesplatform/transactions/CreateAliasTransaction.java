package com.wavesplatform.transactions;

import com.wavesplatform.crypto.Hash;
import com.wavesplatform.transactions.account.PublicKey;
import com.wavesplatform.transactions.common.Alias;
import com.wavesplatform.transactions.common.Amount;
import com.wavesplatform.transactions.common.Id;
import com.wavesplatform.transactions.common.Proof;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

import static com.wavesplatform.crypto.Bytes.concat;
import static com.wavesplatform.crypto.Bytes.of;

public class CreateAliasTransaction extends Transaction {

    public static final int TYPE = 10;
    public static final int LATEST_VERSION = 3;
    public static final long MIN_FEE = 100_000;

    private final Alias alias;

    public CreateAliasTransaction(PublicKey sender, String alias) {
        this(sender, alias, WavesConfig.chainId(), Amount.of(MIN_FEE), System.currentTimeMillis(), LATEST_VERSION, Proof.emptyList());
    }

    public CreateAliasTransaction(PublicKey sender, String alias, byte chainId, Amount fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, timestamp, proofs);

        this.alias = Alias.as(chainId, alias == null ? "" : alias);
    }

    public static CreateAliasTransaction fromBytes(byte[] bytes) throws IOException {
        return (CreateAliasTransaction) Transaction.fromBytes(bytes);
    }

    public static CreateAliasTransaction fromJson(String json) throws IOException {
        return (CreateAliasTransaction) Transaction.fromJson(json);
    }

    public static CreateAliasTransactionBuilder builder(String alias) {
        return new CreateAliasTransactionBuilder(alias);
    }

    @Override
    public Id id() {
        return version() < 3
                ? Id.as(Hash.blake(concat(of((byte) type()), alias.bytes())))
                : super.id();
    }

    public Alias alias() {
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

        protected CreateAliasTransactionBuilder(Alias alias) {
            this(alias.name());
            chainId(alias.chainId());
        }

        protected CreateAliasTransactionBuilder(String alias) {
            super(LATEST_VERSION, MIN_FEE);
            this.alias = alias;
        }

        protected CreateAliasTransaction _build() {
            return new CreateAliasTransaction(sender, alias,
                    chainId, feeWithExtra(), timestamp, version, Proof.emptyList());
        }
    }

}
