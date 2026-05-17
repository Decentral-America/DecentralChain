package com.decentralchain.lang.compiler

import cats.implicits.toBifunctorOps
import com.decentralchain.lang.contract.DApp
import com.decentralchain.lang.directives.{Directive, DirectiveParser}
import com.decentralchain.lang.utils
import com.decentralchain.lang.v1.compiler.{CompilationError, ContractCompiler}
import com.decentralchain.lang.v1.parser.Expressions
import com.decentralchain.lang.v1.parser.Parser.LibrariesOffset.NoLibraries
import com.decentralchain.test.PropSpec

class ContractCompilerWithParserV2Test extends PropSpec {

  def compile(
      script: String,
      saveExprContext: Boolean = false
  ): Either[String, (Option[DApp], Expressions.DAPP, Iterable[CompilationError])] = {

    val result = for {
      directives <- DirectiveParser(script)
      ds         <- Directive.extractDirectives(directives)
      ctx = utils.compilerContext(ds)
      compResult <- ContractCompiler
        .compileWithParseResult(script, NoLibraries, ctx, ds.stdLibVersion, saveExprContext)
        .leftMap(_._1)
    } yield compResult

    result
  }

  property("simple test 2") {
    val script = """
                   |{-# STDLIB_VERSION 3 #-}
                   |{-# SCRIPT_TYPE ACCOUNT #-}
                   |{-# CONTENT_TYPE DAPP #-}
                   |
                   |@Callable(inv)
                   |func default() = {
                   |  [ IntegerEntry("x", inv.payment.extract().amount) ]
                   |}
                   |
                   |""".stripMargin

    val result = compile(script)

    result shouldBe Symbol("right")
  }
}
