package com.wavesplatform.wavesj;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Objects;

public class Feature {

    private final int id;
    private final String description;
    private final String blockchainStatus;
    private final String nodeStatus;
    private final int activationHeight;

    @JsonCreator
    public Feature(
            @JsonProperty("id") int id,
            @JsonProperty("description") String description,
            @JsonProperty("blockchainStatus") String blockchainStatus,
            @JsonProperty("nodeStatus") String nodeStatus,
            @JsonProperty("activationHeight") int activationHeight
    ) {
        this.id = id;
        this.description = description;
        this.blockchainStatus = blockchainStatus;
        this.nodeStatus = nodeStatus;
        this.activationHeight = activationHeight;
    }

    public int id() {
        return id;
    }

    public String description() {
        return description;
    }

    public String blockchainStatus() {
        return blockchainStatus;
    }

    public String nodeStatus() {
        return nodeStatus;
    }

    public int activationHeight() {
        return activationHeight;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Feature feature = (Feature) o;
        return id == feature.id && activationHeight == feature.activationHeight && Objects.equals(description, feature.description) && Objects.equals(blockchainStatus, feature.blockchainStatus) && Objects.equals(nodeStatus, feature.nodeStatus);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, description, blockchainStatus, nodeStatus, activationHeight);
    }

    @Override
    public String toString() {
        return "Feature{" +
                "id=" + id +
                ", description='" + description + '\'' +
                ", blockchainStatus='" + blockchainStatus + '\'' +
                ", nodeStatus='" + nodeStatus + '\'' +
                ", activationHeight=" + activationHeight +
                '}';
    }
}
