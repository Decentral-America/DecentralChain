package io.decentralchain.sdk.actions;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.decentralchain.sdk.StateChanges;
import io.decentralchain.transactions.account.Address;
import io.decentralchain.transactions.common.Amount;
import io.decentralchain.transactions.invocation.Function;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class InvokeAction {

  private final Address dApp;
  private final Function function;
  private final List<Amount> payments;
  private final StateChanges stateChanges;

  @JsonCreator
  public InvokeAction(
      @JsonProperty("dApp") Address dApp,
      @JsonProperty("call") Function function,
      @JsonProperty("payment") List<Amount> payments,
      @JsonProperty("stateChanges") StateChanges stateChanges) {
    this.dApp = dApp;
    this.function = function;
    this.payments =
        Collections.unmodifiableList(
            new ArrayList<>(payments == null ? Collections.emptyList() : payments));
    this.stateChanges = stateChanges;
  }

  public Address dApp() {
    return dApp;
  }

  public Function function() {
    return function;
  }

  public List<Amount> payments() {
    return payments;
  }

  public StateChanges stateChanges() {
    return stateChanges;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    InvokeAction that = (InvokeAction) o;
    return Objects.equals(dApp, that.dApp)
        && Objects.equals(function, that.function)
        && Objects.equals(payments, that.payments)
        && Objects.equals(stateChanges, that.stateChanges);
  }

  @Override
  public int hashCode() {
    return Objects.hash(dApp, function, payments, stateChanges);
  }

  @Override
  public String toString() {
    return "InvokeAction{"
        + "dApp="
        + dApp
        + ", function="
        + function
        + ", payments="
        + payments
        + ", stateChanges="
        + stateChanges
        + '}';
  }
}
