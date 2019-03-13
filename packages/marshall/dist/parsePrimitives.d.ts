export declare const ALIAS_VERSION: number;
declare type Option<T> = T | null | undefined;
export declare type TParser<T> = (bytes: Uint8Array, start?: number) => {
    value: T;
    shift: number;
};
export declare const P_OPTION: <T>(p: TParser<T>) => TParser<Option<T>>;
export declare const P_BYTE: TParser<number>;
export declare const P_SHORT: TParser<number>;
export declare const P_INT: TParser<number>;
export declare const P_LONG: TParser<string>;
export declare const P_BOOLEAN: (bytes: Uint8Array, start?: number) => {
    value: boolean;
    shift: number;
};
export declare const P_STRING_FIXED: (len: number) => TParser<string>;
export declare const P_STRING_VAR: (lenParser: TParser<number>) => (bytes: Uint8Array, start?: number) => {
    shift: number;
    value: string;
};
export declare const P_BASE58_FIXED: (len: number) => TParser<string>;
export declare const P_BASE58_VAR: (lenParser: TParser<number>) => (bytes: Uint8Array, start?: number) => {
    shift: number;
    value: string;
};
export declare const P_BASE64: (lenParser: TParser<number>) => (bytes: Uint8Array, start?: number) => {
    shift: number;
    value: string;
};
export declare const byteToStringWithLength: (bytes: Uint8Array, start?: number) => {
    shift: number;
    value: any;
};
export declare const byteToBase58: (bytes: Uint8Array, start?: number, length?: number | undefined) => {
    value: string;
    shift: number;
};
export declare const byteToBase58WithLength: (bytes: Uint8Array, start?: number) => {
    value: string;
    shift: number;
};
export declare const byteToAddressOrAlias: (bytes: Uint8Array, start?: number) => {
    shift: number;
    value: any;
};
export declare const byteNewAliasToString: (bytes: Uint8Array, start?: number) => {
    shift: number;
    value: any;
};
export declare const byteToScript: (bytes: Uint8Array, start?: number) => {
    shift: number;
    value: null;
} | {
    value: string;
    shift: number;
};
export {};
