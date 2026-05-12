package com.decentralchain.lang.parser

import com.decentralchain.common.utils.EitherExt2.*
import com.decentralchain.lang.directives.values.V6
import com.decentralchain.lang.evaluator.EvaluatorSpec
import com.decentralchain.lang.v1.compiler.Terms.CONST_LONG

class MultiLineOperatorTest extends EvaluatorSpec {
  property("number with '-' sign after number inside let definition") {
    eval(
      s"""
         |  let a = {
         |    let b = 1000
         |    -1000
         |  }
         |  a
      """.stripMargin
    )(using V6).explicitGet() shouldBe CONST_LONG(-1000)
  }

  property("number with '+' sign after number inside let definition") {
    eval(
      s"""
         |  let a = {
         |    let b = 1000
         |    +1000
         |  }
         |  a
      """.stripMargin
    )(using V6).explicitGet() shouldBe CONST_LONG(1000)
  }

  property("multiline sub") {
    eval(
      s"""
         |  let a = {
         |    let b = 1000
         |    - 1000
         |    - 500
         |    b
         |  }
         |  a
      """.stripMargin
    )(using V6).explicitGet() shouldBe CONST_LONG(-500)
  }

  property("multiline sum") {
    eval(
      s"""
         |  let a = {
         |    let b = 1000
         |    + 1000
         |    + 500
         |    b
         |  }
         |  a
      """.stripMargin
    )(using V6).explicitGet() shouldBe CONST_LONG(2500)
  }

  property("'+' and '-' with whitespaces") {
    eval(
      s"""
         |  let a = {
         |    let b = 1 + 1
         |    let c = 1 - 1
         |    b + c
         |  }
         |  a
      """.stripMargin
    )(using V6).explicitGet() shouldBe CONST_LONG(2)
  }

  property("'+' and '-' without whitespaces") {
    eval(
      s"""
         |  let a = {
         |    let b = 1+1
         |    let c = 1-1
         |    b+c
         |  }
         |  a
      """.stripMargin
    )(using V6).explicitGet() shouldBe CONST_LONG(2)
  }
}
