export const issueTx = {
  type: 3,
  version: 2,
  decimals: 8,
  reissuable: false,
  fee: 100000000,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421434,
  chainId: 87,
  proofs:
    ['TVMCuJAb52AqLZnJHsZoWhjmULk27hzbzy7n3LsrwivdsCQ6gQpn8TtVwYuYhAZVcCLkbm4yznGCgrV96spafcp'],
  id: '3TZ1AWMeVskdy96rNo9AiyegimGyDyXr55MbDTQX4ZXM',
  quantity: 10000,
  name: 'test',
  description: 'tratata',
  script: 'base64:AQQAAAAHJG1hdGNoMAUAAAACdHgDCQAAAQAAAAIFAAAAByRtYXRjaDACAAAAD0J1cm5UcmFuc2FjdGlvbgQAAAABdAUAAAAHJG1hdGNoMAcGPmRSDA=='
}

export const transferTx = {
  type: 4,
  version: 2,
  fee: 100000,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421461,
  proofs:
    ['22J76sGhLRo3S5pkqGjCi9fijpEeGGRmnv7canxeon2n2MNx1HhvKaBz2gYTdpJQohmUusRKR3yoCAHptRnJ1Fwe'],
  id: 'EG3WvPWWEU5DdJ7xfB3Y5TRJNzMpt6urgKoP7docipvW',
  recipient: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
  amount: 10000,
  attachment: ''
}

export const reissueTx = {
  type: 5,
  version: 2,
  chainId: 87,
  fee: 100000000,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421477,
  proofs:
    ['mJ3F7io67rPTqQ6ATvcqNVau7CUvunB6iucxX5LcYJuxWkmoWnY59Yo4NtmCn53v5KhuhJVAZ9eqaznFCvJ1s1E'],
  id: '3b5sU6YiYS1B3NrSR3der4hwxN4nqc6xpmNPiKXgeAhm',
  assetId: 'HWrQzacRTf3iWYpcRXdCGd6vF9VU5fL6Psy1ypfJYoM6',
  quantity: 10000,
  reissuable: false
}

export const burnTx = {
  type: 6,
  version: 2,
  chainId: 87,
  fee: 100000,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421523,
  proofs:
    ['3JYfajBS1KJFSu3cdkF3f3JpH9kGVPR1R1YEgV7LHCHJyQXa82k7SMu9rqwpMvAqCXoQeJa5rEQPF9NY9rnufUan'],
  id: '6X7Fe82PcVeU9qMtscBA2fBzrSf96PtAwrynViR3zRjP',
  assetId: 'HWrQzacRTf3iWYpcRXdCGd6vF9VU5fL6Psy1ypfJYoM6',
  quantity: 10000
}

export const leaseTx = {
  type: 8,
  version: 2,
  fee: 100000,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421538,
  proofs:
    ['26qYvpvh4fedfwbDB93VJDjhUsPQiHqnZuveFr5UtBpAwnStPjS95MgA92c72SRJdU3mPsHJc6SQAraVsu2SPMRc'],
  id: '5xhvoX9caefDAiiRgUzZQSUHyKfjW5Wx2v2Vr8QR9e4d',
  recipient: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
  amount: 10000
}

export const exchangeTxV0 = {
  "type": 7,
  "id": "EKcZxn3aL2bxRCtwaps6C1cFLmvrKraatRd7a32DuQWn",
  "sender": "3PJaDyprvekvPXPuAtxrapacuDJopgJRaU3",
  "senderPublicKey": "7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy",
  "fee": 300000,
  "timestamp": 1534164407812,
  "signature": "p6zQ8xDnD9VpxW83shqevxFor3mynHGakfwU3EgWz1CJpV2K3PbhLQeaEE3gsVQFo3W4XjmgEDDmJDVhgddKHx3",
  "order1": {
    "id": "3JyBBBYpkocXzVmoXNbvtzKe611iCdgPkbv7Zntiwq1U",
    "sender": "3P5gZCoxgjb9Twwe9qwHMyq8QMBXEQ26XKm",
    "senderPublicKey": "8SiRTwwpXsms52XCDYUPJx9qaUK5cLonvjtrKB51k6Xd",
    "matcherPublicKey": "7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy",
    "assetPair": {
      "amountAsset": "B1u2TBpTYHWCuMuKLnbQfLvdLJ3zjgPiy3iMS2TSYugZ",
      "priceAsset": "Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck"
    },
    "orderType": "buy",
    "price": 144300,
    "amount": 24000684,
    "timestamp": 1534150214000,
    "expiration": 1534236614000,
    "matcherFee": 300000,
    "signature": "XUTCpGgGP2vQBdfRtTCAorW7hEwet1rpJjydTSneKgTzTfx4H477pbmKNcKkPw1rtt3Qaa3KTKZj77kr8dpvtLF"
  },
  "order2": {
    "id": "GHNi7oxRFAonHUDidupMTNRsCz2A7e3LyHRWW6L6cRxf",
    "sender": "3P5gZCoxgjb9Twwe9qwHMyq8QMBXEQ26XKm",
    "senderPublicKey": "8SiRTwwpXsms52XCDYUPJx9qaUK5cLonvjtrKB51k6Xd",
    "matcherPublicKey": "7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy",
    "assetPair": {
      "amountAsset": "B1u2TBpTYHWCuMuKLnbQfLvdLJ3zjgPiy3iMS2TSYugZ",
      "priceAsset": "Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck"
    },
    "orderType": "sell",
    "price": 144300,
    "amount": 9500884,
    "timestamp": 1534164407000,
    "expiration": 1534250807000,
    "matcherFee": 300000,
    "signature": "Q6dwZPfghTF7T3Q1pwHpRwF4Mro4CdygnZjQr8rDSKfYph1rnQR3yoA3pXNytw4wTVBCeqPqapP17WMFr5nee5D"
  },
  "price": 144300,
  "amount": 2000802,
  "buyMatcherFee": 25009,
  "sellMatcherFee": 63177
}

export const cancelLeaseTx = {
  type: 9,
  version: 2,
  fee: 100000,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421556,
  chainId: 87,
  proofs:
    ['5yytwFhmSJhPoRViBKt8AjYkBLxHYxgrs9mSPs3khT4iFLzqbkyyAYu7qbPsJ4iut8BKFFADX2J6hfVwxNFkHTjo'],
  id: '656pBWMAPfVMu1gbSZ5dd5WTRQzWNo2phfJsD2rDBKfh',
  leaseId: '5xhvoX9caefDAiiRgUzZQSUHyKfjW5Wx2v2Vr8QR9e4d'
}

export const aliasTx = {
  type: 10,
  version: 2,
  fee: 100000,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421565,
  id: '1bVuFdMbDAk6dhcQFfJFxpDjmm8DdFnnKesQ3wpxj7P',
  proofs:
    ['5cW1Ej6wFRK1XpMm3daCWjiSXaKGYfL7bmspZjzATXrNYjRVxZJQVJsDU7ZVcxNXcKJ39fhjxv3rSu4ovPT3Fau8'],
  alias: 'MyTestAlias'
}

export const massTransferTx = {
  type: 11,
  version: 1,
  fee: 200000,
  assetId: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421576,
  proofs:
    ['2Un2WpTiFBdhhh7nXd99ci3gAqonuz4xBkWrDS1MJ5fUo9AW12aiYXi3KvnRrmt3C7HqE3BrokzAnYAckd3ggu7D'],
  id: '7mEAv8DgVgo9xgg4nSMNBeFjuKUsnnqanQgqFw2VEKmG',
  transfers: [
    {recipient: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1', amount: 10000},
    {recipient: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1', amount: 10000}
  ],
  attachment: 'aAaABbbBB43CcccffrrRRxxVVggFFrrEEwwZZyyYY22335511224422LL'
}

export const dataTx = {
  type: 12,
  version: 1,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  fee: 100000,
  timestamp: 1542539421605,
  proofs:
    ['5AMn7DEwZ6VvDLkJNdP5EW1PPJQKeWjy8qp5HoCGWaWWEPYdr1Ewkqor6NfLPDrGQdHd5DFUoE7CtwSrfAUMKLAY'],
  id: 'F7fkrYuJAsJfJRucwty7dcBoMS95xBufxBi7AXqCFgXg',
  data: [
    {type: 'binary', key: 'aspen', value: 'base64:AQIDBA=='},
    {type: 'binary', key: 'brittany', value: 'base64:YXNkYQ=='},
    {type: 'boolean', key: 'charlie', value: true},
    {type: 'integer', key: 'douglas', value: 1000}
  ]
}

export const setScriptTx = {
  type: 13,
  version: 1,
  fee: 1000000,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421635,
  chainId: 87,
  proofs:
    ['35x1Rphm1mr24ELJgpLP6dK3wMW7cG6nWsFUcMF3RvxKr3UjEuo4NfYnQf6MEanD7bxBdKDuYxbBJZYQQ495ax3w'],
  id: 'J8SBGZzSLybdsgpFjDNxVwB8mixkZoEJkgHya3EiXXPc',
  script: 'base64:AQQAAAALYWxpY2VQdWJLZXkBAAAAID3+K0HJI42oXrHhtHFpHijU5PC4nn1fIFVsJp5UWrYABAAAAAlib2JQdWJLZXkBAAAAIBO1uieokBahePoeVqt4/usbhaXRq+i5EvtfsdBILNtuBAAAAAxjb29wZXJQdWJLZXkBAAAAIOfM/qkwkfi4pdngdn18n5yxNwCrBOBC3ihWaFg4gV4yBAAAAAthbGljZVNpZ25lZAMJAAH0AAAAAwgFAAAAAnR4AAAACWJvZHlCeXRlcwkAAZEAAAACCAUAAAACdHgAAAAGcHJvb2ZzAAAAAAAAAAAABQAAAAthbGljZVB1YktleQAAAAAAAAAAAQAAAAAAAAAAAAQAAAAJYm9iU2lnbmVkAwkAAfQAAAADCAUAAAACdHgAAAAJYm9keUJ5dGVzCQABkQAAAAIIBQAAAAJ0eAAAAAZwcm9vZnMAAAAAAAAAAAEFAAAACWJvYlB1YktleQAAAAAAAAAAAQAAAAAAAAAAAAQAAAAMY29vcGVyU2lnbmVkAwkAAfQAAAADCAUAAAACdHgAAAAJYm9keUJ5dGVzCQABkQAAAAIIBQAAAAJ0eAAAAAZwcm9vZnMAAAAAAAAAAAIFAAAADGNvb3BlclB1YktleQAAAAAAAAAAAQAAAAAAAAAAAAkAAGcAAAACCQAAZAAAAAIJAABkAAAAAgUAAAALYWxpY2VTaWduZWQFAAAACWJvYlNpZ25lZAUAAAAMY29vcGVyU2lnbmVkAAAAAAAAAAACVateHg=='
}

export const sponsorshipTx = {
  type: 14,
  id: "CwHecsEjYemKR7wqRkgkZxGrb5UEfD8yvZpFF5wXm2Su",
  assetId: "A8c7MKNWJwbGmoVnuXd8aiDH9xLXxa8jLvzjx6syXGYf",
  sender: "3FjTpAg1VbmxSH39YWnfFukAUhxMqmKqTEZ",
  senderPublicKey: "5AzfA9UfpWVYiwFwvdr77k6LWupSTGLb14b24oVdEpMM",
  minSponsoredAssetFee: 100000, // minimum amount of assets require for fee, set equal to null to cancel sponsorship
  fee: 100000000,
  timestamp: 1520945679531,
  proofs: ["4huvVwtbALH9W2RQSF5h1XG6PFYLA6nvcAEgv79nVLW7myCysWST6t4wsCqhLCSGoc5zeLxG6MEHpcnB6DPy3XWr"],
  version: 1,
}

export const setAssetScriptTx = {
  type: 15,
  version: 1,
  fee: 1000000,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421652,
  chainId: 87,
  proofs:
    ['4ffQFcfv9NG8GtNB5c1yamFvEFoixvgYBHPmfwSAkZeVRiCwZvB2HWWiMcbiujGhWGxXnho37bWqELnQ6DBPCaj4'],
  id: '4ERUXALAziaWJ1Acsmpnfjgtv1ixHSWXRp5dBR837o4e',
  script: 'base64:AQa3b8tH',
  assetId: '5xhvoX9caefDAiiRgUzZQSUHyKfjW5Wx2v2Vr8QR9e4d'
}

export const contractInvocationTx = {
  "type": 16,
  "id": "AujdgmwxSt8Gk9dPBDUm7mDAyc4vP1SWoVNgUHFvS9hu",
  chainId: 87,
  "senderPublicKey": "FM5ojNqW7e9cZ9zhPYGkpSP1Pcd8Z3e3MNKYVS5pGJ8Z",
  "fee": 100000,
  "timestamp": 1526910778245,
  "proofs": ["CC1jQ4qkuVfMvB2Kpg2Go6QKXJxUFC8UUswUxBsxwisrR8N5s3Yc8zA6dhjTwfWKfdouSTAnRXCxTXb3T6pJq3T"],
  "version": 1,
  "contractAddress": "3N5GRqzDBhjVXnCn44baHcz2GoZy5qLxtTh",
  "function":{
    name: "foo",
    args: [
      {
        "key": "",
        "type": "binary",
        "value": "base64:YWxpY2U="
      }
    ]
  }
}
export const order = {
  orderType: 'buy',
  assetPair:
    {
      amountAsset: undefined,
      priceAsset: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS'
    },
  price: 10,
  amount: 100000000,
  timestamp: 1544102345137,
  expiration: 1545830345137,
  matcherFee: 300000,
  matcherPublicKey: '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy',
  senderPublicKey: 'G62H1XE5rnaCgCCURV5pWwQHzWezZB7VkkVgqthdKgkj',
  proofs:
    ['eebXEov2fRr3Bqr1iXtUcAJ8qZsUMomKpU6qbb3eETqTzZtkBR5UmQ7Jda23jXwrufEusgR1eoKDGQgBD2UGLQ6'],
  id: '2gP6g5z5fYQ7NoLZXEDijxymFQBToDSJDPm6UyNZ2H2R'
}

export const exampleTxs = {
  3: issueTx,
  4: transferTx,
  5: reissueTx,
  6: burnTx,
  7: exchangeTxV0,
  8: leaseTx,
  9: cancelLeaseTx,
  10: aliasTx,
  11: massTransferTx,
  12: dataTx,
  13: setScriptTx,
  14: sponsorshipTx,
  15: setAssetScriptTx,
  16: contractInvocationTx
}


