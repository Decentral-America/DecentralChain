package io.decentralchain.sdk;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.wavesplatform.transactions.account.BlsSignature;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class FinalizationVoting {

  private final List<Integer> endorserIndexes;
  private final BlsSignature aggregatedEndorsementSignature;
  private final List<ConflictEndorsement> conflictEndorsements;
  private final int finalizedHeight;

  @JsonCreator
  public FinalizationVoting(
      @JsonProperty("endorserIndexes") List<Integer> endorserIndexes,
      @JsonProperty("aggregatedEndorsementSignature") BlsSignature aggregatedEndorsementSignature,
      @JsonProperty("conflictEndorsements") List<ConflictEndorsement> conflictEndorsements,
      @JsonProperty("finalizedHeight") int finalizedHeight) {
    this.endorserIndexes =
        endorserIndexes == null
            ? Collections.emptyList()
            : Collections.unmodifiableList(new ArrayList<>(endorserIndexes));
    this.aggregatedEndorsementSignature = aggregatedEndorsementSignature;
    this.finalizedHeight = finalizedHeight;
    this.conflictEndorsements =
        conflictEndorsements == null
            ? Collections.emptyList()
            : Collections.unmodifiableList(new ArrayList<>(conflictEndorsements));
  }

  public List<Integer> endorserIndexes() {
    return endorserIndexes;
  }

  public BlsSignature aggregatedEndorsementSignature() {
    return aggregatedEndorsementSignature;
  }

  public int finalizedHeight() {
    return finalizedHeight;
  }

  public List<ConflictEndorsement> conflictEndorsements() {
    return conflictEndorsements;
  }

  @Override
  public String toString() {
    return "FinalizationVoting{"
        + "endorserIndexes="
        + endorserIndexes
        + ", aggregatedEndorsementSignature="
        + aggregatedEndorsementSignature
        + ", finalizedHeight="
        + finalizedHeight
        + (!conflictEndorsements.isEmpty() ? ", conflictEndorsements=" + conflictEndorsements : "")
        + '}';
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    FinalizationVoting that = (FinalizationVoting) o;
    return Objects.equals(endorserIndexes, that.endorserIndexes)
        && Objects.equals(aggregatedEndorsementSignature, that.aggregatedEndorsementSignature)
        && finalizedHeight == that.finalizedHeight
        && Objects.equals(conflictEndorsements, that.conflictEndorsements);
  }

  @Override
  public int hashCode() {
    return Objects.hash(
        endorserIndexes, aggregatedEndorsementSignature, finalizedHeight, conflictEndorsements);
  }
}
