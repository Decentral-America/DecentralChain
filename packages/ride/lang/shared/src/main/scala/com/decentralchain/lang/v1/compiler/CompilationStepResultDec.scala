package com.decentralchain.lang.v1.compiler

import com.decentralchain.lang.v1.compiler.Types.FINAL
import com.decentralchain.lang.v1.parser.Expressions

case class CompilationStepResultDec(
    ctx: CompilerContext,
    dec: Terms.DECLARATION,
    t: FINAL,
    parseNodeExpr: Expressions.Declaration,
    errors: Iterable[CompilationError] = Iterable.empty
)
