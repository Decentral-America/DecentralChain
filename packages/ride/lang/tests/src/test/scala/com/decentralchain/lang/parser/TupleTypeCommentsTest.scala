package com.decentralchain.lang.parser

import com.decentralchain.common.utils.EitherExt2.*
import com.decentralchain.lang.directives.values.*
import com.decentralchain.lang.utils.getDecompilerContext
import com.decentralchain.lang.v1.compiler.{Decompiler, TestCompiler}
import com.decentralchain.test.PropSpec

class TupleTypeCommentsTest extends PropSpec {
  property("allowed comments between definitions of tuple types") {
    val expr = TestCompiler(V6)
      .compile(
        """
          | func f(
          |   a: (                # comment
          |                       # comment
          |     Int,              # comment
          |                       # comment
          |     String,           # comment
          |                       # comment
          |     (                 # comment
          |                       # comment
          |       List[(          # comment
          |                       # comment
          |         List[String], # comment
          |                       # comment
          |         (             # comment
          |                       # comment
          |           Address,    # comment
          |                       # comment
          |           Boolean     # comment
          |                       # comment
          |         )             # comment
          |                       # comment
          |       )],             # comment
          |                       # comment
          |       Int             # comment
          |                       # comment
          |     )                 # comment
          |   )                   # comment
          | ) = []
        """.stripMargin
      )
      .explicitGet()
    Decompiler(expr, getDecompilerContext(V6, DApp)).trim shouldBe "func f (a) = nil"
  }
}
