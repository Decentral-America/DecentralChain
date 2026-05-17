package com.decentralchain.lang.v1.repl.node.http.response.model

import io.circe.{Decoder, HCursor}

private[node] case class AssetInfoResponse(
    assetId: ByteString,
    name: String,
    description: String,
    quantity: Long,
    decimals: Int,
    issuer: ByteString,
    issuerPublicKey: ByteString,
    reissuable: Boolean,
    scripted: Boolean,
    minSponsoredAssetFee: Option[Long]
)

private[node] object AssetInfoResponse {
  implicit val decoder: Decoder[AssetInfoResponse] = (c: HCursor) =>
    for {
      assetId              <- c.downField("assetId").as[ByteString]
      name                 <- c.downField("name").as[String]
      description          <- c.downField("description").as[String]
      quantity             <- c.downField("quantity").as[Long]
      decimals             <- c.downField("decimals").as[Int]
      issuer               <- c.downField("issuer").as[ByteString]
      issuerPublicKey      <- c.downField("issuerPublicKey").as[ByteString]
      reissuable           <- c.downField("reissuable").as[Boolean]
      scripted             <- c.downField("scripted").as[Boolean]
      minSponsoredAssetFee <- c.downField("minSponsoredAssetFee").as[Option[Long]]
    } yield AssetInfoResponse(
      assetId,
      name,
      description,
      quantity,
      decimals,
      issuer,
      issuerPublicKey,
      reissuable,
      scripted,
      minSponsoredAssetFee
    )
}
