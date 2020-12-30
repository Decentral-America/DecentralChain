package com.wavesplatform.crypto;

import org.junit.jupiter.api.Test;

import java.util.stream.Stream;

import static java.util.stream.Collectors.toList;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TestMerkleTree {

    @Test
    void singleLeaf() {
        MerkleTree tree = MerkleTree.of("zero".getBytes());
        byte[] proof = tree.proofByLeafIndex(0);
        byte[] falseProof = proof.clone();
        falseProof[0] += 1;
        assertAll(
                () -> assertThat(tree.isProofValid(proof, "zero".getBytes())).isEqualTo(true),
                () -> assertThat(tree.isProofValid(falseProof, "zero".getBytes())).isEqualTo(false),
                () -> assertThrows(IllegalArgumentException.class, () ->
                        tree.isProofValid(proof, "one".getBytes()) ));
    }

    @Test
    void twoLeafs() {
        MerkleTree tree = MerkleTree.of("zero".getBytes(), "one".getBytes());
        byte[] proof0 = tree.proofByLeafIndex(0);
        byte[] proof1 = tree.proofByLeafIndex(1);
        assertAll(
                () -> assertThat(tree.isProofValid(proof0, "zero".getBytes())).isEqualTo(true),
                () -> assertThat(tree.isProofValid(proof1, "one".getBytes())).isEqualTo(true),
                () -> assertThat(tree.isProofValid(proof1, "zero".getBytes())).isEqualTo(false),
                () -> assertThrows(IllegalArgumentException.class, () ->
                        tree.isProofValid(proof0, "three".getBytes()) ));
    }

    @Test
    void nineLeafs() {
        MerkleTree tree = MerkleTree.of(Stream.of("zero", "one", "two", "three", "four", "five", "six", "seven", "eight")
                .map(String::getBytes).collect(toList()));
        byte[] proof0 = tree.proofByLeaf("zero".getBytes());
        byte[] proof1 = tree.proofByLeaf("one".getBytes());
        byte[] proof2 = tree.proofByLeaf("two".getBytes());
        byte[] proof3 = tree.proofByLeaf("three".getBytes());
        byte[] proof4 = tree.proofByLeaf("four".getBytes());
        byte[] proof5 = tree.proofByLeaf("five".getBytes());
        byte[] proof6 = tree.proofByLeaf("six".getBytes());
        byte[] proof7 = tree.proofByLeaf("seven".getBytes());
        byte[] proof8 = tree.proofByLeaf("eight".getBytes());
        assertAll(
                () -> assertThat(tree.isProofValid(proof0, "zero".getBytes())).isEqualTo(true),
                () -> assertThat(tree.isProofValid(proof1, "one".getBytes())).isEqualTo(true),
                () -> assertThat(tree.isProofValid(proof2, "two".getBytes())).isEqualTo(true),
                () -> assertThat(tree.isProofValid(proof3, "three".getBytes())).isEqualTo(true),
                () -> assertThat(tree.isProofValid(proof4, "four".getBytes())).isEqualTo(true),
                () -> assertThat(tree.isProofValid(proof5, "five".getBytes())).isEqualTo(true),
                () -> assertThat(tree.isProofValid(proof6, "six".getBytes())).isEqualTo(true),
                () -> assertThat(tree.isProofValid(proof7, "seven".getBytes())).isEqualTo(true),
                () -> assertThat(tree.isProofValid(proof8, "eight".getBytes())).isEqualTo(true),
                () -> assertThat(tree.isProofValid(proof0, "four".getBytes())).isEqualTo(false),
                () -> assertThrows(IllegalArgumentException.class, () ->
                        tree.isProofValid(proof0, "nine".getBytes()) ));
    }

}
