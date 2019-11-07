package im.mak.waves.crypto;

import im.mak.waves.crypto.base.Base58;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

import static java.lang.Math.*;
import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.toList;

/**
 * Immutable Merkle tree on blake2b256 hashes, that is supported in the Ride programming language.
 */
@SuppressWarnings({"WeakerAccess", "unused"})
public class MerkleTree {

    /**
     * Create Merkle tree of provided leafs.
     *
     * @param leafs leafs as arrays of bytes
     * @return Merkle tree
     */
    public static MerkleTree of(byte[]... leafs) {
        return new MerkleTree(leafs);
    }

    /**
     * Create Merkle tree of provided leafs.
     *
     * @param leafs leafs as arrays of bytes
     * @return Merkle tree
     */
    public static MerkleTree of(List<byte[]> leafs) {
        return new MerkleTree(leafs);
    }

    private final List<byte[]> hashes;
    private final List<byte[]> proofs;
    private final byte[] root;

    private final byte LEFT = 0, RIGHT = 1;
    private final byte[] LEAF = new byte[]{0}, NODE = new byte[]{1};
    private final byte[] EMPTY = new byte[]{};
    private final byte[] EMPTY_PROOF = new byte[]{LEFT, 0};

    /**
     * Create Merkle tree of provided leafs.
     *
     * @param leafs leafs as arrays of bytes
     */
    public MerkleTree(byte[]... leafs) {
        hashes = Arrays.stream(leafs).map(this::leafHash).collect(toList());
        proofs = initProofs(hashes);
        root = findRoot(hashes);
    }

    /**
     * Create Merkle tree of provided leafs.
     *
     * @param leafs leafs as arrays of bytes
     */
    public MerkleTree(List<byte[]> leafs) {
        this(leafs.toArray(new byte[leafs.size()][]));
    }

    /**
     * Get root hash of the tree.
     *
     * @return root hash
     */
    public byte[] rootHash() {
        return this.root.clone();
    }

    /**
     * Get a proof for a leaf with specified index.
     *
     * @param index leaf index
     * @return leaf proof
     * @throws IllegalArgumentException if the tree hasn't a leaf with this index
     */
    public byte[] proofByLeafIndex(int index) throws IllegalArgumentException {
        if (index < 0 || index >= hashes.size()) throw new IllegalArgumentException("No leaf with index " + index);
        return proofs.get(index).clone();
    }

    /**
     * Get a proof for a leaf with specified hash.
     *
     * @param hash leaf blake2b256 hash
     * @return leaf proof
     * @throws IllegalArgumentException if the tree hasn't a leaf with this hash
     */
    public byte[] proofByLeafHash(byte[] hash) throws IllegalArgumentException {
        OptionalInt index = IntStream.range(0, hashes.size())
                .filter(i -> Arrays.equals(hash, hashes.get(i)))
                .findFirst();
        if (index.isPresent())
            return proofByLeafIndex(index.getAsInt());
        else
            throw new IllegalArgumentException("No leaf with hash \"" + Base58.encode(hash) + "\"");
    }

    /**
     * Get a proof for a leaf.
     *
     * @param leaf leaf bytes
     * @return leaf proof
     * @throws IllegalArgumentException if the tree hasn't the leaf
     */
    public byte[] proofByLeaf(byte[] leaf) throws IllegalArgumentException {
        return proofByLeafHash(leafHash(leaf));
    }

    /**
     * Checks that proof of a leaf is valid.
     *
     * @param proof proof
     * @param leafValue leaf bytes
     * @return true if the proof is valid for the specified leaf
     */
    public boolean isProofValid(byte[] proof, byte[] leafValue) {
        return Arrays.equals(proof, proofByLeaf(leafValue));
    }

    private int sizeWithEmpty(List list) {
        return max((int) pow(2, ceil(log(list.size()) / log(2))), 2);
    }

    private byte[] proof(byte side, byte[] hash) {
        return Bytes.concat(new byte[]{side, (byte) hash.length}, hash);
    }

    private List<byte[]> initProofs(List<byte[]> leafsHashes) {
        List<byte[]> result = new ArrayList<>();
        for (int i = 0; i < leafsHashes.size(); i += 2) {
            if (i + 1 < leafsHashes.size()) {
                result.add(proof(LEFT, leafsHashes.get(i + 1)));
                result.add(proof(RIGHT, leafsHashes.get(i)));
            } else result.add(EMPTY_PROOF);
        }
        return result;
    }

    private void increaseProofs(List<byte[]> proofs, List<byte[]> nodes) {
        int ratio = sizeWithEmpty(proofs) / sizeWithEmpty(nodes);
        for (int n = 0; n < nodes.size(); n += 2) {
            for (int p = 0; p < ratio; p++) {
                int l = n * ratio + p;
                int r = (n + 1) * ratio + p;
                if (l < proofs.size()) {
                    if (n + 1 < nodes.size()) {
                        byte[] rightNode = nodes.get(n + 1);
                        proofs.set(l, Bytes.concat(proofs.get(l), proof(LEFT, rightNode)));
                        if (r < proofs.size()) {
                            byte[] leftNode = nodes.get(n);
                            proofs.set(r, Bytes.concat(proofs.get(r), proof(RIGHT, leftNode)));
                        }
                    } else {
                        proofs.set(l, Bytes.concat(proofs.get(l), EMPTY_PROOF));
                    }
                } else break;
            }
        }
    }

    private byte[] findRoot(List<byte[]> nodes) {
        final AtomicInteger counter = new AtomicInteger();
        List<List<byte[]>> nodePairs = new ArrayList<>(
                nodes.stream()
                        .collect(groupingBy(it -> counter.getAndIncrement() / 2))
                        .values());

        List<byte[]> nextNodes = nodePairs.stream().map(n ->
                fastHash(Bytes.concat(NODE, n.get(0), n.size() == 2 ? n.get(1) : EMPTY))
        ).collect(toList());

        if (nextNodes.size() == 1)
            return nextNodes.get(0);
        else {
            increaseProofs(proofs, nextNodes);
            return findRoot(nextNodes);
        }
    }

    private byte[] fastHash(byte[] source) {
        return Hash.blake(source);
    }

    private byte[] leafHash(byte[] source) {
        return fastHash(Bytes.concat(LEAF, source));
    }

}
