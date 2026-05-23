package io.decentralchain.sdk.info;

import io.decentralchain.sdk.ApplicationStatus;
import io.decentralchain.sdk.StateChanges;
import io.decentralchain.transactions.InvokeScriptTransaction;
import java.util.Objects;

public class InvokeScriptTransactionInfo extends TransactionInfo {

  private final StateChanges stateChanges;

  public InvokeScriptTransactionInfo(
      InvokeScriptTransaction tx,
      ApplicationStatus applicationStatus,
      int height,
      StateChanges stateChanges) {
    super(tx, applicationStatus, height);
    this.stateChanges = stateChanges;
  }

  public InvokeScriptTransaction tx() {
    return (InvokeScriptTransaction) super.tx();
  }

  public StateChanges stateChanges() {
    return stateChanges;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    if (!super.equals(o)) return false;
    InvokeScriptTransactionInfo that = (InvokeScriptTransactionInfo) o;
    return Objects.equals(stateChanges, that.stateChanges);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), stateChanges);
  }

  @Override
  public String toString() {
    return "InvokeScriptTransactionInfo{"
        + "stateChanges="
        + stateChanges
        + "} "
        + super.toString();
  }
}
