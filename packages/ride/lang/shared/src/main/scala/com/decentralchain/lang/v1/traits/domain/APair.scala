package com.decentralchain.lang.v1.traits.domain

import com.decentralchain.common.state.ByteStr

case class APair(amountAsset: Option[ByteStr], priceAsset: Option[ByteStr])
