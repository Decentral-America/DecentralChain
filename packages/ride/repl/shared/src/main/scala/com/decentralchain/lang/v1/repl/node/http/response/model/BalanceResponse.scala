package com.decentralchain.lang.v1.repl.node.http.response.model

import io.circe.{Decoder, HCursor}

private[node] case class BalanceResponse(balance: Long)

private[node] object BalanceResponse {
  implicit val decoder: Decoder[BalanceResponse] = (c: HCursor) =>
    for {
      balance <- c.downField("balance").as[Long]
    } yield BalanceResponse(balance)
}
