package com.decentralchain.lang.directives.values

import com.decentralchain.lang.directives.*

abstract class DirectiveValue(val text: String, val id: Int) {
  protected def resolveKey[V](implicit k: DirectiveKey { type Value = V }) = k
  def key: DirectiveKey

  lazy val unparsed: String = s"${DirectiveParser.start} ${key.text} $text ${DirectiveParser.end}"
  val value: Any
}
