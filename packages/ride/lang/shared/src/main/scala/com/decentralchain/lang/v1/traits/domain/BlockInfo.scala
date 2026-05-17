package com.decentralchain.lang.v1.traits.domain
import com.decentralchain.common.state.ByteStr
import com.decentralchain.lang.v1.traits.domain.Recipient.Address

case class BlockInfo(
    timestamp: Long,
    height: Int,
    baseTarget: Long,
    generationSignature: ByteStr,
    generator: ByteStr,
    generatorPublicKey: ByteStr,
    vrf: Option[ByteStr],
    rewards: Seq[(Address, Long)]
)
