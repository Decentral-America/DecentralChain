package com.wavesplatform.transactions.mass;

import com.wavesplatform.transactions.common.Recipient;

import java.util.Objects;

public class Transfer {

    private final Recipient recipient;
    private final long amount;

    public Transfer(Recipient recipient, long amount) {
        if (recipient == null)
            throw new IllegalArgumentException("Recipient of transfer can't be null");
        this.recipient = recipient;
        this.amount = amount;
    }

    public static Transfer to(Recipient recipient, long amount) {
        return new Transfer(recipient, amount);
    }

    public Recipient recipient() {
        return recipient;
    }

    public long amount() {
        return amount;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Transfer that = (Transfer) o;
        return this.amount == that.amount &&
                this.recipient.equals(that.recipient);
    }

    @Override
    public int hashCode() {
        return Objects.hash(recipient, amount);
    }

    @Override
    public String toString() {
        return "Transfer{" +
                "recipient=" + recipient +
                ", amount=" + amount +
                '}';
    }
}
