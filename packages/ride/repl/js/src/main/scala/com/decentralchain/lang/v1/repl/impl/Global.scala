package com.decentralchain.lang.v1.repl.impl

import scala.scalajs.js
import scala.scalajs.js.annotation.JSGlobalScope
import scala.scalajs.js.{native, Object, Promise}

@native
@JSGlobalScope
object Global extends Object {
  def httpGet(params: js.Dynamic): Promise[js.Dynamic] = native
}
