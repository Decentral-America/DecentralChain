package io.decentralchain.sdk;

import com.fasterxml.jackson.annotation.JsonEnumDefaultValue;
import com.fasterxml.jackson.annotation.JsonProperty;

public enum LeaseStatus {
  @JsonEnumDefaultValue
  @JsonProperty("active")
  ACTIVE,

  @JsonProperty("canceled")
  CANCELED
}
