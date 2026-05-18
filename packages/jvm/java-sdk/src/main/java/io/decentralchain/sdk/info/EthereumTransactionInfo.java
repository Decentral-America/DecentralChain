package io.decentralchain.sdk.info;

import com.decentralchain.transactions.EthereumTransaction;
import io.decentralchain.sdk.ApplicationStatus;
import io.decentralchain.sdk.StateChanges;
import java.util.Objects;

public class EthereumTransactionInfo extends TransactionInfo {

  private final StateChanges stateChanges;
  private final String bytes;

  public EthereumTransactionInfo(
      EthereumTransaction tx,
      ApplicationStatus applicationStatus,
      int height,
      StateChanges stateChanges,
      String bytes) {
    super(tx, applicationStatus, height);
    this.stateChanges = stateChanges;
    this.bytes = bytes;
  }

  public EthereumTransaction tx() {
    return (EthereumTransaction) super.tx();
  }

  public boolean isTransferTransaction() {
    return tx().payload() instanceof EthereumTransaction.Transfer;
  }

  public boolean isInvokeTransaction() {
    return tx().payload() instanceof EthereumTransaction.Invocation;
  }

  public StateChanges stateChanges() {
    return stateChanges;
  }

  public String bytes() {
    return bytes;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    if (!super.equals(o)) return false;
    EthereumTransactionInfo that = (EthereumTransactionInfo) o;
    return Objects.equals(stateChanges, that.stateChanges) && Objects.equals(bytes, that.bytes);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), stateChanges, bytes);
  }

  @Override
  public String toString() {
    return "EthereumTransactionInfo{"
        + "stateChanges="
        + stateChanges
        + ", bytes='"
        + bytes
        + '\''
        + "} "
        + super.toString();
  }
}
