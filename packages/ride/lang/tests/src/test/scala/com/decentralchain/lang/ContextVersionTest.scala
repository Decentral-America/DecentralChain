package com.decentralchain.lang

import com.decentralchain.lang.directives.values.*
import com.decentralchain.lang.v1.evaluator.ctx.impl.waves.Types
import com.decentralchain.test.FreeSpec

class ContextVersionTest extends FreeSpec {

  "InvokeScriptTransaction" - {
    "exist in lib version 3" in {
      val types = Types.buildWavesTypes(true, V3)
      types.count(c => c.name == "InvokeScriptTransaction") shouldEqual 1
    }

    "doesn't exist in lib version 2" in {
      val types = Types.buildWavesTypes(true, V2)
      types.count(c => c.name == "InvokeScriptTransaction") shouldEqual 0
    }
  }
}
