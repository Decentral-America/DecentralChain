package com.decentralchain.lang

import com.decentralchain.lang.v1.BaseGlobal

package object hacks {
  private[lang] val Global: BaseGlobal = com.decentralchain.lang.Global // Hack for IDEA
}
