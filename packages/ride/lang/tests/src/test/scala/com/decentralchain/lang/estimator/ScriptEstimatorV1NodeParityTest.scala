package com.decentralchain.lang.estimator

import com.decentralchain.lang.v1.compiler.Terms.*
import com.decentralchain.lang.v1.estimator.ScriptEstimatorV1
import com.decentralchain.test.PropSpec

// node-scala 86ea1c5af2: estimator V1 must handle every EVALUATED constant and failed
// declarations/expressions instead of throwing NotImplementedError.
class ScriptEstimatorV1NodeParityTest extends PropSpec {
  property("V1 costs every evaluated constant at 1, including CONST_BIGINT") {
    ScriptEstimatorV1(Set.empty, Map.empty, CONST_BIGINT(BigInt(1))) shouldBe Right(1L)
  }

  property("V1 costs failed expressions and failed declarations at 0") {
    ScriptEstimatorV1(Set.empty, Map.empty, FAILED_EXPR()) shouldBe Right(0L)
    ScriptEstimatorV1(Set.empty, Map.empty, BLOCK(FAILED_DEC(), TRUE)) shouldBe Right(0L)
  }
}
