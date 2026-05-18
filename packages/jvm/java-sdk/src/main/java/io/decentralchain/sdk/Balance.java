package io.decentralchain.sdk;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.wavesplatform.transactions.account.Address;
import java.util.Objects;

public class Balance {
  private final Address address;
  private final long balance;

  @JsonCreator
  public Balance(@JsonProperty("id") Address address, @JsonProperty("balance") long balance) {
    this.address = Common.notNull(address, "Id");
    this.balance = balance;
  }

  public Address address() {
    return address;
  }

  public long balance() {
    return balance;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Balance)) return false;
    Balance balance1 = (Balance) o;
    return balance == balance1.balance && Objects.equals(address, balance1.address);
  }

  @Override
  public int hashCode() {
    return Objects.hash(address, balance);
  }

  @Override
  public String toString() {
    return "Balance{" + "address=" + address + ", balance=" + balance + '}';
  }
}
