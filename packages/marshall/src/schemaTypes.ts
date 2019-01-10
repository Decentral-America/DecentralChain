export enum DATA_FIELD_TYPE {
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  STRING = 'string',
  BINARY = 'binary'
}

export type TSchema = TObject | TArray | TAnyOf | TDataTxField | TPrimitive;

export type TObject = {
  name: string;
  type: 'object';
  //Objects sometimes are needed to be serialized with length
  withLength?: boolean;
  optional?: boolean;
  schema: TSchema[];
}
export type TArray = {
  name: string;
  type: 'array';
  items: TSchema;
  toBytes?: any;
  fromBytes?: any;
}

export type TAnyOf = {
  name: string;
  type: 'anyOf';
  toBytes?: any;
  fromBytes?: any;
  discriminatorField?: string;
  valueField?: string;
  items: Map<string, TSchema>;
}

export type TPrimitive = {
  name: string;
  type?: 'primitive';
  toBytes: (...args: any) => any;
  fromBytes: (bytes: Uint8Array, start?: number) => any;
}

//Data tx field serializes differently. It has type AFTER key field!!!
export type TDataTxField = {
  name: string;
  type: 'dataTxField';
  items: Map<DATA_FIELD_TYPE, TSchema>;
}

