package com.decentralchain.lang.v1.repl.node.http.response.model

import io.circe.{Decoder, HCursor}

private[node] case class AddressResponse(address: ByteString)

private[node] object AddressResponse {
  implicit val decoder: Decoder[AddressResponse] = (c: HCursor) =>
    for {
      address <- c.downField("address").as[ByteString]
    } yield AddressResponse(address)
}
