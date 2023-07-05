import { base16Encode } from './base16.js';
import { initWasm } from './initWasm.js';
import { sha256 } from './sha256.js';
import { utf8Decode, utf8Encode } from './utf8.js';

export async function deriveSeedEncryptionKey(
  password: Uint8Array,
  hashRounds: number,
  salt: Uint8Array,
) {
  let hashedPassword = password;

  while (hashRounds--) {
    hashedPassword = utf8Encode(
      base16Encode(new Uint8Array(await sha256(hashedPassword))),
    );
  }

  const hashedPasswordBytes = Uint8Array.from(
    utf8Decode(hashedPassword)
      .split('')
      .map(c => c.charCodeAt(0)),
  );

  const wasm = await initWasm();

  const part1 = wasm.md5(Uint8Array.of(...hashedPasswordBytes, ...salt));
  const part2 = wasm.md5(
    Uint8Array.of(...part1, ...hashedPasswordBytes, ...salt),
  );

  const key = Uint8Array.of(...part1, ...part2);
  const iv = wasm.md5(Uint8Array.of(...part2, ...hashedPasswordBytes, ...salt));

  return [key, iv];
}
