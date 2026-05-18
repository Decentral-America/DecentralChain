package io.decentralchain.sdk;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Objects;

public class NodeStatus {

    private final int blockchainHeight;
    private final int stateHeight;
    private final long updatedTimestamp;
    private final String updatedDate;

    @JsonCreator
    public NodeStatus(
            @JsonProperty("blockchainHeight") int blockchainHeight,
            @JsonProperty("stateHeight") int stateHeight,
            @JsonProperty("updatedTimestamp") long updatedTimestamp,
            @JsonProperty("updatedDate") String updatedDate
    ) {
        this.blockchainHeight = blockchainHeight;
        this.stateHeight = stateHeight;
        this.updatedTimestamp = updatedTimestamp;
        this.updatedDate = updatedDate;
    }

    public int blockchainHeight() {
        return blockchainHeight;
    }

    public int stateHeight() {
        return stateHeight;
    }

    public long updatedTimestamp() {
        return updatedTimestamp;
    }

    public String updatedDate() {
        return updatedDate;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        NodeStatus that = (NodeStatus) o;
        return blockchainHeight == that.blockchainHeight && stateHeight == that.stateHeight && updatedTimestamp == that.updatedTimestamp && Objects.equals(updatedDate, that.updatedDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(blockchainHeight, stateHeight, updatedTimestamp, updatedDate);
    }

    @Override
    public String toString() {
        return "NodeStatus{" +
                "blockchainHeight=" + blockchainHeight +
                ", stateHeight=" + stateHeight +
                ", updatedTimestamp=" + updatedTimestamp +
                ", updatedDate='" + updatedDate + '\'' +
                '}';
    }
}
