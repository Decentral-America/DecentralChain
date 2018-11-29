import {byteToStringWithLength, P_BYTE, P_LONG, P_SHORT, TParser} from "./parsePrimitives";
import {range} from "./libs/utils";
import {ILongFactory, TSchema} from "./txSchemas";

export const parserFromSchema = <LONG = string>(schema: TSchema, lf?: ILongFactory<LONG>): TParser<any> => (bytes: Uint8Array, start = 0) => {
  let cursor: number = start;

  if (schema.type === 'array') {
    const result: any[] = [];
    const {value: len, shift} = P_SHORT(bytes, start);
    cursor += shift;

    range(0, len).forEach(_ => {
      const parser = parserFromSchema(schema.items, lf);
      const {value, shift} = parser(bytes, cursor);
      result.push(value);
      cursor += shift;
    });

    return {value: result, shift: cursor - start}
  }
  else if (schema.type === 'object') {
    const result: any = {};
    schema.schema.forEach(field => {
      const parser = parserFromSchema(field, lf);
      const {value, shift} = parser(bytes, cursor);
      cursor += shift;
      if (value !== undefined) {
        result[field.name] = value
      }
    });

    return {value: result, shift: cursor - start}
  }
  else if (schema.type === 'anyOf') {
    let {value: anyOfIndex, shift} = P_BYTE(bytes, cursor);
    cursor += shift;
    const item = Array.from(schema.items.values())[anyOfIndex];
    const parser = parserFromSchema(item, lf);
    return parser(bytes, cursor);
  }
  else if (schema.type === 'dataTxField') {
    const key = byteToStringWithLength(bytes, cursor);
    cursor += key.shift;
    let dataType = P_BYTE(bytes, cursor);
    cursor += dataType.shift;
    const itemRecord = [...schema.items].find((_, i) => i === dataType.value);
    if (!itemRecord) {
      throw new Error(`Parser Error: Unknown dataTxField type: ${dataType.value}`)
    }
    const parser = parserFromSchema(itemRecord![1], lf);
    const result = parser(bytes, cursor);
    //cursor += result.shift;
    return {
      value: {
        value: result.value,
        key: key.value,
        type: itemRecord[0]
      },
      shift: result.shift + key.shift + dataType.shift
    }
  }
  else if (schema.type === 'primitive' || schema.type === undefined) {
    const parser = schema.fromBytes;
    let {value, shift} = parser(bytes, start);

    //Capture LONG Parser and convert strings desired instance if longFactory is present
    if (parser === P_LONG && lf) {
      value = lf.fromString(value)
    }
    return {value, shift: shift}
  } else {
    throw new Error(`Parser Error: Unknown schema type: ${schema!.type}`)
  }
};

export const parseHeader = (bytes: Uint8Array): { type: number, version: number } => ({
  type: P_BYTE(bytes).value,
  version: P_BYTE(bytes, 1).value
});
