export enum DATA_FIELD_TYPE {
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  STRING = 'string',
  BINARY = 'binary',
}

export type TSchema = TObject | TArray | IAnyOf | TDataTxItem | TPrimitive;

export type TObjectField = [string | string[], TSchema];
export type TAnyOfItem = { schema: TSchema; key: number; strKey?: string | undefined };

export type TObject = {
  type: 'object';
  // Length serializer for object. If absent - length will not be written
  withLength?: TPrimitive;
  optional?: boolean;
  schema: TObjectField[];
};
export type TArray = {
  type: 'array';
  items: TSchema;
  toBytes?: any;
  fromBytes?: any;
};

export interface IAnyOf {
  type: 'anyOf';
  toBytes?: any;
  fromBytes?: any;
  discriminatorField: string; // defaults to 'type'
  discriminatorBytePos: number; // defaults to 0
  valueField?: string; // defaults to whole object
  itemByKey: (key: string) => TAnyOfItem | undefined;
  itemByByteKey: (key: number) => TAnyOfItem | undefined;
}

export type TPrimitive = {
  type?: 'primitive';
  toBytes: (...args: any) => any;
  fromBytes: (bytes: Uint8Array, start?: number) => any;
};

// Data tx field serializes differently. It has type AFTER key field!!!
export type TDataTxItem = {
  type: 'dataTxField';
  items: Map<DATA_FIELD_TYPE, TSchema>;
};

export function anyOf(items: [number, TSchema, string?][], options?: TAnyOfOptions): IAnyOf {
  return new AnyOfClass(items, options);
}

export type TAnyOfOptions = {
  [P in Exclude<keyof AnyOfClass, 'type'>]?: AnyOfClass[P];
};

class AnyOfClass implements IAnyOf {
  public type = 'anyOf' as const;
  public toBytes?: any;
  public fromBytes?: any;
  public withLength?: TPrimitive;
  public discriminatorField = 'type';
  public discriminatorBytePos = 0; // defaults to 0
  public valueField?: string; // defaults to whole object

  constructor(
    private _items: [number, TSchema, string?][],
    options?: TAnyOfOptions,
  ) {
    Object.assign(this, options);
  }

  public itemByKey(k: string): TAnyOfItem | undefined {
    // Here if k equals undefined (this happens if discriminator field is undefined), first item with no string key returns
    // This is useful for items without versions. E.g. orderV0
    const row = this._items.find(
      ([key, _schema, stringKey]) => stringKey === k || key === Number(k),
    );
    return (
      row && {
        schema: row[1],
        key: row[0],
        strKey: row[2],
      }
    );
  }

  public itemByByteKey(k: number): TAnyOfItem | undefined {
    const row = this._items.find(([key]) => key === k);
    return (
      row && {
        schema: row[1],
        key: row[0],
        strKey: row[2] || row[0].toString(10),
      }
    );
  }
}
