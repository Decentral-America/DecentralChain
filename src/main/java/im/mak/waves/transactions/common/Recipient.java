package im.mak.waves.transactions.common;

import im.mak.waves.crypto.account.Address;

import java.util.Objects;

public class Recipient {
    private Address address;
    private Alias alias;

    public Recipient(Address address) {
        this.address = address;
    }

    public Recipient(Alias alias) {
        this.alias = alias;
    }

    public static Recipient as(Address address) {
        return new Recipient(address);
    }

    public static Recipient as(Alias alias) {
        return new Recipient(alias);
    }

    public boolean isAlias() {
        return this.address == null;
    }

    public byte chainId() {
        return isAlias() ? alias.chainId() : address.chainId();
    }

    public Object value() {
        return this.isAlias() ? this.alias : this.address;
    }

    public Address address() {
        return this.address;
    }

    public Alias alias() {
        return this.alias;
    }

    @Override
    public String toString() {
        return isAlias() ? alias.toString() : address.toString();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Recipient that = (Recipient) o;
        return Objects.equals(this.address, that.address) &&
                Objects.equals(this.alias, that.alias);
    }

    @Override
    public int hashCode() {
        return Objects.hash(address, alias);
    }
}
