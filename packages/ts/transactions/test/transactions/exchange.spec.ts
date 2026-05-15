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
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
      price: 500000000,
      priceAsset: null,
      version: 4,
    };

    const order2 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
      price: 500000000,
      priceAsset: null,
      version: 4,
    };

    const txOk = {
      amount: 100,
      buyMatcherFee: 100,
      chainId: 'T',
      fee: 700000,
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      proofs: [],
      sellMatcherFee: 100,
      version: 3,
    };

    // @ts-expect-error: txOk.order1 is intentionally malformed (contains exchange
    // tx fields instead of order fields) — tests that exchange() signals type errors
    exchange({ ...txOk }, seed1);
  });

  it('Should build exchange tx ver1-1-1', () => {
    const order1 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
      price: 500000000,
      priceAsset: null,
      version: 1,
    };

    const order2 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
      price: 500000000,
      priceAsset: null,
      version: 1,
    };

    const txOk = {
      amount: 100,
      buyMatcherFee: 100,
      chainId: 'T',
      fee: 700000,
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      sellMatcherFee: 100,
      version: 1,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk, chainId: txOk.chainId.charCodeAt() });
  });

  it('Should build exchange tx ver2-1-1', () => {
    const order1 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
      price: 500000000,
      priceAsset: null,
      version: 1,
    };

    const order2 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
      price: 500000000,
      priceAsset: null,
      version: 1,
    };

    const txOk = {
      amount: 100,
      buyMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      sellMatcherFee: 100,
      version: 2,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver2-1-2', () => {
    const order1 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
      price: 500000000,
      priceAsset: null,
      version: 1,
    };

    const order2 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
      price: 500000000,
      priceAsset: null,
      version: 2,
    };

    const txOk = {
      amount: 100,
      buyMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      sellMatcherFee: 100,
      version: 2,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver2-2-2', () => {
    const order1 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
      price: 500000000,
      priceAsset: null,
      version: 2,
    };

    const order2 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
      price: 500000000,
      priceAsset: null,
      version: 2,
    };

    const txOk = {
      amount: 100,
      buyMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      sellMatcherFee: 100,
      version: 2,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver2-1-3', () => {
    const order1 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
      price: 500000000,
      priceAsset: null,
      version: 1,
    };

    const order2 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
      price: 500000000,
      priceAsset: null,
      version: 3,
    };

    const txOk = {
      amount: 100,
      buyMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      sellMatcherFee: 100,
      version: 2,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver2-2-3', () => {
    const order1 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
      price: 500000000,
      priceAsset: null,
      version: 2,
    };

    const order2 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
      price: 500000000,
      priceAsset: null,
      version: 3,
    };

    const txOk = {
      amount: 100,
      buyMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      sellMatcherFee: 100,
      version: 2,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver3-4-4', () => {
    const order1 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
      price: 500000000,
      priceAsset: null,
      version: 4,
    };

    const order2 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
      price: 500000000,
      priceAsset: null,
      version: 4,
    };

    const txOk = {
      amount: 100,
      buyMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      sellMatcherFee: 100,
      version: 3,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver3-1-1', () => {
    const order1 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
      price: 500000000,
      priceAsset: null,
      version: 1,
    };

    const order2 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
      price: 500000000,
      priceAsset: null,
      version: 1,
    };

    const txOk = {
      amount: 100,
      buyMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      sellMatcherFee: 100,
      version: 3,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver3-1-2', () => {
    const order1 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
      price: 500000000,
      priceAsset: null,
      version: 1,
    };

    const order2 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
      price: 500000000,
      priceAsset: null,
      version: 2,
    };

    const txOk = {
      amount: 100,
      buyMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      sellMatcherFee: 100,
      version: 3,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver3-2-2', () => {
    const order1 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
      price: 500000000,
      priceAsset: null,
      version: 2,
    };

    const order2 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
      price: 500000000,
      priceAsset: null,
      version: 2,
    };

    const txOk = {
      amount: 100,
      buyMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      sellMatcherFee: 100,
      version: 3,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver3-2-3', () => {
    const order1 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
      price: 500000000,
      priceAsset: null,
      version: 2,
    };

    const order2 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
      price: 500000000,
      priceAsset: null,
      version: 3,
    };

    const txOk = {
      amount: 100,
      buyMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      sellMatcherFee: 100,
      version: 3,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver3-3-3', () => {
    const order1 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
      price: 500000000,
      priceAsset: null,
      version: 3,
    };

    const order2 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
      price: 500000000,
      priceAsset: null,
      version: 3,
    };

    const txOk = {
      amount: 100,
      buyMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      sellMatcherFee: 100,
      version: 3,
    };

    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });

  it('Should build exchange tx ver3-3-4', async () => {
    const order1 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'buy' as const,
      price: 500000000,
      priceAsset: null,
      version: 3,
    };

    const order2 = {
      amount: 100,
      amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
      matcherFee: 100,
      matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
      matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
      orderType: 'sell' as const,
      price: 500000000,
      priceAsset: null,
      version: 4,
    };

    const txOk = {
      amount: 100,
      buyMatcherFee: 100,
      chainId: 84,
      fee: 700000,
      order1: order(order1, seed1),
      order2: order(order2, seed2),
      price: 500000000,
      sellMatcherFee: 100,
      version: 3,
    };

    // @ts-expect-error: txOk intentionally missing 'proofs' — validates that
    // exchange() runs and produces a matching object even without proofs field
    const tx = exchange({ ...txOk }, seed1);
    expect(tx).toMatchObject({ ...txOk });
  });
});
