import {
  base16Decode,
  base16Encode,
  base58Decode,
  base58Encode,
  base64Decode,
  base64Encode,
  createAddress,
  createHybridKeypair,
  createPrivateKey,
  createPublicKey,
  createSharedKey,
  decryptMessage,
  decryptSeed,
  deriveKey,
  encryptMessage,
  encryptSeed,
  generateRandomSeed,
  hybridDecapsulate,
  hybridEncapsulate,
  signBytes,
  utf8Decode,
  utf8Encode,
  verifyAddress,
  verifySignature,
} from './index.js';

describe('encoding & decoding', () => {
  describe.each([
    {
      base16: '736f6d657468696e6720656e676c697368',
      base58: '25v8uHKxJ5zhUZJLhyKroQS3',
      base64: 'c29tZXRoaW5nIGVuZ2xpc2g=',
      bytes: new Uint8Array([
        115, 111, 109, 101, 116, 104, 105, 110, 103, 32, 101, 110, 103, 108, 105, 115, 104,
      ]),
      string: 'something english',
    },
    {
      base16: 'd189d0bed181d18c20d183d0bad180d0b0d197d0bdd181d18cd0bad0b5',
      base58: 'AWimHVvsjhJ5d8LZXHLKbkgcsThQ8NShfUWkYVsA',
      base64: '0YnQvtGB0Ywg0YPQutGA0LDRl9C90YHRjNC60LU=',
      bytes: new Uint8Array([
        209, 137, 208, 190, 209, 129, 209, 140, 32, 209, 131, 208, 186, 209, 128, 208, 176, 209,
        151, 208, 189, 209, 129, 209, 140, 208, 186, 208, 181,
      ]),
      string: 'щось українське',
    },
    {
      base16: 'e4b8ade59c8be79a84e69db1e8a5bf',
      base58: '7Q8xRC1uiw2UKWX4xXySv',
      base64: '5Lit5ZyL55qE5p2x6KW/',
      bytes: new Uint8Array([
        228, 184, 173, 229, 156, 139, 231, 154, 132, 230, 157, 177, 232, 165, 191,
      ]),
      string: '中國的東西',
    },
    {
      base16: 'e29c85',
      base58: '2K7kG',
      base64: '4pyF',
      bytes: new Uint8Array([226, 156, 133]),
      string: '✅',
    },
    {
      base16: 'e298b8e298b9e298bae298bbe298bce298bee298bf',
      base58: 'EwADsq3xKwBfHYGtLYmr4EuNdNnQE',
      base64: '4pi44pi54pi64pi74pi84pi+4pi/',
      bytes: new Uint8Array([
        226, 152, 184, 226, 152, 185, 226, 152, 186, 226, 152, 187, 226, 152, 188, 226, 152, 190,
        226, 152, 191,
      ]),
      string: '☸☹☺☻☼☾☿',
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
      expected: new Uint8Array([
        1, 87, 237, 149, 42, 91, 83, 113, 186, 155, 5, 146, 240, 150, 46, 156, 73, 159, 126, 132,
        21, 216, 210, 186, 92, 67,
      ]),
      publicKey: new Uint8Array([
        71, 171, 120, 134, 207, 3, 175, 240, 151, 179, 245, 227, 147, 69, 189, 129, 159, 70, 47, 40,
        117, 60, 174, 102, 7, 175, 85, 3, 173, 59, 5, 79,
      ]),
    },
    {
      expected: new Uint8Array([
        1, 87, 97, 191, 188, 228, 176, 164, 247, 10, 248, 105, 184, 156, 249, 200, 25, 177, 181, 39,
        138, 1, 67, 181, 98, 193,
      ]),
      publicKey: new Uint8Array([
        37, 234, 244, 113, 249, 184, 187, 195, 158, 59, 155, 55, 157, 191, 151, 150, 94, 155, 184,
        214, 172, 227, 66, 165, 184, 87, 141, 83, 65, 26, 37, 54,
      ]),
    },
    {
      chainId: 84,
      expected: new Uint8Array([
        1, 84, 97, 191, 188, 228, 176, 164, 247, 10, 248, 105, 184, 156, 249, 200, 25, 177, 181, 39,
        138, 1, 73, 244, 67, 58,
      ]),
      publicKey: new Uint8Array([
        37, 234, 244, 113, 249, 184, 187, 195, 158, 59, 155, 55, 157, 191, 151, 150, 94, 155, 184,
        214, 172, 227, 66, 165, 184, 87, 141, 83, 65, 26, 37, 54,
      ]),
    },
  ])('createAddress($publicKey, $chainId)', ({ chainId, publicKey, expected }) => {
    expect(createAddress(publicKey, chainId)).toStrictEqual(expected);
  });
});

describe('createPrivateKey', () => {
  test.each([
    {
      privateKey: new Uint8Array([
        160, 162, 70, 120, 248, 240, 249, 165, 229, 32, 117, 10, 95, 183, 85, 101, 27, 76, 34, 74,
        46, 97, 2, 221, 123, 100, 24, 3, 169, 11, 82, 103,
      ]),
      seed: 'vast local exotic manage click stone boil analyst various truth swift decade cherry cram innocent',
    },
    {
      privateKey: new Uint8Array([
        24, 70, 183, 188, 114, 208, 233, 40, 160, 119, 83, 20, 97, 134, 163, 155, 50, 220, 65, 224,
        17, 80, 104, 201, 210, 61, 32, 55, 36, 241, 159, 73,
      ]),
      seed: 'side angry perfect sight capital absurd stuff pulp climb jealous onion address speed portion category',
    },
    {
      nonce: 5,
      privateKey: new Uint8Array([
        24, 183, 146, 177, 182, 249, 2, 39, 209, 56, 72, 171, 220, 62, 171, 252, 144, 211, 216, 192,
        111, 143, 58, 123, 186, 26, 244, 172, 78, 167, 49, 90,
      ]),
      seed: 'side angry perfect sight capital absurd stuff pulp climb jealous onion address speed portion category',
    },
    {
      nonce: 899123,
      privateKey: new Uint8Array([
        16, 233, 31, 109, 226, 190, 216, 41, 68, 92, 198, 52, 63, 75, 196, 144, 236, 215, 213, 106,
        64, 102, 72, 226, 84, 194, 47, 215, 244, 0, 177, 123,
      ]),
      seed: 'side angry perfect sight capital absurd stuff pulp climb jealous onion address speed portion category',
    },
  ])('createPrivateKey($seed)', async ({ seed, nonce, privateKey }) => {
    await expect(createPrivateKey(utf8Encode(seed), nonce)).resolves.toStrictEqual(privateKey);
  });
});

describe('createPublicKey', () => {
  test.each([
    {
      privateKey: new Uint8Array([
        160, 162, 70, 120, 248, 240, 249, 165, 229, 32, 117, 10, 95, 183, 85, 101, 27, 76, 34, 74,
        46, 97, 2, 221, 123, 100, 24, 3, 169, 11, 82, 103,
      ]),
      publicKey: new Uint8Array([
        71, 171, 120, 134, 207, 3, 175, 240, 151, 179, 245, 227, 147, 69, 189, 129, 159, 70, 47, 40,
        117, 60, 174, 102, 7, 175, 85, 3, 173, 59, 5, 79,
      ]),
    },
    {
      privateKey: new Uint8Array([
        24, 70, 183, 188, 114, 208, 233, 40, 160, 119, 83, 20, 97, 134, 163, 155, 50, 220, 65, 224,
        17, 80, 104, 201, 210, 61, 32, 55, 36, 241, 159, 73,
      ]),
      publicKey: new Uint8Array([
        37, 234, 244, 113, 249, 184, 187, 195, 158, 59, 155, 55, 157, 191, 151, 150, 94, 155, 184,
        214, 172, 227, 66, 165, 184, 87, 141, 83, 65, 26, 37, 54,
      ]),
    },
  ])('createPublicKey($seed)', async ({ privateKey, publicKey }) => {
    await expect(createPublicKey(privateKey)).resolves.toStrictEqual(publicKey);
  });
});

describe('createSharedKey', () => {
  // DCC-191: fixed vector was tied to HMAC-SHA256(sha256(prefix), rawShared);
  // new construction is HKDF-SHA256(rawShared, info="decentralchain").
  // The round-trip Diffie-Hellman symmetry test below is the correct invariant.

  test('symmetric', async () => {
    const [alicePrivateKey, bobPrivateKey] = await Promise.all([
      createPrivateKey(utf8Encode('alice')),
      createPrivateKey(utf8Encode('bob')),
    ]);

    const [alicePublicKey, bobPublicKey] = await Promise.all([
      createPublicKey(alicePrivateKey),
      createPublicKey(bobPrivateKey),
    ]);

    const sharedA = await createSharedKey(alicePrivateKey, bobPublicKey);

    await expect(createSharedKey(bobPrivateKey, alicePublicKey)).resolves.toStrictEqual(sharedA);
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

    await expect(createSharedKey(bPrivateKey, aPublicKey)).resolves.toStrictEqual(
      await createSharedKey(aPrivateKey, bPublicKey),
    );
  });
});

describe('encryptMessage/decryptMessage', () => {
  // No fixed-output test — XChaCha20-Poly1305 uses a random 24-byte nonce per call.
  // The AES-CTR fixed vector from the previous construction is intentionally removed.

  test('random', async () => {
    const [aPrivateKey, bPrivateKey] = await Promise.all([
      createPrivateKey(utf8Encode(generateRandomSeed())),
      createPrivateKey(utf8Encode(generateRandomSeed())),
    ]);

    const [aPublicKey, bPublicKey] = await Promise.all([
      createPublicKey(aPrivateKey),
      createPublicKey(bPrivateKey),
    ]);

    const [aSharedKey, bSharedKey] = await Promise.all([
      createSharedKey(aPrivateKey, bPublicKey),
      createSharedKey(bPrivateKey, aPublicKey),
    ]);

    const messageBytes = utf8Encode('中國的東西');
    const encryptedMessage = encryptMessage(aSharedKey, messageBytes);

    expect(decryptMessage(bSharedKey, encryptedMessage)).toStrictEqual(messageBytes);
  });

  test('tamper detection', async () => {
    const key = crypto.getRandomValues(new Uint8Array(32));
    const message = utf8Encode('test');
    const encrypted = encryptMessage(key, message);

    // Flip a byte in the ciphertext — Poly1305 must reject it
    const tampered = new Uint8Array(encrypted);
    tampered[30] ^= 0xff;
    expect(() => decryptMessage(key, tampered)).toThrow();
  });
});

describe('encryptSeed/decryptSeed', () => {
  // No fixed-output test — Argon2id+XChaCha20-Poly1305 uses random salt+nonce per call; round-trip is the correct invariant.

  test('random', async () => {
    await expect(
      decryptSeed(await encryptSeed(utf8Encode('🙈'), utf8Encode('🔑')), utf8Encode('🔑')),
    ).resolves.toStrictEqual(utf8Encode('🙈'));

    await expect(
      decryptSeed(
        await encryptSeed(utf8Encode('Exact16BytesText'), utf8Encode('🗝️')),
        utf8Encode('🗝️'),
      ),
    ).resolves.toStrictEqual(utf8Encode('Exact16BytesText'));
  });

  test('wrong password throws', async () => {
    const ciphertext = await encryptSeed(utf8Encode('secret'), utf8Encode('correct'));
    await expect(decryptSeed(ciphertext, utf8Encode('wrong'))).rejects.toThrow();
  });

  test('with pepper round-trips correctly', async () => {
    const pepper = crypto.getRandomValues(new Uint8Array(32));
    const ciphertext = await encryptSeed(utf8Encode('🌱'), utf8Encode('pw'), pepper);
    await expect(decryptSeed(ciphertext, utf8Encode('pw'), pepper)).resolves.toStrictEqual(
      utf8Encode('🌱'),
    );
  });

  test('wrong pepper throws', async () => {
    const pepper = new Uint8Array(32).fill(0xaa);
    const wrongPepper = new Uint8Array(32).fill(0xbb);
    const ciphertext = await encryptSeed(utf8Encode('seed'), utf8Encode('pw'), pepper);
    await expect(decryptSeed(ciphertext, utf8Encode('pw'), wrongPepper)).rejects.toThrow();
  });

  test('pepper vs no-pepper throws', async () => {
    const pepper = new Uint8Array(32).fill(0x01);
    const ciphertext = await encryptSeed(utf8Encode('seed'), utf8Encode('pw'), pepper);
    // Omitting pepper must fail — derives a different key
    await expect(decryptSeed(ciphertext, utf8Encode('pw'))).rejects.toThrow();
  });
});

test('generateRandomSeed', () => {
  expect(generateRandomSeed().split(' ')).toHaveLength(15);
  expect(generateRandomSeed(5).split(' ')).toHaveLength(5);
  expect(generateRandomSeed()).not.toStrictEqual(generateRandomSeed());
  expect(generateRandomSeed()).not.toStrictEqual(generateRandomSeed());
  expect(generateRandomSeed()).not.toStrictEqual(generateRandomSeed());
});

describe('deriveKey pepper', () => {
  test('with pepper produces different key than without pepper', async () => {
    const password = utf8Encode('hunter2');
    const salt = new Uint8Array(32).fill(0xab);
    const pepper = new Uint8Array(32).fill(0xcd);

    const keyNoPepper = await deriveKey(password, salt);
    const keyWithPepper = await deriveKey(password, salt, pepper);

    expect(keyWithPepper).not.toStrictEqual(keyNoPepper);
    expect(keyWithPepper).toHaveLength(32);
  });

  test('same pepper+password+salt always produces same key', async () => {
    const password = utf8Encode('stable');
    const salt = new Uint8Array(32).fill(0x11);
    const pepper = new Uint8Array(32).fill(0x22);

    const key1 = await deriveKey(password, salt, pepper);
    const key2 = await deriveKey(password, salt, pepper);

    expect(key1).toStrictEqual(key2);
  });

  test('different peppers produce different keys', async () => {
    const password = utf8Encode('p');
    const salt = new Uint8Array(32).fill(0x33);
    const pepper1 = new Uint8Array(32).fill(0x44);
    const pepper2 = new Uint8Array(32).fill(0x55);

    const key1 = await deriveKey(password, salt, pepper1);
    const key2 = await deriveKey(password, salt, pepper2);

    expect(key1).not.toStrictEqual(key2);
  });
});

describe('hybrid KEM (ML-KEM-768 + X25519 / XWing)', () => {
  test('encapsulate/decapsulate produces same shared secret (round-trip)', () => {
    const { publicKey, secretKey } = createHybridKeypair();

    const { cipherText, sharedSecret: senderShared } = hybridEncapsulate(publicKey);
    const recipientShared = hybridDecapsulate(cipherText, secretKey);

    expect(senderShared).toStrictEqual(recipientShared);
    expect(senderShared).toHaveLength(32);
  });

  test('key sizes match XWing spec (publicKey=1216B, secretKey=32B seed, cipherText=1120B)', () => {
    const { publicKey, secretKey } = createHybridKeypair();
    const { cipherText } = hybridEncapsulate(publicKey);

    expect(publicKey).toHaveLength(1216);
    // XWing uses compact 32-byte seed as secretKey — X25519 and ML-KEM-768 keys
    // are derived from this seed during decapsulation. See draft-connolly-cfrg-xwing-kem-09 §3.
    expect(secretKey).toHaveLength(32);
    expect(cipherText).toHaveLength(1120);
  });

  test('different encapsulations to same key produce different shared secrets', () => {
    const { publicKey, secretKey } = createHybridKeypair();

    const { cipherText: ct1, sharedSecret: ss1 } = hybridEncapsulate(publicKey);
    const { cipherText: ct2, sharedSecret: ss2 } = hybridEncapsulate(publicKey);

    expect(ss1).not.toStrictEqual(ss2);
    expect(ct1).not.toStrictEqual(ct2);

    // Both still decapsulate correctly
    expect(hybridDecapsulate(ct1, secretKey)).toStrictEqual(ss1);
    expect(hybridDecapsulate(ct2, secretKey)).toStrictEqual(ss2);
  });

  test('deterministic keygen from seed', () => {
    const seed = new Uint8Array(32).fill(0xff); // XWing keygen takes 32-byte seed
    const keys1 = createHybridKeypair(seed);
    const keys2 = createHybridKeypair(seed);

    expect(keys1.publicKey).toStrictEqual(keys2.publicKey);
    expect(keys1.secretKey).toStrictEqual(keys2.secretKey);
  });

  test('hybrid shared secret is usable as XChaCha20-Poly1305 key (E2E smoke)', () => {
    const { publicKey, secretKey } = createHybridKeypair();
    const { sharedSecret } = hybridEncapsulate(publicKey);
    const recipientShared = hybridDecapsulate(hybridEncapsulate(publicKey).cipherText, secretKey);

    // Shared secrets are valid 32-byte keys — usable directly with encryptMessage.
    expect(sharedSecret).toHaveLength(32);
    expect(recipientShared).toHaveLength(32);

    const msg = utf8Encode('quantum-resistant hello');
    const encrypted = encryptMessage(sharedSecret, msg);
    const decrypted = decryptMessage(sharedSecret, encrypted);
    expect(decrypted).toStrictEqual(msg);
  });
});

test('signBytes/verifySignature', async () => {
  const privateKey = await createPrivateKey(utf8Encode('1f98af466da54014bdc08bfbaaaf3c67'));

  const publicKey = await createPublicKey(privateKey);

  const bytes = Uint8Array.from([1, 2, 3, 4]);
  const signature = await signBytes(privateKey, bytes);

  await expect(verifySignature(publicKey, bytes, signature)).resolves.toBe(true);

  await expect(verifySignature(publicKey, Uint8Array.from([4, 3, 2, 1]), signature)).resolves.toBe(
    false,
  );
});

describe('verifyAddress', () => {
  test.each([
    {
      bytes: new Uint8Array([
        1, 87, 195, 81, 58, 112, 28, 21, 103, 134, 161, 21, 153, 7, 211, 102, 109, 204, 57, 139, 50,
        11, 139, 198, 136, 232,
      ]),
      title: 'valid address, without options',
      valid: true,
    },
    {
      bytes: new Uint8Array([
        0, 87, 195, 81, 58, 112, 28, 21, 103, 134, 161, 21, 153, 7, 211, 102, 109, 204, 57, 139, 50,
        11, 139, 198, 136, 232,
      ]),
      title: 'invalid version',
      valid: false,
    },
    {
      bytes: new Uint8Array([
        1, 87, 195, 81, 58, 112, 28, 21, 103, 134, 161, 21, 153, 7, 211, 102, 109, 204, 57, 139, 50,
        11, 139, 198, 137, 232,
      ]),
      title: 'invalid checksum',
      valid: false,
    },
    {
      bytes: new Uint8Array([
        1, 87, 195, 81, 58, 112, 28, 21, 103, 134, 161, 21, 153, 7, 211, 102, 109, 204, 57, 139, 50,
        11, 139, 198, 136, 232,
      ]),
      options: { chainId: 87 },
      title: 'with options.chainId, valid',
      valid: true,
    },
    {
      bytes: new Uint8Array([
        1, 84, 195, 81, 58, 112, 28, 21, 103, 134, 161, 21, 153, 7, 211, 102, 109, 204, 57, 139, 50,
        11, 6, 62, 160, 181,
      ]),
      options: { chainId: 87 },
      title: 'with options.chainId, invalid',
      valid: false,
    },
    {
      bytes: new Uint8Array([
        1, 87, 195, 81, 58, 112, 28, 21, 103, 134, 161, 21, 153, 7, 211, 102, 109, 204, 57, 139, 50,
        11, 139, 198, 136, 232,
      ]),
      options: {
        publicKey: new Uint8Array([
          0, 127, 65, 111, 37, 76, 208, 87, 133, 14, 6, 41, 11, 170, 126, 45, 147, 36, 38, 27, 52,
          193, 36, 52, 78, 8, 107, 121, 118, 47, 163, 70,
        ]),
      },
      title: 'with options.publicKey, valid',
      valid: true,
    },
    {
      bytes: new Uint8Array([
        1, 87, 195, 81, 58, 112, 28, 21, 103, 134, 161, 21, 153, 7, 211, 102, 109, 204, 57, 139, 50,
        11, 139, 198, 136, 232,
      ]),
      options: {
        publicKey: new Uint8Array([
          59, 44, 59, 214, 91, 42, 165, 187, 242, 135, 96, 228, 229, 229, 134, 14, 150, 137, 186,
          131, 67, 209, 223, 224, 7, 101, 195, 82, 132, 221, 10, 19,
        ]),
      },
      title: 'with options.publicKey, invalid',
      valid: false,
    },
  ])('$title', ({ bytes, options, valid }) => {
    expect(verifyAddress(bytes, options)).toBe(valid);
  });
});
