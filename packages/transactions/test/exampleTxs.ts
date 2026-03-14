const issueTx = {
  chainId: 63,
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
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421434,
  type: 3,
  version: 2,
};

const transferTx = {
  amount: 10000,
  fee: 100000,
  id: 'EG3WvPWWEU5DdJ7xfB3Y5TRJNzMpt6urgKoP7docipvW',
  proofs: [
    '22J76sGhLRo3S5pkqGjCi9fijpEeGGRmnv7canxeon2n2MNx1HhvKaBz2gYTdpJQohmUusRKR3yoCAHptRnJ1Fwe',
  ],
  recipient: 'alias:T:aaaa',
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421461,
  type: 4,
  version: 2,
};

const reissueTx = {
  assetId: 'DWgwcZTMhSvnyYCoWLRUXXSH1RSkzThXLJhww9gwkqdn',
  chainId: 76,
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
  amount: '9223372036854775807',
  assetId: 'DWgwcZTMhSvnyYCoWLRUXXSH1RSkzThXLJhww9gwkqdn',
  chainId: 76,
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
  fee: '9223372036854775807',
  id: '5xhvoX9caefDAiiRgUzZQSUHyKfjW5Wx2v2Vr8QR9e4d',
  proofs: [
    '26qYvpvh4fedfwbDB93VJDjhUsPQiHqnZuveFr5UtBpAwnStPjS95MgA92c72SRJdU3mPsHJc6SQAraVsu2SPMRc',
  ],
  recipient: 'alias:T:sssss',
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421538,
  type: 8,
  version: 2,
};

const cancelLeaseTx = {
  chainId: 76,
  fee: 100000,
  id: '656pBWMAPfVMu1gbSZ5dd5WTRQzWNo2phfJsD2rDBKfh',
  leaseId: '656pBWMAPfVMu1gbSZ5dd5WTRQzWNo2phfJsD2rDBKfh',
  proofs: [
    '5yytwFhmSJhPoRViBKt8AjYkBLxHYxgrs9mSPs3khT4iFLzqbkyyAYu7qbPsJ4iut8BKFFADX2J6hfVwxNFkHTjo',
  ],
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421556,
  type: 9,
  version: 2,
};

const aliasTx = {
  alias: 'my_test_alias',
  fee: '9223372036854775807',
  id: '1bVuFdMbDAk6dhcQFfJFxpDjmm8DdFnnKesQ3wpxj7P',
  proofs: [
    '5cW1Ej6wFRK1XpMm3daCWjiSXaKGYfL7bmspZjzATXrNYjRVxZJQVJsDU7ZVcxNXcKJ39fhjxv3rSu4ovPT3Fau8',
  ],
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421565,
  type: 10,
  version: 2,
};

const massTransferTx = {
  attachment: '',
  fee: '9223372036854775807',
  id: '2X1VMPJT6itAqRaXYQeuq4WdD1qnATozaPTcxgU6FFio',
  proofs: [
    'niDFstiQBoVkFjFjZYDDw4pfCe8DNtpY4ua4xFPC7sPbd7yk5jmTvqPEkhZiFTMhVJgVUtYqMPW6iXVZzdXUAZq',
  ],
  senderPublicKey: 'Athtgb7Zm9V6ExyAzAJM1mP57qNAW1A76TmzXdDZDjbt',
  timestamp: 1625757161139,
  transfers: [
    { amount: '9223372036854775807', recipient: '3N7wzmTodKbMPr5ghpGHjQSZn9CVjrtbnfr' },
    { amount: 10000, recipient: 'alias:T:_rich-account.with@30_symbols_' },
  ],
  type: 11,
  version: 1,
};

const dataTx = {
  data: [
    { key: 'someparam', type: 'binary', value: 'base64:AQIDBA==' },
    { key: 'someparam2', type: 'binary', value: 'base64:YXNkYQ==' },
    { key: 'someparam3', type: 'boolean', value: true },
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
  chainId: 76,
  fee: 1000000,
  id: 'J8SBGZzSLybdsgpFjDNxVwB8mixkZoEJkgHya3EiXXPc',
  proofs: [
    '35x1Rphm1mr24ELJgpLP6dK3wMW7cG6nWsFUcMF3RvxKr3UjEuo4NfYnQf6MEanD7bxBdKDuYxbBJZYQQ495ax3w',
  ],
  script: 'base64:AQa3b8tH',
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421635,
  type: 13,
  version: 1,
};

const setAssetScriptTx = {
  assetId: 'Cei6h7evZcdR5qdbdjAABWdnuyHrp43Yb6MxN6ZViqFR',
  chainId: 76,
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
        type: 'string',
        value: '1256',
      },
    ],
    function: 'bet',
  },
  chainId: 76,
  dApp: '3P8M8XGF2uzDazV5fzdKNxrbC3YqCWScKxw',
  fee: 500000,
  id: 'E1fPNBHLTRrd1k1iZbnxjc2CjTcwYpuoBf5rBAVB6TMN',
  payment: [
    {
      amount: 100500000,
      assetId: null,
    },
  ],
  // 'feeAssetId': null,
  proofs: [
    '3rq5gJ7q1zMmn41eAiUM9ThLCEQgHfK1fk2DvCefWHZWDWdxHi1T5Xmd5UuT33FZiw46FJDy2sokhzLduoC7izbj',
  ],
  senderPublicKey: 'JE7VAUzZC4ZzkFMjbjxYmTNDULkXJEAxtqqG4DnimgVW',
  timestamp: 1573141438273,
  type: 16,
  version: 1,
};
export const exampleTxs = {
  3: issueTx,
  4: transferTx,
  5: reissueTx,
  6: burnTx,
  8: leaseTx,
  9: cancelLeaseTx,
  10: aliasTx,
  11: massTransferTx,
  12: dataTx,
  13: setScriptTx,
  15: setAssetScriptTx,
  16: invokeScriptTx,
};
