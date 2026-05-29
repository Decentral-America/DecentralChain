package com.decentralchain.lang.v1.repl.node.http

import cats.implicits.*
import cats.{Functor, Id}
import com.decentralchain.common.state.ByteStr
import com.decentralchain.common.utils.Base58
import com.decentralchain.common.utils.EitherExt2.*
import com.decentralchain.lang.ValidationError
import com.decentralchain.lang.script.Script
import com.decentralchain.lang.v1.compiler.Terms.EVALUATED
import com.decentralchain.lang.v1.evaluator.Log
import com.decentralchain.lang.v1.repl.node.http.NodeClient.*
import com.decentralchain.lang.v1.repl.node.http.response.ImplicitMappings
import com.decentralchain.lang.v1.repl.node.http.response.model.*
import com.decentralchain.lang.v1.repl.node.http.response.model.Transaction.*
import com.decentralchain.lang.v1.traits.Environment.{BalanceDetails, InputEntity}
import com.decentralchain.lang.v1.traits.domain.Recipient.{Address, Alias}
import com.decentralchain.lang.v1.traits.domain.{BlockInfo, Recipient, ScriptAssetInfo, Tx}
import com.decentralchain.lang.v1.traits.{DataType, Environment}
import io.circe.{Decoder, HCursor}
import monix.eval.Coeval

import scala.concurrent.{ExecutionContext, Future}

//noinspection NotImplementedCode
private[repl] case class WebEnvironment(settings: NodeConnectionSettings, client: NodeClient)
    extends Environment[Future] {
  import WebEnvironment.executionContext

  private val mappings = ImplicitMappings(settings.chainId)
  import mappings.*

  override implicit def chainId: Byte   = settings.chainId
  override def tthis: Environment.Tthis = Address(ByteStr.decodeBase58(settings.address).get)

  override def height: Future[Long] =
    getEntity[Id, HeightResponse, Long]("/blocks/height")

  override def transferTransactionById(id: Array[Byte]): Future[Option[Tx.Transfer]] = {
    given ec: ExecutionContext = executionContext
    getEntity[Option, TransferTransaction, Option[Tx.Transfer]](
      s"/transactions/info/${Base58.encode(id)}?bodyBytes=true"
    ).map(_.flatten)
  }

  override def transactionHeightById(id: Array[Byte]): Future[Option[Long]] = {
    given ec: ExecutionContext = executionContext
    getEntity[Option, HeightResponse, Option[Long]](s"/transactions/info/${Base58.encode(id)}").map(_.flatten)
  }

  override def assetInfoById(id: Array[Byte]): Future[Option[ScriptAssetInfo]] =
    getEntity[Option, AssetInfoResponse, ScriptAssetInfo](s"/assets/details/${Base58.encode(id)}")

  override def lastBlockOpt(): Future[Option[BlockInfo]] = {
    given ec: ExecutionContext = executionContext
    height.flatMap(h => blockInfoByHeight(h.toInt))
  }

  override def blockInfoByHeight(height: Int): Future[Option[BlockInfo]] =
    getEntity[Option, BlockInfoResponse, BlockInfo](s"/blocks/at/$height")

  override def data(recipient: Recipient, key: String, dataType: DataType): Future[Option[Any]] = {
    given ec: ExecutionContext = executionContext
    for {
      address <- extractAddress(recipient)
      entity  <- getEntity[Option, DataEntry, DataEntry](s"/addresses/data/$address/$key")
      filteredResult = entity.filter(_.`type` == dataType).map(_.value)
    } yield filteredResult
  }

  override def hasData(recipient: Recipient): Future[Boolean] = Future.failed(new Exception("Not implemented"))

  override def resolveAlias(name: String): Future[Either[String, Address]] =
    getEntity[[X] =>> Either[String, X], AddressResponse, Address](s"/alias/by-alias/$name")

  override def accountBalanceOf(
      recipient: Recipient,
      assetId: Option[Array[Byte]]
  ): Future[Either[String, Long]] = {
    given ec: ExecutionContext = executionContext
    for {
      address <- extractAddress(recipient)
      entity  <- getEntity[[X] =>> Either[String, X], BalanceResponse, Long](assetId match {
        case Some(assetId) => s"/assets/balance/$address/${Base58.encode(assetId)}"
        case None          => s"/address/balance/$address"
      })
    } yield entity
  }

  override def accountDccBalanceOf(
      recipient: Recipient
  ): Future[Either[String, Environment.BalanceDetails]] = {
    given ec: ExecutionContext = executionContext
    for {
      address <- extractAddress(recipient)
      entity  <- getEntity[[X] =>> Either[String, X], Environment.BalanceDetails, Environment.BalanceDetails](
        s"/addresses/balance/details/$address"
      )
    } yield entity
  }

  private def extractAddress(addressOrAlias: Recipient): Future[String] = {
    given ec: ExecutionContext = executionContext
    addressOrAlias match {
      case Address(bytes) => Future.successful(bytes.toString)
      case Alias(name)    => resolveAlias(name).map(_.explicitGet().bytes.toString)
    }
  }

  override def addressFromString(address: String): Either[String, Address] =
    mappings.addressFromString(address)

  override def addressFromPublicKey(publicKey: ByteStr): Either[String, Address] =
    mappings.addressFromPublicKey(publicKey)

  override def inputEntity: InputEntity                             = ???
  override def transactionById(id: Array[Byte]): Future[Option[Tx]] = ???
  override def multiPaymentAllowed: Boolean                         = ???
  override def txId: ByteStr                                        = ???

  override def transferTransactionFromProto(b: Array[Byte]): Future[Option[Tx.Transfer]] = ???

  private given Decoder[BalanceDetails] = WebEnvironment.BalanceDetailsDecoder

  private def getEntity[F[_], A, B](url: String)(using
      functor: Functor[F],
      wrapper: ResponseWrapper[F],
      decoder: Decoder[A],
      ev: A => B
  ): Future[F[B]] = {
    given ec: ExecutionContext = executionContext
    client.get[F, A](url).map(functor.map(_)(ev))
  }

  override def accountScript(addressOrAlias: Recipient): Future[Option[Script]] = ???

  override def calculateDelay(generator: ByteStr, balance: Long): Long = ???

  override def callScript(
      dApp: Address,
      func: String,
      args: List[EVALUATED],
      payments: Seq[(Option[Array[Byte]], Long)],
      availableComplexity: Int,
      reentrant: Boolean
  ): Coeval[Future[(Either[ValidationError, (EVALUATED, Log[Future])], Int)]] = ???
}

object WebEnvironment {
  implicit val executionContext: ExecutionContext = com.decentralchain.lang.v1.repl.JsCompat.executionContext

  implicit val BalanceDetailsDecoder: Decoder[BalanceDetails] = (c: HCursor) =>
    for {
      available  <- c.downField("available").as[Long]
      regular    <- c.downField("regular").as[Long]
      generating <- c.downField("generating").as[Long]
      effective  <- c.downField("effective").as[Long]
    } yield BalanceDetails(available, regular, generating, effective)

}
