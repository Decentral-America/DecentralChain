package com.decentralchain.lang.v1.repl.node.http.response.model

import io.circe.{Decoder, HCursor}

private[node] case class NxtData(
    `base-target`: Long,
    `generation-signature`: ByteString
)

private[node] object NxtData {
  implicit val decoder: Decoder[NxtData] = (c: HCursor) =>
    for {
      bt <- c.downField("base-target").as[Long]
      gs <- c.downField("generation-signature").as[ByteString]
    } yield NxtData(bt, gs)
}

private[node] case class BlockInfoResponse(
    timestamp: Long,
    height: Int,
    `nxt-consensus`: NxtData,
    generator: ByteString,
    generatorPublicKey: ByteString,
    VRF: Option[ByteString]
)

private[node] object BlockInfoResponse {
  implicit val decoder: Decoder[BlockInfoResponse] = (c: HCursor) =>
    for {
      timestamp          <- c.downField("timestamp").as[Long]
      height             <- c.downField("height").as[Int]
      nxt                <- c.downField("nxt-consensus").as[NxtData]
      generator          <- c.downField("generator").as[ByteString]
      generatorPublicKey <- c.downField("generatorPublicKey").as[ByteString]
      vrf                <- c.downField("VRF").as[Option[ByteString]]
    } yield BlockInfoResponse(timestamp, height, nxt, generator, generatorPublicKey, vrf)
}
