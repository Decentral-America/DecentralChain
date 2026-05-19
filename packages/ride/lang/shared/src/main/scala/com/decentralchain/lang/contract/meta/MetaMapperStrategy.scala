package com.decentralchain.lang.contract.meta

import com.decentralchain.lang.v1.compiler.Types.FINAL
import io.decentralchain.protobuf.dapp.DAppMeta

private[meta] trait MetaMapperStrategy[V <: MetaVersion] {
  def toProto(data: List[List[FINAL]], nameMap: Map[String, String] = Map.empty): Either[String, DAppMeta]
  def fromProto(meta: DAppMeta): Either[String, List[List[FINAL]]]
}
