//const seed1 = 'alter bar cycle pioneer library eye calm soft swing motion limit taste supreme afford caution' //complex account

import { exchange, order } from '../../src';

const seed1 =
  'shoe used festival regular fancy electric powder symptom stool physical cabbage need accuse silly ring'; //plain acc

const seed2 =
  'next one puppy history bag vanish conduct lion royal dentist reject usual story invite leader';

// scripted asset: "DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK",

describe('exchange', () => {
  it('Should build exchange tx', () => {
    const order1 = {
      version: 4,
      amount: 100,
      price: 500000000,
      matcherFee: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
    };

    const order2 = {
      version: 4,
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      amount: 100,
      price: 500000000,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
    };

    const txOk = {
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      amount: 100,
      buyMatcherFee: 100,
      sellMatcherFee: 100,
      chainId: 'T',
      fee: 700000,
      version: 3,
      proofs: [],
    };

    // @ts-expect-error
    exchange({ ...txOk }, seed1);
  });

  it('Should build exchange tx ver1-1-1', () => {
    const order1 = {
      version: 1,
      amount: 100,
      price: 500000000,
      matcherFee: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
    };

    const order2 = {
      version: 1,
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      amount: 100,
      price: 500000000,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
    };

    const txOk = {
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      amount: 100,
      buyMatcherFee: 100,
      sellMatcherFee: 100,
      chainId: 'T',
      fee: 700000,
      version: 1,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk, chainId: txOk.chainId.charCodeAt() });
  });

  it('Should build exchange tx ver2-1-1', () => {
    const order1 = {
      version: 1,
      amount: 100,
      price: 500000000,
      matcherFee: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
    };

    const order2 = {
      version: 1,
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      amount: 100,
      price: 500000000,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
    };

    const txOk = {
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      amount: 100,
      buyMatcherFee: 100,
      sellMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      version: 2,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver2-1-2', () => {
    const order1 = {
      version: 1,
      amount: 100,
      price: 500000000,
      matcherFee: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
    };

    const order2 = {
      version: 2,
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      amount: 100,
      price: 500000000,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
    };

    const txOk = {
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      amount: 100,
      buyMatcherFee: 100,
      sellMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      version: 2,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver2-2-2', () => {
    const order1 = {
      version: 2,
      amount: 100,
      price: 500000000,
      matcherFee: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
    };

    const order2 = {
      version: 2,
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      amount: 100,
      price: 500000000,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
    };

    const txOk = {
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      amount: 100,
      buyMatcherFee: 100,
      sellMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      version: 2,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it.todo('Should build exchange tx ver2-1-3 — needs order V3 fixture');

  it.todo('Should build exchange tx ver2-2-3 — needs order V3 fixture');

  it('Should build exchange tx ver3-4-4', () => {
    const order1 = {
      version: 4,
      amount: 100,
      price: 500000000,
      matcherFee: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
    };

    const order2 = {
      version: 4,
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      amount: 100,
      price: 500000000,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
    };

    const txOk = {
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      amount: 100,
      buyMatcherFee: 100,
      sellMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      version: 3,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver3-1-1', () => {
    const order1 = {
      version: 1,
      amount: 100,
      price: 500000000,
      matcherFee: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
    };

    const order2 = {
      version: 1,
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      amount: 100,
      price: 500000000,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
    };

    const txOk = {
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      amount: 100,
      buyMatcherFee: 100,
      sellMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      version: 3,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver3-1-2', () => {
    const order1 = {
      version: 1,
      amount: 100,
      price: 500000000,
      matcherFee: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
    };

    const order2 = {
      version: 2,
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      amount: 100,
      price: 500000000,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
    };

    const txOk = {
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      amount: 100,
      buyMatcherFee: 100,
      sellMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      version: 3,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver3-2-2', () => {
    const order1 = {
      version: 2,
      amount: 100,
      price: 500000000,
      matcherFee: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
    };

    const order2 = {
      version: 2,
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      amount: 100,
      price: 500000000,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
    };

    const txOk = {
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      amount: 100,
      buyMatcherFee: 100,
      sellMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      version: 3,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver3-2-3', () => {
    const order1 = {
      version: 2,
      amount: 100,
      price: 500000000,
      matcherFee: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
    };

    const order2 = {
      version: 3,
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      amount: 100,
      price: 500000000,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
    };

    const txOk = {
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      amount: 100,
      buyMatcherFee: 100,
      sellMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      version: 3,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver3-3-3', () => {
    const order1 = {
      version: 3,
      amount: 100,
      price: 500000000,
      matcherFee: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
    };

    const order2 = {
      version: 3,
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      amount: 100,
      price: 500000000,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
    };

    const txOk = {
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      amount: 100,
      buyMatcherFee: 100,
      sellMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      version: 3,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver3-3-4', async () => {
    const order1 = {
      version: 3,
      amount: 100,
      price: 500000000,
      matcherFee: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
    };

    const order2 = {
      version: 4,
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      amount: 100,
      price: 500000000,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      priceAsset: null,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
    };

    const txOk = {
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      amount: 100,
      buyMatcherFee: 100,
      sellMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      version: 3,
    };

    // @ts-expect-error
    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });
});
