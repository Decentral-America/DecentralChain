package com.decentralchain.lang.v1.compiler

import com.decentralchain.lang.v1.compiler.Types.FINAL
import com.decentralchain.lang.v1.parser.Expressions

case class CompilationStepResultExpr(
    ctx: CompilerContext,
    expr: Terms.EXPR,
    t: FINAL,
    parseNodeExpr: Expressions.EXPR,
    errors: Iterable[CompilationError] = Iterable.empty
)
