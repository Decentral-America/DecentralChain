import { stringToBytes } from '../src/conversions/string-bytes';
import { pemToBytes, rsaKeyPair, rsaKeyPairSync, rsaSign, rsaVerify } from '../src/crypto/rsa';
import { base64Decode, base64Encode } from '../src/conversions/base-xx';
import { RSADigestAlgorithm } from '../src';
import { describe, expect, test } from 'vitest';

describe('RSA', () => {
  test('Should get correct rsa signature', () => {
    const pair = rsaKeyPairSync();
    const msg = 'hello world';
    const msgBytes = stringToBytes(msg);
    const signature = rsaSign(pair.rsaPrivate, msgBytes);
    const valid = rsaVerify(pair.rsaPublic, msgBytes, signature);
    expect(valid).toBe(true);
  });

  test('Should get correct rsa signature with async keypair generation', async () => {
    const pair = await rsaKeyPair();
    const msg = 'hello world';
    const msgBytes = stringToBytes(msg);
    const signature = rsaSign(pair.rsaPrivate, msgBytes);
    const valid = rsaVerify(pair.rsaPublic, msgBytes, signature);
    expect(valid).toBe(true);
  });

  test('Should get correct rsa md5 signature with async keypair generation', async () => {
    const pair = await rsaKeyPair();
    const msg = 'hello world';
    const msgBytes = stringToBytes(msg);
    const signature = rsaSign(pair.rsaPrivate, msgBytes, 'MD5');
    const valid = rsaVerify(pair.rsaPublic, msgBytes, signature, 'MD5');
    expect(valid).toBe(true);
  });

  test('sign and verify with all supported digest algorithms', () => {
    const pair = rsaKeyPairSync(2048);
    const msgBytes = stringToBytes('test message for all digests');
    const algorithms: RSADigestAlgorithm[] = [
      'MD5',
      'SHA1',
      'SHA224',
      'SHA256',
      'SHA384',
      'SHA512',
      'SHA3-224',
      'SHA3-256',
      'SHA3-384',
      'SHA3-512',
    ];

    for (const alg of algorithms) {
      const signature = rsaSign(pair.rsaPrivate, msgBytes, alg);
      expect(rsaVerify(pair.rsaPublic, msgBytes, signature, alg)).toBe(true);
    }
  });

  test('verification fails with wrong message', () => {
    const pair = rsaKeyPairSync();
    const msgBytes = stringToBytes('correct message');
    const wrongBytes = stringToBytes('wrong message');
    const signature = rsaSign(pair.rsaPrivate, msgBytes);
    expect(rsaVerify(pair.rsaPublic, wrongBytes, signature)).toBe(false);
  });

  test('verification fails with wrong key', () => {
    const pairA = rsaKeyPairSync();
    const pairB = rsaKeyPairSync();
    const msgBytes = stringToBytes('hello');
    const signature = rsaSign(pairA.rsaPrivate, msgBytes);
    expect(rsaVerify(pairB.rsaPublic, msgBytes, signature)).toBe(false);
  });

  test('verification fails with mismatched digest algorithm', () => {
    const pair = rsaKeyPairSync();
    const msgBytes = stringToBytes('hello');
    const signature = rsaSign(pair.rsaPrivate, msgBytes, 'SHA256');
    expect(rsaVerify(pair.rsaPublic, msgBytes, signature, 'SHA512')).toBe(false);
  });

  test('pemToBytes correctly parses PEM-encoded key', () => {
    // Generate a fresh key pair so no private key is committed to source control
    const pair = rsaKeyPairSync();
    // Build a PEM string from the raw private-key bytes
    const b64 = base64Encode(pair.rsaPrivate);
    const pem =
      '-----BEGIN RSA PRIVATE KEY-----\n' +
      b64.match(/.{1,64}/g)!.join('\n') +
      '\n-----END RSA PRIVATE KEY-----\n';
    const bytes = pemToBytes(pem);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
    // Round-trip: decoded bytes should match the original private key
    expect(bytes).toEqual(pair.rsaPrivate);
  });

  test('rsaKeyPairSync with custom bits and exponent', () => {
    const pair = rsaKeyPairSync(1024, 0x10001);
    expect(pair.rsaPublic).toBeInstanceOf(Uint8Array);
    expect(pair.rsaPrivate).toBeInstanceOf(Uint8Array);
    expect(pair.rsaPublic.length).toBeGreaterThan(0);
    expect(pair.rsaPrivate.length).toBeGreaterThan(0);
  });

  test('rsaKeyPair async with custom bits', async () => {
    const pair = await rsaKeyPair(1024, 0x10001);
    expect(pair.rsaPublic).toBeInstanceOf(Uint8Array);
    expect(pair.rsaPrivate).toBeInstanceOf(Uint8Array);
  });

  test('all possible hashes', async () => {
    const testData = [
      {
        alg: 'MD5',
        sig: 'kHOfaGcMkCSaVBwwyg/yy0IrYM3wntSh6/AxfdXDWyGgtxlOoeMi45Btw71hk8a+M2xCQ4FgTu2s3lWbYSTk3qf+hDOgRqOoKDoehAwtMC+DH/d/kcgArtnf9g13D4gbpWrcjb5M9Q6fNcPUfZDT6U13exh6rbjKGdpNCun2DqHzpUUUn96Jkc7XYXQwyEN8IU0J5Ez38dqlyDEvuRykjz/ABd/tQxp1IivVZ9OgAJttVlfAmmYCHPSSQfXAQk1w4fLremHqolQJGZzDCfKkqucni/BdWnMXJikI63y0u1++3Jnipb93PrfmLlGxWinwybD3O9oKiZ2SigHy5/t6eA==',
      },
      {
        alg: 'SHA1',
        sig: 'r06p9Zmdx+tJQYS2rDq4XLY4TZFofovPsq94gAkI4yCCBIQg7I+pkuixOONisnJZmItUWF9vvo+AGBTSDHDQWcTiVWLXD49ynlEG0GOS/W9zsT7KWYRwaaulXL7PFHSDC87OcuS2n0KEivM3K20QhcC+X/cNR5c6vJ2nmuAE/3xU1qlnMm/bUQYicuQOD0gKLb1BuVqFAZ/KQfKiuzdOoX9Pkg135qAygGSRRFIhJ67kb2lRpqeFS4FgHqc6Cm3oINDxx9MZTZ/DZnaqAByABbAIQhPrZeekg3Ysj8FoOvoxZGpvzb5cbjO6akV+aHnqOcOKksl/h5EKy2BjfNJpWA==',
      },
      {
        alg: 'SHA256',
        sig: 'AD/Q/AjmUUYlEec3LbBBNA+R8A+hlHyZoQs5BUuawJRqF0ROeJZLXktSegO8q6v+/W5yBRwuSbVSTyb/vtvvM0Qr8ayhKNpcF0unYtILO6g0farJGMU21Ne0I5nNknRveLmXY6itatba+3OU510HtZWmXo+y8qXNEp2VRI6Qpz2hzl1xt9qg8/psuAPNpk1OpFqShyh9lHNkwFQYJ2lDnoMkDWFof4SojTYAvL01sRtFGwjMb+K71QvGH0RX1FdGId/tubmFQRfMJuVpZkGgyZ/8PD245MkxbIJCAKraFst5n0Wi6wx++CT31fU4qLGYdaW3MW3h9zPPUV9RLJfeDQ==',
      },
      {
        alg: 'SHA384',
        sig: 'RXjxfAhg4f4G/UkRoyxnCTTKkME2ceTjQJJEgtL7O19srM3yFFqY2cqVFIFpOJBEQ+4KdncGZeQZmsHQrXfq5U8O9rZi9ugURKnG07l/hjvU6UqUJfWYCY31rEQUpURcH00GNmIUu8wQwFmTJT1LHao0tByAP01N7VJ2JSTzHbpb/buQh27AyIKoH8JibT5qQMS8LAf/m+Jxr0nGFyLd0KwV+YAs1TUfmOPSR15VeyN3qmL5PVB4j5tHXpa0fVq9ALVrvKyIuQDVX0w1L6KMcy+Y6tz3eBZrs+V7Jf5dEYe2+JXTxnAZU1c55DMIBCvPly76wYpL8w8XUA5WyJCw8w==',
      },
      {
        alg: 'SHA512',
        sig: 'swZmWD0MEXOm+pR9Xf3vP674doW9HgLxK8ntVyhUmrKsWc9GoCeX5Q3PgvVhkQ2lOA8GXZ1tXdrx6syfF5DZqBEiBASYyozL/KOd8C2r7oKIXeS1S6JzdwWiTxSD+PBpiMwBEbxj91tLKjrvcTCfzByCfNZdYv+/mi5Dxs/0wS6rdj62m5diUTy5MuY1NwC5E0OKShie0olyikDTflSUNMmiYjmykKW0xuXKJXsdOCO2DsqPCihRN2CeHsWXZZRJc8mPWPfqBElVGzJGzOpGDT4sfi8c9EuwFPsjUafB/2yrb2es5IsueSg/scqGmAxYZ+DpUO3OCioXr8z/zt21PA==',
      },
      {
        alg: 'SHA3-224',
        sig: 'UkOMw6DQHfALpkP6ChWYTPQmj/80YWL6DpkUJHaFQWhXFxuU/9JgpQ3qC6N/qZTHTwlpVlV+19gLrfhC2JJjCmNEM1zyuDd2Tln8Ny8MHK+aF4UD8JDOqQCn39uR6CLXpSHVFXP8RRzWo3YbmLI5WMZL087aKjcMQU7Yc7ebVFFcNJZrz7d8ZsSzUrTvxpuBypxDJT+Z2HfFDNQAty/pi1B6FetC3vbB/CWRXCk7NEqgZHavd/VsE4GixaM+PcQtVFjPRNTZir0aZfLey9hoYFOQ5oYVLM/RtmCTwQzRrcjUZv9EiPlZWqvokl1fFXD0ENRpDEFZ1Or2cqtV0zqdOg==',
      },
      {
        alg: 'SHA3-256',
        sig: 'idpbJpjm3Yz2qgiqNuicDK4cR3VMzu12ny40lSGwAln5w38KJhWdjjlyHwEjDHg1hXKSNRwCrIeykPuIIP3Wn+8mo/CRBUgBHahuCb0YwdfeE0CjeAKsIWoR+VmY36Eeocbc+zCOKMfw6Ybs2BvVZlycJ3R3YkzrL6+fQqKyhtWjg/CgrIBZ0g7Uq0U2HR9vD94vFwdBT63Xcf1tRc5Wq1TaxgsfNLY7SPaHwdNwJvvi01YhCe5W2HCf7dpzP/hn5mxxdOSIfi+j1wtBy4v5jezCB7Nzf45ZQ7vdCmGP1SKjAHsTSdJxuQBMACselLOniDdCscIIAhTPx6cOdM6ZyQ==',
      },
      {
        alg: 'SHA3-384',
        sig: 'L1TR8izeM0yRnMX7l6eKonHNGUmAsQi7GMOOmFQTFNZg9omVYYlgzCwq1LmR1R8DPAN40ZN9V0peEkocFT7zhLWLKAnE5YXBrm1iwMsIBK3WKLt2p7aknz1UwlGRZWlTlpPoOryYA0rgX4v8PnfYMjixck9Y5nPbl8+x/clnVzWEpCdeFw5wWFzskeFnXjAYaVVB0jtY3m8pKj+ZxCdU3sRtL3Ev8+wtRmW+h9BEicWYu98NqTAMH2TlGz/S3sq5IXl0XDau1ahwEj4QXp+B87JyR290yx87yi6KFcux7zkc+bfge9+pjZjDXO5LBao2jqvAuiDJ9PW96eUbbIq+XQ==',
      },
      {
        alg: 'SHA3-512',
        sig: 'pvPNCpOhu3Ju0VRR0tW1rwb5E6Px39xKZQVxKxdNrboJKhUmkDxEq8mm1EynbS8KshsB5YsbGmSpaDX+THKxlllDl0gHWJu54MV+Bh/HegvdorkrbPBzivFdiLj/ecY6Vc1HMcUd9mGvYlQ//fcOKvs8oGOK1Z2TE2ojKyuC/8Bsx/M29uRnBRUIh9nXD7eSAiui92NkNfCXjes7RLed6jO/kYbQw7Tl6h1hWoYHCBU39qJTK0NKV8U4/wI9A7tGDXfEbA51ulYS0XaYOUf7EqT/Aq+GV5w7CxOsc8P2B0h6YVLzUUHSia7CB6DYWkhk/v3ZC5qHxT92VOnC9715ag==',
      },
    ];
    const msg = base64Decode('aGVsbG8gd29ybGQ=');
    const pk = base64Decode(
      'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAt5IE7IAnSq7uK8FknxfEm2OtPvFOQlVy4F9arLp0PmhIRkDMpk7nWu3aNn6NBYX4kiigOLBhRDwNAZTJXnCjS8FQ/trZRo7oANiCX9kKwJZKQQCjLS0KSRWQWunDF7l9EUhTwb3QzhdSvYJLy3lOk90ZPB+36YvHooFx8oLIJimJhgbPXL95Yk6i+wh32Zhda616+9q/EftA5I4emJZRFLareSXM/MR03IFjYdh4S7LH+OPr94IQY/26Pt5HmS0X4W500HjxEp1vF8Irx3GYiF6Abk7JK5Gyf6W8ApEfAofj0s8qfLfHhH4JHg/QwW4NSd1NrhRMov2H7v31BVsRgwIDAQAB',
    );

    testData.forEach(({ alg, sig }) => {
      expect(rsaVerify(pk, msg, base64Decode(sig), alg as RSADigestAlgorithm)).toBe(true);
    });
  });

  test('Should get correct rsa signature sha3 message digest', async () => {
    // Generate a fresh key pair — no private key in source control
    const pair = rsaKeyPairSync(2048);
    const msg = 'hello world';
    const msgBytes = stringToBytes(msg);
    const signature = rsaSign(pair.rsaPrivate, msgBytes, 'SHA3-256');
    const valid = rsaVerify(pair.rsaPublic, msgBytes, signature, 'SHA3-256');
    expect(valid).toBe(true);
  });

  test('signing is deterministic for the same key and message', () => {
    // Generate a fresh key pair — no private key in source control
    const pair = rsaKeyPairSync();
    const msg = 'hello world';
    const msgBytes = stringToBytes(msg);

    const sig1 = base64Encode(rsaSign(pair.rsaPrivate, msgBytes));
    const sig2 = base64Encode(rsaSign(pair.rsaPrivate, msgBytes));
    expect(sig1).toEqual(sig2);

    // Also verify the signature is valid
    expect(rsaVerify(pair.rsaPublic, msgBytes, rsaSign(pair.rsaPrivate, msgBytes))).toBe(true);
  });
});
