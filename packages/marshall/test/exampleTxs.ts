const issueTx = {
  chainId: 76, // DecentralChain mainnet 'L'
  decimals: 8,
  description: 'tratata',
  fee: 100000000,
  id: '3TZ1AWMeVskdy96rNo9AiyegimGyDyXr55MbDTQX4ZXM',
  name: 'test',
  proofs: [
    'TVMCuJAb52AqLZnJHsZoWhjmULk27hzbzy7n3LsrwivdsCQ6gQpn8TtVwYuYhAZVcCLkbm4yznGCgrV96spafcp',
  ],
  quantity: 10000,
  reissuable: false,
  script:
    'base64:AQQAAAAHJG1hdGNoMAUAAAACdHgDCQAAAQAAAAIFAAAAByRtYXRjaDACAAAAD0J1cm5UcmFuc2FjdGlvbgQAAAABdAUAAAAHJG1hdGNoMAcGPmRSDA==',
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421434,
  type: 3,
  version: 2,
};

const transferTx = {
  amount: 10000,
  attachment: '',
  fee: 100000,
  id: 'EG3WvPWWEU5DdJ7xfB3Y5TRJNzMpt6urgKoP7docipvW',
  proofs: [
    '22J76sGhLRo3S5pkqGjCi9fijpEeGGRmnv7canxeon2n2MNx1HhvKaBz2gYTdpJQohmUusRKR3yoCAHptRnJ1Fwe',
  ],
  recipient: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421461,
  type: 4,
  version: 2,
};

const reissueTx = {
  assetId: 'HWrQzacRTf3iWYpcRXdCGd6vF9VU5fL6Psy1ypfJYoM6',
  chainId: 76, // DecentralChain mainnet 'L'
  fee: 100000000,
  id: '3b5sU6YiYS1B3NrSR3der4hwxN4nqc6xpmNPiKXgeAhm',
  proofs: [
    'mJ3F7io67rPTqQ6ATvcqNVau7CUvunB6iucxX5LcYJuxWkmoWnY59Yo4NtmCn53v5KhuhJVAZ9eqaznFCvJ1s1E',
  ],
  quantity: 10000,
  reissuable: false,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421477,
  type: 5,
  version: 2,
};

const burnTx = {
  amount: 10000,
  assetId: 'HWrQzacRTf3iWYpcRXdCGd6vF9VU5fL6Psy1ypfJYoM6',
  chainId: 76, // DecentralChain mainnet 'L'
  fee: 100000,
  id: '6X7Fe82PcVeU9qMtscBA2fBzrSf96PtAwrynViR3zRjP',
  proofs: [
    '3JYfajBS1KJFSu3cdkF3f3JpH9kGVPR1R1YEgV7LHCHJyQXa82k7SMu9rqwpMvAqCXoQeJa5rEQPF9NY9rnufUan',
  ],
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421523,
  type: 6,
  version: 2,
};

const leaseTx = {
  amount: 10000,
  fee: 100000,
  id: '5xhvoX9caefDAiiRgUzZQSUHyKfjW5Wx2v2Vr8QR9e4d',
  proofs: [
    '26qYvpvh4fedfwbDB93VJDjhUsPQiHqnZuveFr5UtBpAwnStPjS95MgA92c72SRJdU3mPsHJc6SQAraVsu2SPMRc',
  ],
  recipient: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421538,
  type: 8,
  version: 2,
};

const exchangeTxV1 = {
  amount: 49816000,
  buyMatcherFee: 12146,
  // "sender": "3PJaDyprvekvPXPuAtxrapacuDJopgJRaU3",
  // "senderPublicKey": "7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy",
  fee: 300000,
  id: '2yJZ6Uf6i3RnYdk268WkdJyUR3up9bUxjad1jrTCAiCr',
  //"version": 1,
  order1: {
    amount: 1230364480,
    assetPair: { amountAsset: '474jTeYx2r2Va35794tCScAXWJG9hU2HcgxzMowaZUnu', priceAsset: null },
    expiration: 1512161837685,
    matcherFee: 300000,
    matcherPublicKey: '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy',
    orderType: 'buy',
    price: 8971734818,
    //"version": 1,
    //"id": "HFe1UL2xF9q7T1vcxhSk5h6L53sQcM9eevvjtASe1Szs",
    //"sender": "3PMajJ6WC4XR3RMr4raWainaKQpfRZLGHsV",
    senderPublicKey: '3FQtBZWd2PYSRyehzDNEr1YQC29Vd5pCYqiN4nRhnxQK',
    signature:
      '4kh4HmFLCJnJuUfoCFir6G8GSiUcogVpMFEmUjpqutXqhpKFu5ECzxqQ3Kd1TxvtSN5aG35M76nrfvP7bt7UQ1k1',
    timestamp: 1512075437685,
    //"proofs": ["4kh4HmFLCJnJuUfoCFir6G8GSiUcogVpMFEmUjpqutXqhpKFu5ECzxqQ3Kd1TxvtSN5aG35M76nrfvP7bt7UQ1k1"]
  },
  order2: {
    amount: 49816000,
    assetPair: { amountAsset: '474jTeYx2r2Va35794tCScAXWJG9hU2HcgxzMowaZUnu', priceAsset: null },
    expiration: 1513803546319,
    matcherFee: 300000,
    matcherPublicKey: '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy',
    orderType: 'sell',
    price: 8971734818,
    //"version": 1,
    //"id": "EBxTpRwrRPpSgEaH1Lco8B9wZwXYbxUHfggP1tPiSEfW",
    // "sender": "3P5XQcyuAs3Fs4FcBXUrKPSQmfY6Zvse36L",
    senderPublicKey: 'BwgywtnxBGBW53fRqa11K4KLcJkR4BMeu9o3jSB2KCGM',
    signature:
      '2pY4uNy5yHWquYLyBWPCrBiMhNNELAoFTJtWuaXkdb2nMDgDnZUx85ierKAbDtjiE5isv3jTd5udNvm7tfqrDagY',
    timestamp: 1512075546319,
    // "proofs": ["2pY4uNy5yHWquYLyBWPCrBiMhNNELAoFTJtWuaXkdb2nMDgDnZUx85ierKAbDtjiE5isv3jTd5udNvm7tfqrDagY"]
  },
  price: 8971734818,
  proofs: [
    '5CNVuHcLak6GjTWvVo3t92y1ZDKeRHdSgedHP5VTg65fC8fAN2RrxDhWNmTP3QktvSQUGi7Z3WjUtVztmHnp7Afk',
  ],
  sellMatcherFee: 300000,
  signature:
    '5CNVuHcLak6GjTWvVo3t92y1ZDKeRHdSgedHP5VTg65fC8fAN2RrxDhWNmTP3QktvSQUGi7Z3WjUtVztmHnp7Afk',
  timestamp: 1512075551784,
  type: 7,
  // "height": 774422
};
const exchangeV1BytesStr =
  '7,0,0,0,203,0,0,0,203,33,104,130,87,194,237,236,142,53,151,229,133,52,22,214,191,157,209,20,65,3,46,130,213,5,200,8,32,200,236,2,76,100,67,66,229,220,167,247,104,120,126,0,88,2,74,88,11,204,242,151,223,79,118,68,41,219,211,62,165,189,241,223,2,1,46,32,195,246,234,138,159,137,81,187,191,232,136,17,19,54,236,126,216,194,66,3,114,101,13,88,205,115,38,66,101,130,0,0,0,0,0,2,22,193,207,34,0,0,0,0,73,85,223,64,0,0,1,96,14,184,38,117,0,0,1,96,19,222,130,117,0,0,0,0,0,4,147,224,187,186,103,72,228,224,208,47,169,202,70,206,63,145,220,74,10,154,143,218,246,36,229,240,23,148,122,236,238,198,238,220,43,255,143,77,74,8,240,66,21,128,170,241,81,78,187,157,43,225,102,39,248,22,3,17,110,155,65,229,18,210,223,134,162,151,112,200,113,221,208,223,116,205,127,63,7,98,22,186,141,79,8,50,214,195,138,140,161,116,152,178,189,94,227,102,100,67,66,229,220,167,247,104,120,126,0,88,2,74,88,11,204,242,151,223,79,118,68,41,219,211,62,165,189,241,223,2,1,46,32,195,246,234,138,159,137,81,187,191,232,136,17,19,54,236,126,216,194,66,3,114,101,13,88,205,115,38,66,101,130,0,1,0,0,0,2,22,193,207,34,0,0,0,0,2,248,33,192,0,0,1,96,14,185,206,207,0,0,1,96,117,184,254,207,0,0,0,0,0,4,147,224,91,2,138,239,237,138,164,98,237,219,161,223,52,228,94,148,1,132,138,51,119,190,121,124,21,38,144,34,211,222,79,8,201,12,10,118,144,19,91,237,185,1,159,33,155,42,6,240,38,5,115,61,80,232,107,4,35,104,100,110,137,240,1,137,0,0,0,2,22,193,207,34,0,0,0,0,2,248,33,192,0,0,0,0,0,0,47,114,0,0,0,0,0,4,147,224,0,0,0,0,0,4,147,224,0,0,1,96,14,185,228,40';
const exchangeTxV2 = {
  amount: 2,
  buyMatcherFee: 1,
  //"senderPublicKey": "Fvk5DXmfyWVZqQVBowUBMwYtRAHDtdyZNNeRrwSjt6KP", // exchange tx gets senderPublicKey from Order
  fee: 1,
  id: '5KUDbPKjAoNHTMyae9zJZpFjYFAbeSQMQ9rzgkDEEUx6',
  order1: {
    amount: 2,
    assetPair: { amountAsset: null, priceAsset: '9ZDWzK53XT5bixkmMwTJi2YzgxCqn5dUajXFcT2HcFDy' },
    expiration: 1529584336241,
    matcherFee: 1,
    matcherPublicKey: 'Fvk5DXmfyWVZqQVBowUBMwYtRAHDtdyZNNeRrwSjt6KP',
    orderType: 'buy',
    price: 6000000000,
    //"signature": "2bkuGwECMFGyFqgoHV4q7GRRWBqYmBFWpYRkzgYANR4nN2twgrNaouRiZBqiK2RJzuo9NooB9iRiuZ4hypBbUQs",
    proofs: [
      '2bkuGwECMFGyFqgoHV4q7GRRWBqYmBFWpYRkzgYANR4nN2twgrNaouRiZBqiK2RJzuo9NooB9iRiuZ4hypBbUQs',
    ],
    // "id": "EcndU4vU3SJ58KZAXJPKACvMhijTzgRjLTsuWxSWaQUK",
    // "sender": "3MthkhReCHXeaPZcWXcT3fa6ey1XWptLtwj",
    senderPublicKey: 'BqeJY8CP3PeUDaByz57iRekVUGtLxoow4XxPvXfHynaZ',
    timestamp: 1526992336241,
    version: 2,
  },
  order2: {
    amount: 3,
    assetPair: { amountAsset: null, priceAsset: '9ZDWzK53XT5bixkmMwTJi2YzgxCqn5dUajXFcT2HcFDy' },
    expiration: 1529584336241,
    matcherFee: 2,
    matcherPublicKey: 'Fvk5DXmfyWVZqQVBowUBMwYtRAHDtdyZNNeRrwSjt6KP',
    orderType: 'sell',
    price: 5000000000,
    //"version": 1,
    // "id": "DS9HPBGRMJcquTb3sAGAJzi73jjMnFFSWWHfzzKK32Q7",
    //"sender": "3MswjKzUBKCD6i1w4vCosQSbC8XzzdBx1mG",
    senderPublicKey: '7E9Za8v8aT6EyU1sX91CVK7tWUeAetnNYDxzKZsyjyKV',
    signature:
      '2R6JfmNjEnbXAA6nt8YuCzSf1effDS4Wkz8owpCD9BdCNn864SnambTuwgLRYzzeP5CAsKHEviYKAJ2157vdr5Zq',
    timestamp: 1526992336241,
    //"proofs": ["2R6JfmNjEnbXAA6nt8YuCzSf1effDS4Wkz8owpCD9BdCNn864SnambTuwgLRYzzeP5CAsKHEviYKAJ2157vdr5Zq"]
  },
  price: 5000000000,
  proofs: [
    '5NxNhjMrrH5EWjSFnVnPbanpThic6fnNL48APVAkwq19y2FpQp4tNSqoAZgboC2ykUfqQs9suwBQj6wERmsWWNqa',
  ],
  sellMatcherFee: 1,
  sender: '3N22UCTvst8N1i1XDvGHzyqdgmZgwDKbp44',
  timestamp: 1526992336241,
  type: 7,
  version: 2,
};

const exchangeV2BytesStr =
  '0,7,2,0,0,0,209,2,161,10,237,14,203,169,142,130,92,154,126,238,202,86,118,94,22,127,191,0,125,129,37,195,151,38,180,155,237,38,122,110,221,200,26,48,21,185,128,98,143,32,77,48,195,225,64,6,38,71,29,233,46,130,113,2,34,146,244,139,17,118,103,22,0,1,127,30,59,255,0,111,253,127,128,253,177,160,244,0,135,101,250,255,44,128,128,255,1,255,1,127,128,127,255,255,1,0,0,0,0,0,1,101,160,188,0,0,0,0,0,0,0,0,2,0,0,1,99,135,213,245,113,0,0,1,100,34,84,189,113,0,0,0,0,0,0,0,1,1,0,1,0,64,1,97,15,60,53,183,125,237,112,176,114,5,46,105,91,186,159,100,87,62,196,252,24,218,17,118,201,46,27,46,229,45,43,36,124,145,118,13,56,31,202,63,174,20,141,50,48,136,97,60,6,223,29,73,85,36,251,90,210,93,62,74,57,132,0,0,0,203,1,92,132,90,73,47,4,66,220,36,54,210,252,111,248,17,53,234,43,3,3,253,233,92,115,168,252,187,138,3,16,79,96,221,200,26,48,21,185,128,98,143,32,77,48,195,225,64,6,38,71,29,233,46,130,113,2,34,146,244,139,17,118,103,22,0,1,127,30,59,255,0,111,253,127,128,253,177,160,244,0,135,101,250,255,44,128,128,255,1,255,1,127,128,127,255,255,1,0,1,0,0,0,1,42,5,242,0,0,0,0,0,0,0,0,3,0,0,1,99,135,213,245,113,0,0,1,100,34,84,189,113,0,0,0,0,0,0,0,2,70,202,229,24,87,204,14,18,182,30,201,4,115,25,125,155,97,200,220,187,248,2,56,8,183,197,147,152,133,128,136,64,75,110,49,72,225,212,121,180,158,34,214,183,51,58,211,254,32,251,165,114,84,123,25,90,158,227,67,170,73,230,35,136,0,0,0,1,42,5,242,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1,99,135,213,245,113';

const cancelLeaseTx = {
  chainId: 76, // DecentralChain mainnet 'L'
  fee: 100000,
  id: '656pBWMAPfVMu1gbSZ5dd5WTRQzWNo2phfJsD2rDBKfh',
  leaseId: '5xhvoX9caefDAiiRgUzZQSUHyKfjW5Wx2v2Vr8QR9e4d',
  proofs: [
    '5yytwFhmSJhPoRViBKt8AjYkBLxHYxgrs9mSPs3khT4iFLzqbkyyAYu7qbPsJ4iut8BKFFADX2J6hfVwxNFkHTjo',
  ],
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421556,
  type: 9,
  version: 2,
};

const aliasTx = {
  alias: 'myalias',
  chainId: 84,
  fee: 100000,
  id: '7acjQQWJAharrgzb4Z6jo3eeAKAGPmLkHTPtvBTKaiug',
  proofs: [
    '26U7rQTwpdma5GYSZb5bNygVCtSuWL6DKet1Nauf5J57v19mmfnq434YrkKYJqvYt2ydQBUT3P7Xgj5ZVDVAcc5k',
  ],
  sender: '3N5GRqzDBhjVXnCn44baHcz2GoZy5qLxtTh',
  senderPublicKey: 'FM5ojNqW7e9cZ9zhPYGkpSP1Pcd8Z3e3MNKYVS5pGJ8Z',
  timestamp: 1526910778245,
  type: 10,
  version: 2,
};

const aliasV2BytesStr =
  '10,2,213,40,170,190,195,92,161,0,216,124,123,122,18,134,50,250,241,156,212,69,49,129,148,87,68,81,19,163,42,33,239,34,0,11,2,84,0,7,109,121,97,108,105,97,115,0,0,0,0,0,1,134,160,0,0,1,99,130,249,123,133';

const massTransferTx = {
  assetId: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  attachment: 'aAaABbbBB43CcccffrrRRxxVVggFFrrEEwwZZyyYY22335511224422LL',
  fee: 200000,
  id: '7mEAv8DgVgo9xgg4nSMNBeFjuKUsnnqanQgqFw2VEKmG',
  proofs: [
    '2Un2WpTiFBdhhh7nXd99ci3gAqonuz4xBkWrDS1MJ5fUo9AW12aiYXi3KvnRrmt3C7HqE3BrokzAnYAckd3ggu7D',
  ],
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421576,
  transfers: [
    { amount: 10000, recipient: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1' },
    { amount: 10000, recipient: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1' },
  ],
  type: 11,
  version: 1,
};

const dataTx = {
  data: [
    { key: 'aspen', type: 'binary', value: 'base64:AQIDBA==' },
    { key: 'brittany', type: 'binary', value: 'base64:YXNkYQ==' },
    { key: 'charlie', type: 'boolean', value: true },
    { key: 'douglas', type: 'integer', value: 1000 },
  ],
  fee: 100000,
  id: 'F7fkrYuJAsJfJRucwty7dcBoMS95xBufxBi7AXqCFgXg',
  proofs: [
    '5AMn7DEwZ6VvDLkJNdP5EW1PPJQKeWjy8qp5HoCGWaWWEPYdr1Ewkqor6NfLPDrGQdHd5DFUoE7CtwSrfAUMKLAY',
  ],
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421605,
  type: 12,
  version: 1,
};

const setScriptTx = {
  chainId: 76, // DecentralChain mainnet 'L'
  fee: 1000000,
  id: 'J8SBGZzSLybdsgpFjDNxVwB8mixkZoEJkgHya3EiXXPc',
  proofs: [
    '35x1Rphm1mr24ELJgpLP6dK3wMW7cG6nWsFUcMF3RvxKr3UjEuo4NfYnQf6MEanD7bxBdKDuYxbBJZYQQ495ax3w',
  ],
  script:
    'base64:AQQAAAALYWxpY2VQdWJLZXkBAAAAID3+K0HJI42oXrHhtHFpHijU5PC4nn1fIFVsJp5UWrYABAAAAAlib2JQdWJLZXkBAAAAIBO1uieokBahePoeVqt4/usbhaXRq+i5EvtfsdBILNtuBAAAAAxjb29wZXJQdWJLZXkBAAAAIOfM/qkwkfi4pdngdn18n5yxNwCrBOBC3ihWaFg4gV4yBAAAAAthbGljZVNpZ25lZAMJAAH0AAAAAwgFAAAAAnR4AAAACWJvZHlCeXRlcwkAAZEAAAACCAUAAAACdHgAAAAGcHJvb2ZzAAAAAAAAAAAABQAAAAthbGljZVB1YktleQAAAAAAAAAAAQAAAAAAAAAAAAQAAAAJYm9iU2lnbmVkAwkAAfQAAAADCAUAAAACdHgAAAAJYm9keUJ5dGVzCQABkQAAAAIIBQAAAAJ0eAAAAAZwcm9vZnMAAAAAAAAAAAEFAAAACWJvYlB1YktleQAAAAAAAAAAAQAAAAAAAAAAAAQAAAAMY29vcGVyU2lnbmVkAwkAAfQAAAADCAUAAAACdHgAAAAJYm9keUJ5dGVzCQABkQAAAAIIBQAAAAJ0eAAAAAZwcm9vZnMAAAAAAAAAAAIFAAAADGNvb3BlclB1YktleQAAAAAAAAAAAQAAAAAAAAAAAAkAAGcAAAACCQAAZAAAAAIJAABkAAAAAgUAAAALYWxpY2VTaWduZWQFAAAACWJvYlNpZ25lZAUAAAAMY29vcGVyU2lnbmVkAAAAAAAAAAACVateHg==',
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421635,
  type: 13,
  version: 1,
};

const sponsorshipTx = {
  assetId: 'A8c7MKNWJwbGmoVnuXd8aiDH9xLXxa8jLvzjx6syXGYf',
  fee: 100000000,
  id: 'CwHecsEjYemKR7wqRkgkZxGrb5UEfD8yvZpFF5wXm2Su',
  minSponsoredAssetFee: 100000, // minimum amount of assets require for fee, set equal to null to cancel sponsorship
  proofs: [
    '4huvVwtbALH9W2RQSF5h1XG6PFYLA6nvcAEgv79nVLW7myCysWST6t4wsCqhLCSGoc5zeLxG6MEHpcnB6DPy3XWr',
  ],
  sender: '3FjTpAg1VbmxSH39YWnfFukAUhxMqmKqTEZ',
  senderPublicKey: '5AzfA9UfpWVYiwFwvdr77k6LWupSTGLb14b24oVdEpMM',
  timestamp: 1520945679531,
  type: 14,
  version: 1,
};

const setAssetScriptTx = {
  assetId: '5xhvoX9caefDAiiRgUzZQSUHyKfjW5Wx2v2Vr8QR9e4d',
  chainId: 76, // DecentralChain mainnet 'L'
  fee: 1000000,
  id: '4ERUXALAziaWJ1Acsmpnfjgtv1ixHSWXRp5dBR837o4e',
  proofs: [
    '4ffQFcfv9NG8GtNB5c1yamFvEFoixvgYBHPmfwSAkZeVRiCwZvB2HWWiMcbiujGhWGxXnho37bWqELnQ6DBPCaj4',
  ],
  script: 'base64:AQa3b8tH',
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421652,
  type: 15,
  version: 1,
};

const invokeScriptTx = {
  call: {
    args: [
      {
        type: 'binary',
        value: 'base64:YWxpY2U=',
      },
      { type: 'integer', value: 600000000 },
      { type: 'boolean', value: false },
      { type: 'boolean', value: true },
      {
        type: 'list',
        value: [
          {
            type: 'boolean',
            value: true,
          },
          {
            type: 'boolean',
            value: false,
          },
          {
            type: 'binary',
            value: 'base64:YWFhYWFhYWFhYWFhYWFhYQ==',
          },
          {
            type: 'integer',
            value: 5000,
          },
          {
            type: 'string',
            value: 'aaaaaaaaaaaaaaaa',
          },
        ],
      },
    ],
    function: 'foo',
  },
  chainId: 68,
  dApp: '3Fb641A9hWy63K18KsBJwns64McmdEATgJd',
  fee: 100000,
  id: '71TVxNGMwkkH5Q5MjfFun2DxxxTu7SK1GCbQGr2o1UqL',
  payment: [
    {
      amount: 7,
      assetId: '73pu8pHFNpj9tmWuYjqnZ962tXzJvLGX86dxjZxGYhoK',
    },
  ],
  proofs: [
    '2vsHvu18goy1AsoADEYFM26eYEtAtVHRh9TLmMhPtUjwBfDmsySaLFExXwnBinZiCrKnUfVDiGTWuW57jUhiz9Ex',
  ],
  senderPublicKey: 'DguumUPw2zHh91WpaGWMsGvkJY1gFKJhjEBMBrV4NSG4',
  timestamp: 1545307831159,
  type: 16,
  version: 1,
};

export const orderV0 = {
  amount: 100000000,
  assetPair: {
    amountAsset: null,
    priceAsset: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
  },
  expiration: 1545830345137,
  id: '2gP6g5z5fYQ7NoLZXEDijxymFQBToDSJDPm6UyNZ2H2R',
  matcherFee: 300000,
  matcherPublicKey: '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy',
  orderType: 'buy',
  price: 10,
  proofs: [
    'eebXEov2fRr3Bqr1iXtUcAJ8qZsUMomKpU6qbb3eETqTzZtkBR5UmQ7Jda23jXwrufEusgR1eoKDGQgBD2UGLQ6',
  ],
  senderPublicKey: 'G62H1XE5rnaCgCCURV5pWwQHzWezZB7VkkVgqthdKgkj',
  timestamp: 1544102345137,
};

export const orderV2 = {
  amount: 100000000,
  assetPair: {
    amountAsset: null,
    priceAsset: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
  },
  expiration: 1545830345137,
  id: '2gP6g5z5fYQ7NoLZXEDijxymFQBToDSJDPm6UyNZ2H2R',
  matcherFee: 300000,
  matcherPublicKey: '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy',
  orderType: 'buy',
  price: 10,
  proofs: [
    'eebXEov2fRr3Bqr1iXtUcAJ8qZsUMomKpU6qbb3eETqTzZtkBR5UmQ7Jda23jXwrufEusgR1eoKDGQgBD2UGLQ6',
  ],
  senderPublicKey: 'G62H1XE5rnaCgCCURV5pWwQHzWezZB7VkkVgqthdKgkj',
  timestamp: 1544102345137,
  version: 2,
};
export const exampleTxs = {
  3: issueTx,
  4: transferTx,
  5: reissueTx,
  6: burnTx,
  7: exchangeTxV1,
  8: leaseTx,
  9: cancelLeaseTx,
  10: aliasTx,
  11: massTransferTx,
  12: dataTx,
  13: setScriptTx,
  14: sponsorshipTx,
  15: setAssetScriptTx,
  16: invokeScriptTx,
  70: exchangeTxV2,
};

export const exampleBytesStr = {
  7: exchangeV1BytesStr,
  10: aliasV2BytesStr,
  70: exchangeV2BytesStr,
};

export const exampleOrders = {
  0: orderV0,
  2: orderV2,
};
