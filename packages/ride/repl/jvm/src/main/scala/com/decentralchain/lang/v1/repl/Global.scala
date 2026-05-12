package com.decentralchain.lang.v1.repl

import com.decentralchain.lang.SttpClient
import com.decentralchain.lang.v1.repl.node.http.response.model.NodeResponse

import scala.concurrent.Future

object Global {
  private val client = new SttpClient()

  def requestNode(url: String): Future[NodeResponse] = client.requestNode(url)
}
