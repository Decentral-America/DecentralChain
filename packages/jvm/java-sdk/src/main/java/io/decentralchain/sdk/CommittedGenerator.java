package io.decentralchain.sdk;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.decentralchain.transactions.account.Address;
import io.decentralchain.transactions.common.Id;
import java.util.Objects;

public class CommittedGenerator {

  private final Address address;
  private final long balance;
  private final Id transactionId;
  private final Integer conflictHeight;

  @JsonCreator
  public CommittedGenerator(
      @JsonProperty("address") Address address,
      @JsonProperty("balance") long balance,
      @JsonProperty("transactionId") Id transactionId,
      @JsonProperty("conflictHeight") Integer conflictHeight) {
    this.address = address;
    this.balance = balance;
    this.transactionId = transactionId;
    this.conflictHeight = conflictHeight;
  }

  public Address address() {
    return address;
  }

  public long balance() {
    return balance;
  }

  public Id transactionId() {
    return transactionId;
  }

  public Integer conflictHeight() {
    return conflictHeight;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    CommittedGenerator that = (CommittedGenerator) o;
    return Objects.equals(address, that.address)
        && balance == that.balance
        && Objects.equals(transactionId, that.transactionId)
        && Objects.equals(conflictHeight, that.conflictHeight);
  }

  @Override
  public int hashCode() {
    return Objects.hash(address, balance, transactionId, conflictHeight);
  }

  @Override
  public String toString() {
    return "CommittedGenerator{"
        + "address="
        + address.toString()
        + ", balance="
        + balance
        + ", transactionId="
        + transactionId
        + (conflictHeight != null ? ", conflictHeight=" + conflictHeight : "")
        + '}';
  }
}
