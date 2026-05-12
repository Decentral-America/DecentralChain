const base58Chars: string = '[1-9A-HJ-NP-Za-km-z]+';

export const interval: RegExp = /^\d+[smhdwMY]$/;
export const base58: RegExp = new RegExp(`^${base58Chars}$`);
export const assetId: RegExp = new RegExp(`^(?:DCC|${base58Chars})$`);
// biome-ignore lint/suspicious/noControlCharactersInRegex: \x00 is intentional null char exclusion pattern
export const noNullChars: RegExp = /^[^\x00]*$/;
export const eip712Signature: RegExp = /^0x([A-Fa-f0-9])*$/;

// string doesn't have dangding unescaped slash at the end
export const saneForDbLike: RegExp = /^(?:.*[^\\])?(?:\\\\)*$/;
