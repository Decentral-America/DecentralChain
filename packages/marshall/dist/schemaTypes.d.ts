export declare enum DATA_FIELD_TYPE {
    INTEGER = "integer",
    BOOLEAN = "boolean",
    STRING = "string",
    BINARY = "binary"
}
export declare type TSchema = TObject | TArray | IAnyOf | TDataTxItem | TPrimitive;
export declare type TObjectField = [string | string[], TSchema];
export declare type TAnyOfItem = {
    schema: TSchema;
    key: number;
    strKey?: string;
};
export declare type TObject = {
    type: 'object';
    withLength?: TPrimitive;
    optional?: boolean;
    schema: TObjectField[];
};
export declare type TArray = {
    type: 'array';
    items: TSchema;
    toBytes?: any;
    fromBytes?: any;
};
export interface IAnyOf {
    type: 'anyOf';
    toBytes?: any;
    fromBytes?: any;
    discriminatorField: string;
    discriminatorBytePos: number;
    valueField?: string;
    itemByKey: (key: string) => TAnyOfItem | undefined;
    itemByByteKey: (key: number) => TAnyOfItem | undefined;
}
export declare type TPrimitive = {
    type?: 'primitive';
    toBytes: (...args: any) => any;
    fromBytes: (bytes: Uint8Array, start?: number) => any;
};
export declare type TDataTxItem = {
    type: 'dataTxField';
    items: Map<DATA_FIELD_TYPE, TSchema>;
};
export declare function anyOf(items: [number, TSchema, string?][], options?: any): IAnyOf;
