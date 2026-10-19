package com.decentralchain.lang.evaluator.math

import com.decentralchain.lang.directives.values.V3
import com.decentralchain.lang.evaluator.EvaluatorSpec
import com.decentralchain.test.produce

class LongOverflowMessageTest extends EvaluatorSpec {
  private val max = Long.MaxValue

  // node-scala c80c4d1c39: once the JIT is hot, Math.addExact/subtractExact/multiplyExact may
  // throw HotSpot's preallocated ArithmeticException with a null message, and the RIDE error text
  // flipped from "long overflow" to "java.lang.ArithmeticException" depending on JIT state.
  property("+ - * overflow always reports 'long overflow', also after the JIT is hot") {
    val exprs   = Seq(s"$max + 1", s"(0 - $max) - 2", s"$max * 2")
    val results = (1 to 10000).flatMap(_ => exprs.map(e => eval(e)(using V3, checkNext = false))).distinct
    results.foreach(_ should produce("long overflow"))
  }
}
