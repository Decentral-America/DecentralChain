package im.mak.waves.transactions.components;

import im.mak.waves.crypto.account.Address;

public class Transfer {

    private final Address recipient;
    private final long amount;

    public Transfer(Address recipient, long amount) {
        this.recipient = recipient;
        this.amount = amount;
    }

    public static Transfer to(Address recipient, long amount) {
        return new Transfer(recipient, amount);
    }

    public Address recipient() {
        return recipient;
    }

    public long amount() {
        return amount;
    }

}
