package io.decentralchain.sdk;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@SuppressWarnings("unused")
public class ScriptMeta {

  private final int metaVersion;
  private final Map<String, List<ArgMeta>> callableFunctions;

  @JsonCreator
  public ScriptMeta(
      @JsonProperty("version") int metaVersion,
      @JsonProperty("callableFuncTypes") Map<String, List<ArgMeta>> callableFunctions) {
    this.metaVersion = metaVersion;
    this.callableFunctions =
        Common.notNull(callableFunctions, "FuncTypes").entrySet().stream()
            .collect(
                Collectors.toUnmodifiableMap(
                    Map.Entry::getKey,
                    e -> Collections.unmodifiableList(new ArrayList<>(e.getValue()))));
  }

  public int metaVersion() {
    return metaVersion;
  }

  public Map<String, List<ArgMeta>> callableFunctions() {
    return callableFunctions;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    ScriptMeta that = (ScriptMeta) o;
    return metaVersion == that.metaVersion
        && Objects.equals(callableFunctions, that.callableFunctions);
  }

  @Override
  public int hashCode() {
    return Objects.hash(metaVersion, callableFunctions);
  }

  @Override
  public String toString() {
    return "ScriptMeta{"
        + "metaVersion="
        + metaVersion
        + ", callableFunctions="
        + callableFunctions
        + '}';
  }
}
