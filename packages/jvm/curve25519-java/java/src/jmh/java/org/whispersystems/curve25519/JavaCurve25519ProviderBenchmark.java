package org.whispersystems.curve25519;

import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.infra.Blackhole;

import java.util.concurrent.TimeUnit;

@OutputTimeUnit(TimeUnit.MICROSECONDS)
@BenchmarkMode(Mode.AverageTime)
@Threads(4)
@Fork(1)
@Warmup(iterations = 5)
@Measurement(iterations = 5)
public class JavaCurve25519ProviderBenchmark {
    @State(Scope.Thread)
    public static class BenchmarkState {
        public JavaCurve25519Provider provider = new JavaCurve25519Provider();
        public byte[] privateKey = provider.generatePrivateKey();
        public byte[] publicKey = provider.generatePublicKey(privateKey);
        public byte[] notSoRandom = new byte[]{
                0, 21, 123, 15, 23, 35, 25, 35, 21, 4, 12, 52, 62, 12, 7, 124, 16, 78, 37, 123, 56, 73, 1, 6, 8, 9, 23, 52, 35, 5, 2, 53,
                0, 21, 123, 15, 23, 35, 25, 35, 21, 4, 12, 52, 62, 12, 7, 124, 16, 78, 37, 123, 56, 73, 1, 6, 8, 9, 23, 52, 35, 5, 2, 53
        };
        public byte[] message = new byte[]{0, 1, 2, 3, 4, 5, 6};
        public byte[] signature = provider.calculateSignature(notSoRandom, privateKey, message);
        public byte[] vrfSignature = provider.calculateVrfSignature(notSoRandom, privateKey, message);
    }

    @Benchmark
    public void generatePrivateKey(Blackhole blackhole, BenchmarkState bs) {
        blackhole.consume(bs.provider.generatePrivateKey());
    }

    @Benchmark
    public void generatePrivateKeyWithRandom(Blackhole blackhole, BenchmarkState bs) {
        blackhole.consume(bs.provider.generatePrivateKey(bs.notSoRandom));
    }

    @Benchmark
    public void generatePublicKey(Blackhole blackhole, BenchmarkState bs) {
        blackhole.consume(bs.provider.generatePublicKey(bs.privateKey));
    }

    @Benchmark
    public void calculateSignature(Blackhole blackhole, BenchmarkState bs) {
        blackhole.consume(bs.provider.calculateSignature(bs.notSoRandom, bs.privateKey, bs.message));
    }

    @Benchmark
    public void verifySignature(Blackhole blackhole, BenchmarkState bs) {
        blackhole.consume(bs.provider.verifySignature(bs.publicKey, bs.message, bs.signature));
    }

    @Benchmark
    public void calculateVRFSignature(Blackhole blackhole, BenchmarkState bs) {
        blackhole.consume(bs.provider.calculateVrfSignature(bs.notSoRandom, bs.privateKey, bs.message));
    }

    @Benchmark
    public void verifyVrfSignature(Blackhole blackhole, BenchmarkState bs) throws VrfSignatureVerificationFailedException {
        blackhole.consume(bs.provider.verifyVrfSignature(bs.publicKey, bs.message, bs.vrfSignature));
    }
}
