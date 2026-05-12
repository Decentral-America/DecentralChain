package com.decentralchain.lang.evaluator.tuple

import com.decentralchain.lang.directives.values.{StdLibVersion, V6}
import com.decentralchain.lang.evaluator.EvaluatorSpec
import com.decentralchain.lang.v1.ContractLimits
import com.decentralchain.lang.v1.compiler.Terms.CONST_LONG

class TupleSizeTest extends EvaluatorSpec {
  implicit val startVersion: StdLibVersion = V6

  property("tuple size") {
    (ContractLimits.MinTupleSize to ContractLimits.MaxTupleSize)
      .foreach(size => eval(s"(${(1 to size).mkString(",")}).size()") shouldBe Right(CONST_LONG(size)))
  }
}
