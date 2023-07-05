import {
  base16Decode,
  base16Encode,
  base58Decode,
  base58Encode,
  base64Decode,
  base64Encode,
  createAddress,
  createPrivateKey,
  createPublicKey,
  createSharedKey,
  decryptMessage,
  decryptSeed,
  encryptMessage,
  encryptSeed,
  generateRandomSeed,
  signBytes,
  utf8Decode,
  utf8Encode,
  verifyAddress,
  verifySignature,
} from '../dist';

describe('encoding & decoding', () => {
  describe.each([
    {
      string: 'something english',
      bytes: new Uint8Array([
        115, 111, 109, 101, 116, 104, 105, 110, 103, 32, 101, 110, 103, 108,
        105, 115, 104,
      ]),
      base16: '736f6d657468696e6720656e676c697368',
      base58: '25v8uHKxJ5zhUZJLhyKroQS3',
      base64: 'c29tZXRoaW5nIGVuZ2xpc2g=',
    },
    {
      string: 'щось українське',
      bytes: new Uint8Array([
        209, 137, 208, 190, 209, 129, 209, 140, 32, 209, 131, 208, 186, 209,
        128, 208, 176, 209, 151, 208, 189, 209, 129, 209, 140, 208, 186, 208,
        181,
      ]),
      base16: 'd189d0bed181d18c20d183d0bad180d0b0d197d0bdd181d18cd0bad0b5',
      base58: 'AWimHVvsjhJ5d8LZXHLKbkgcsThQ8NShfUWkYVsA',
      base64: '0YnQvtGB0Ywg0YPQutGA0LDRl9C90YHRjNC60LU=',
    },
    {
      string: '中國的東西',
      bytes: new Uint8Array([
        228, 184, 173, 229, 156, 139, 231, 154, 132, 230, 157, 177, 232, 165,
        191,
      ]),
      base16: 'e4b8ade59c8be79a84e69db1e8a5bf',
      base58: '7Q8xRC1uiw2UKWX4xXySv',
      base64: '5Lit5ZyL55qE5p2x6KW/',
    },
    {
      string: '✅',
      bytes: new Uint8Array([226, 156, 133]),
      base16: 'e29c85',
      base58: '2K7kG',
      base64: '4pyF',
    },
    {
      string: '☸☹☺☻☼☾☿',
      bytes: new Uint8Array([
        226, 152, 184, 226, 152, 185, 226, 152, 186, 226, 152, 187, 226, 152,
        188, 226, 152, 190, 226, 152, 191,
      ]),
      base16: 'e298b8e298b9e298bae298bbe298bce298bee298bf',
      base58: 'EwADsq3xKwBfHYGtLYmr4EuNdNnQE',
      base64: '4pi44pi54pi64pi74pi84pi+4pi/',
    },
  ])('$string', ({ string, bytes, base16, base58, base64 }) => {
    test('base16', () => {
      expect(base16Encode(bytes)).toStrictEqual(base16);
      expect(base16Decode(base16)).toStrictEqual(bytes);
    });

    test('base58', () => {
      expect(base58Encode(bytes)).toStrictEqual(base58);
      expect(base58Decode(base58)).toStrictEqual(bytes);
    });

    test('base64', () => {
      expect(base64Encode(bytes)).toBe(base64);
      expect(base64Decode(base64)).toStrictEqual(bytes);
    });

    test('utf8', () => {
      expect(utf8Encode(string)).toStrictEqual(bytes);
      expect(utf8Decode(bytes)).toBe(string);
    });
  });
});

describe('createAddress', () => {
  test.each([
    {
      publicKey: new Uint8Array([
        71, 171, 120, 134, 207, 3, 175, 240, 151, 179, 245, 227, 147, 69, 189,
        129, 159, 70, 47, 40, 117, 60, 174, 102, 7, 175, 85, 3, 173, 59, 5, 79,
      ]),
      expected: new Uint8Array([
        1, 87, 237, 149, 42, 91, 83, 113, 186, 155, 5, 146, 240, 150, 46, 156,
        73, 159, 126, 132, 21, 216, 210, 186, 92, 67,
      ]),
    },
    {
      publicKey: new Uint8Array([
        37, 234, 244, 113, 249, 184, 187, 195, 158, 59, 155, 55, 157, 191, 151,
        150, 94, 155, 184, 214, 172, 227, 66, 165, 184, 87, 141, 83, 65, 26, 37,
        54,
      ]),
      expected: new Uint8Array([
        1, 87, 97, 191, 188, 228, 176, 164, 247, 10, 248, 105, 184, 156, 249,
        200, 25, 177, 181, 39, 138, 1, 67, 181, 98, 193,
      ]),
    },
    {
      chainId: 84,
      publicKey: new Uint8Array([
        37, 234, 244, 113, 249, 184, 187, 195, 158, 59, 155, 55, 157, 191, 151,
        150, 94, 155, 184, 214, 172, 227, 66, 165, 184, 87, 141, 83, 65, 26, 37,
        54,
      ]),
      expected: new Uint8Array([
        1, 84, 97, 191, 188, 228, 176, 164, 247, 10, 248, 105, 184, 156, 249,
        200, 25, 177, 181, 39, 138, 1, 73, 244, 67, 58,
      ]),
    },
  ])(
    'createAddress($publicKey, $chainId)',
    ({ chainId, publicKey, expected }) => {
      expect(createAddress(publicKey, chainId)).toStrictEqual(expected);
    },
  );
});

describe('createPrivateKey', () => {
  test.each([
    {
      seed: 'vast local exotic manage click stone boil analyst various truth swift decade cherry cram innocent',
      privateKey: new Uint8Array([
        160, 162, 70, 120, 248, 240, 249, 165, 229, 32, 117, 10, 95, 183, 85,
        101, 27, 76, 34, 74, 46, 97, 2, 221, 123, 100, 24, 3, 169, 11, 82, 103,
      ]),
    },
    {
      seed: 'side angry perfect sight capital absurd stuff pulp climb jealous onion address speed portion category',
      privateKey: new Uint8Array([
        24, 70, 183, 188, 114, 208, 233, 40, 160, 119, 83, 20, 97, 134, 163,
        155, 50, 220, 65, 224, 17, 80, 104, 201, 210, 61, 32, 55, 36, 241, 159,
        73,
      ]),
    },
    {
      seed: 'side angry perfect sight capital absurd stuff pulp climb jealous onion address speed portion category',
      nonce: 5,
      privateKey: new Uint8Array([
        24, 183, 146, 177, 182, 249, 2, 39, 209, 56, 72, 171, 220, 62, 171, 252,
        144, 211, 216, 192, 111, 143, 58, 123, 186, 26, 244, 172, 78, 167, 49,
        90,
      ]),
    },
    {
      seed: 'side angry perfect sight capital absurd stuff pulp climb jealous onion address speed portion category',
      nonce: 899123,
      privateKey: new Uint8Array([
        16, 233, 31, 109, 226, 190, 216, 41, 68, 92, 198, 52, 63, 75, 196, 144,
        236, 215, 213, 106, 64, 102, 72, 226, 84, 194, 47, 215, 244, 0, 177,
        123,
      ]),
    },
  ])('createPrivateKey($seed)', async ({ seed, nonce, privateKey }) => {
    await expect(
      createPrivateKey(utf8Encode(seed), nonce),
    ).resolves.toStrictEqual(privateKey);
  });
});

describe('createPublicKey', () => {
  test.each([
    {
      privateKey: new Uint8Array([
        160, 162, 70, 120, 248, 240, 249, 165, 229, 32, 117, 10, 95, 183, 85,
        101, 27, 76, 34, 74, 46, 97, 2, 221, 123, 100, 24, 3, 169, 11, 82, 103,
      ]),
      publicKey: new Uint8Array([
        71, 171, 120, 134, 207, 3, 175, 240, 151, 179, 245, 227, 147, 69, 189,
        129, 159, 70, 47, 40, 117, 60, 174, 102, 7, 175, 85, 3, 173, 59, 5, 79,
      ]),
    },
    {
      privateKey: new Uint8Array([
        24, 70, 183, 188, 114, 208, 233, 40, 160, 119, 83, 20, 97, 134, 163,
        155, 50, 220, 65, 224, 17, 80, 104, 201, 210, 61, 32, 55, 36, 241, 159,
        73,
      ]),
      publicKey: new Uint8Array([
        37, 234, 244, 113, 249, 184, 187, 195, 158, 59, 155, 55, 157, 191, 151,
        150, 94, 155, 184, 214, 172, 227, 66, 165, 184, 87, 141, 83, 65, 26, 37,
        54,
      ]),
    },
  ])('createPublicKey($seed)', async ({ privateKey, publicKey }) => {
    await expect(createPublicKey(privateKey)).resolves.toStrictEqual(publicKey);
  });
});

describe('createSharedKey', () => {
  test('fixed', async () => {
    const [alicePrivateKey, bobPrivateKey] = await Promise.all([
      createPrivateKey(utf8Encode('alice')),
      createPrivateKey(utf8Encode('bob')),
    ]);

    const [alicePublicKey, bobPublicKey] = await Promise.all([
      createPublicKey(alicePrivateKey),
      createPublicKey(bobPrivateKey),
    ]);

    const prefix = utf8Encode('waves');

    const sharedA = await createSharedKey(
      alicePrivateKey,
      bobPublicKey,
      prefix,
    );

    expect(sharedA).toStrictEqual(
      new Uint8Array([
        162, 119, 172, 77, 222, 66, 171, 20, 118, 107, 37, 115, 109, 17, 113,
        83, 54, 170, 225, 88, 131, 11, 248, 8, 89, 222, 157, 198, 100, 46, 125,
        5,
      ]),
    );

    await expect(
      createSharedKey(bobPrivateKey, alicePublicKey, prefix),
    ).resolves.toStrictEqual(sharedA);
  });

  test('random', async () => {
    const [aPrivateKey, bPrivateKey] = await Promise.all([
      createPrivateKey(utf8Encode(generateRandomSeed())),
      createPrivateKey(utf8Encode(generateRandomSeed())),
    ]);

    const [aPublicKey, bPublicKey] = await Promise.all([
      createPublicKey(aPrivateKey),
      createPublicKey(bPrivateKey),
    ]);

    const prefix = utf8Encode('something random');

    await expect(
      createSharedKey(bPrivateKey, aPublicKey, prefix),
    ).resolves.toStrictEqual(
      await createSharedKey(aPrivateKey, bPublicKey, prefix),
    );
  });
});

describe('encryptMessage/decryptMessage', () => {
  test('fixed', async () => {
    const [alicePrivateKey, bobPrivateKey] = await Promise.all([
      createPrivateKey(utf8Encode('alice')),
      createPrivateKey(utf8Encode('bob')),
    ]);

    const alicePublicKey = await createPublicKey(alicePrivateKey);

    const sharedKey = await createSharedKey(
      bobPrivateKey,
      alicePublicKey,
      utf8Encode('some prefix'),
    );

    await expect(
      decryptMessage(
        sharedKey,
        new Uint8Array([
          1, 70, 131, 21, 17, 230, 156, 255, 51, 12, 239, 245, 90, 237, 97, 158,
          54, 166, 88, 183, 60, 31, 35, 124, 64, 243, 48, 198, 112, 101, 59,
          219, 209, 171, 133, 127, 229, 165, 239, 128, 130, 40, 47, 15, 59, 168,
          97, 101, 61, 38, 3, 111, 130, 109, 165, 218, 190, 161, 2, 170, 200,
          248, 71, 56, 167, 84, 114, 118, 115, 143, 163, 110, 168, 25, 67, 216,
          218, 131, 123, 55, 15, 250, 107, 110, 114, 253, 242, 88, 139, 88, 173,
          181, 103, 50, 113, 185, 17, 180, 112, 234, 204, 39, 8, 244, 126, 207,
          49, 223, 165, 54, 94, 209, 178, 29, 61, 166, 218, 228, 90, 74, 70, 3,
          90, 148, 193, 29, 191, 182, 172, 16, 161, 229, 137, 215, 12, 10, 79,
          171, 49, 34, 228, 123, 160, 203,
        ]),
      ),
    ).resolves.toStrictEqual(utf8Encode('中國的東西'));
  });

  test('random', async () => {
    const [aPrivateKey, bPrivateKey] = await Promise.all([
      createPrivateKey(utf8Encode(generateRandomSeed())),
      createPrivateKey(utf8Encode(generateRandomSeed())),
    ]);

    const [aPublicKey, bPublicKey] = await Promise.all([
      createPublicKey(aPrivateKey),
      createPublicKey(bPrivateKey),
    ]);

    const prefix = utf8Encode('some prefix');

    const [aSharedKey, bSharedKey] = await Promise.all([
      createSharedKey(aPrivateKey, bPublicKey, prefix),
      createSharedKey(bPrivateKey, aPublicKey, prefix),
    ]);

    const messageBytes = utf8Encode('中國的東西');
    const encryptedMessage = await encryptMessage(aSharedKey, messageBytes);

    await expect(
      decryptMessage(bSharedKey, encryptedMessage),
    ).resolves.toStrictEqual(messageBytes);
  });
});

describe('encryptSeed/decryptSeed', () => {
  test('fixed', async () => {
    expect(
      utf8Decode(
        await decryptSeed(
          new Uint8Array([
            83, 97, 108, 116, 101, 100, 95, 95, 59, 101, 65, 239, 197, 127, 191,
            144, 31, 110, 249, 46, 194, 198, 28, 177, 124, 40, 252, 136, 133,
            69, 231, 2,
          ]),
          utf8Encode('🔑'),
        ),
      ),
    ).toBe('🙈');
  });

  test('random', async () => {
    await expect(
      decryptSeed(
        await encryptSeed(utf8Encode('🙈'), utf8Encode('🔑')),
        utf8Encode('🔑'),
      ),
    ).resolves.toStrictEqual(utf8Encode('🙈'));

    await expect(
      decryptSeed(
        await encryptSeed(utf8Encode('Exact16BytesText'), utf8Encode('🗝️')),
        utf8Encode('🗝️'),
      ),
    ).resolves.toStrictEqual(utf8Encode('Exact16BytesText'));
  });
});

test('generateRandomSeed', () => {
  expect(generateRandomSeed().split(' ')).toHaveLength(15);
  expect(generateRandomSeed(5).split(' ')).toHaveLength(5);
  expect(generateRandomSeed()).not.toStrictEqual(generateRandomSeed());
  expect(generateRandomSeed()).not.toStrictEqual(generateRandomSeed());
  expect(generateRandomSeed()).not.toStrictEqual(generateRandomSeed());
});

test('signBytes/verifySignature', async () => {
  const privateKey = await createPrivateKey(
    utf8Encode('1f98af466da54014bdc08bfbaaaf3c67'),
  );

  const publicKey = await createPublicKey(privateKey);

  const bytes = Uint8Array.from([1, 2, 3, 4]);
  const signature = await signBytes(privateKey, bytes);

  await expect(verifySignature(publicKey, bytes, signature)).resolves.toBe(
    true,
  );

  await expect(
    verifySignature(publicKey, Uint8Array.from([4, 3, 2, 1]), signature),
  ).resolves.toBe(false);
});

describe('verifyAddress', () => {
  test.each([
    {
      title: 'valid address, without options',
      bytes: new Uint8Array([
        1, 87, 195, 81, 58, 112, 28, 21, 103, 134, 161, 21, 153, 7, 211, 102,
        109, 204, 57, 139, 50, 11, 139, 198, 136, 232,
      ]),
      valid: true,
    },
    {
      title: 'invalid version',
      bytes: new Uint8Array([
        0, 87, 195, 81, 58, 112, 28, 21, 103, 134, 161, 21, 153, 7, 211, 102,
        109, 204, 57, 139, 50, 11, 139, 198, 136, 232,
      ]),
      valid: false,
    },
    {
      title: 'invalid checksum',
      bytes: new Uint8Array([
        1, 87, 195, 81, 58, 112, 28, 21, 103, 134, 161, 21, 153, 7, 211, 102,
        109, 204, 57, 139, 50, 11, 139, 198, 137, 232,
      ]),
      valid: false,
    },
    {
      title: 'with options.chainId, valid',
      bytes: new Uint8Array([
        1, 87, 195, 81, 58, 112, 28, 21, 103, 134, 161, 21, 153, 7, 211, 102,
        109, 204, 57, 139, 50, 11, 139, 198, 136, 232,
      ]),
      options: { chainId: 87 },
      valid: true,
    },
    {
      title: 'with options.chainId, invalid',
      bytes: new Uint8Array([
        1, 84, 195, 81, 58, 112, 28, 21, 103, 134, 161, 21, 153, 7, 211, 102,
        109, 204, 57, 139, 50, 11, 6, 62, 160, 181,
      ]),
      options: { chainId: 87 },
      valid: false,
    },
    {
      title: 'with options.publicKey, valid',
      bytes: new Uint8Array([
        1, 87, 195, 81, 58, 112, 28, 21, 103, 134, 161, 21, 153, 7, 211, 102,
        109, 204, 57, 139, 50, 11, 139, 198, 136, 232,
      ]),
      options: {
        publicKey: new Uint8Array([
          0, 127, 65, 111, 37, 76, 208, 87, 133, 14, 6, 41, 11, 170, 126, 45,
          147, 36, 38, 27, 52, 193, 36, 52, 78, 8, 107, 121, 118, 47, 163, 70,
        ]),
      },
      valid: true,
    },
    {
      title: 'with options.publicKey, invalid',
      bytes: new Uint8Array([
        1, 87, 195, 81, 58, 112, 28, 21, 103, 134, 161, 21, 153, 7, 211, 102,
        109, 204, 57, 139, 50, 11, 139, 198, 136, 232,
      ]),
      options: {
        publicKey: new Uint8Array([
          59, 44, 59, 214, 91, 42, 165, 187, 242, 135, 96, 228, 229, 229, 134,
          14, 150, 137, 186, 131, 67, 209, 223, 224, 7, 101, 195, 82, 132, 221,
          10, 19,
        ]),
      },
      valid: false,
    },
  ])('$title', ({ bytes, options, valid }) => {
    expect(verifyAddress(bytes, options)).toBe(valid);
  });
});
