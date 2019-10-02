package org.whispersystems.curve25519;

import org.openjdk.jmh.annotations.Benchmark;

import java.util.concurrent.TimeUnit;

public class JavaCurve25519ProviderBenchmark {
    @Benchmark
    public void measureAvgTime() throws InterruptedException {
        TimeUnit.MILLISECONDS.sleep(100);
    }
}
