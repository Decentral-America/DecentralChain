package com.decentralchain.crypto

import org.bouncycastle.crypto.digests.KeccakDigest

object Keccak256 extends BCDigest(() => new KeccakDigest(256), 32)
