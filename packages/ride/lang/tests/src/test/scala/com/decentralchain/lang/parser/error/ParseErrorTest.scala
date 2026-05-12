package com.decentralchain.lang.parser.error

import com.decentralchain.lang.directives.values.StdLibVersion
import com.decentralchain.lang.v1.compiler.TestCompiler
import com.decentralchain.test.PropSpec
import org.scalatest.Assertion

abstract class ParseErrorTest extends PropSpec {
  protected def assert(
      script: String,
      error: String,
      start: Int,
      end: Int,
      highlighting: String,
      version: StdLibVersion = StdLibVersion.VersionDic.all.last,
      endExpr: Boolean = true,
      onlyDApp: Boolean = false
  ): Assertion = {
    val fullError = s"$error in $start-$end"
    val expr      = if (endExpr) script + "\ntrue" else script
    TestCompiler(version).compile(script) shouldBe Left(fullError)
    if (!onlyDApp) TestCompiler(version).compileExpressionE(expr) shouldBe Left(fullError)
    script.slice(start, end) shouldBe highlighting
  }
}
