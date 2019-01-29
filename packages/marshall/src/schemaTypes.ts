export enum DATA_FIELD_TYPE {
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  STRING = 'string',
  BINARY = 'binary'
}

export type TSchema = TObject | TArray | IAnyOf | TDataTxItem | TPrimitive;

export type TObjectField = [string, TSchema];
export type TAnyOfItem = {schema: TSchema, key: number, strKey?: string};

export type TObject = {
  type: 'object';
  //Objects sometimes are needed to be serialized with length
  withLength?: boolean;
  optional?: boolean;
  schema: TObjectField[];
}
export type TArray = {
  type: 'array';
  items: TSchema;
  toBytes?: any;
  fromBytes?: any;
}

export interface IAnyOf {
  type: 'anyOf';
  toBytes?: any;
  fromBytes?: any;
  discriminatorField: string; // defaults to 'type'
  valueField?: string; // defaults to whole object
  itemByKey: (key: string) => TAnyOfItem | undefined
  itemByByteKey: (key: number) => TAnyOfItem | undefined
}

export type TPrimitive = {
  type?: 'primitive';
  toBytes: (...args: any) => any;
  fromBytes: (bytes: Uint8Array, start?: number) => any;
}

//Data tx field serializes differently. It has type AFTER key field!!!
export type TDataTxItem = {
  type: 'dataTxField';
  items: Map<DATA_FIELD_TYPE, TSchema>;
}

export function anyOf(items: [number, TSchema, string?][], options?:any): IAnyOf {
  return new AnyOfClass(items, options)
}

class AnyOfClass implements IAnyOf{
  public type: "anyOf" = "anyOf";
  public toBytes?: any;
  public fromBytes?: any;
  public discriminatorField = 'type';
  public valueField?: string; // defaults to whole object


  constructor(private _items: [number, TSchema, string?][], options?: any){
    Object.assign(this, options);

  }

  public itemByKey(k: string): TAnyOfItem | undefined{
    if (this._items[0] && this._items[0].length === 3){
      const row =  this._items.find(([key, schema, stringKey]) => stringKey === k);
      return row && {
        schema: row[1],
        key: row[0],
        strKey: row[2]
      }
    }
    return this.itemByByteKey(k as any)
  }

  public itemByByteKey(k:number):  TAnyOfItem  | undefined{
    const row =  this._items.find(([key, _]) => key === k);
    return row && {
      schema: row[1],
      key: row[0],
      strKey: row[2] || row[0].toString(10)
    }
  }
}