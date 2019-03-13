import {byteToStringWithLength, P_BYTE, P_LONG, P_SHORT, TParser} from './parsePrimitives'
import {range} from './libs/utils'
import {getTransactionSchema, orderSchemaV2} from './schemas'
import {TSchema} from './schemaTypes'

export type TToLongConverter<LONG> = (val: string) => LONG

/**
 * Creates Uint8Array parser from object schema. If toLongConverter is provided it will be used for all LONG primitives found in schema
 * @param schema
 * @param toLongConverter
 */
export const parserFromSchema = <LONG = string>(schema: TSchema, toLongConverter?: TToLongConverter<LONG>): TParser<any> => (bytes: Uint8Array, start = 0) => {
  let cursor: number = start

  if (schema.type === 'array') {
    const result: any[] = []
    const {value: len, shift} = (schema.fromBytes || P_SHORT)(bytes, start)
    cursor += shift

    range(0, len).forEach(_ => {
      const parser = parserFromSchema(schema.items, toLongConverter)
      const {value, shift} = parser(bytes, cursor)
      result.push(value)
      cursor += shift
    })

    return {value: result, shift: cursor - start}
  }
  else if (schema.type === 'object') {
    if (schema.optional) {
      const exists = bytes[cursor] === 1
      cursor += 1
      if (!exists) return {value: undefined, shift: 1}
    }

    // skip object length, since we have schema of all its fields
    if (schema.withLength) {
      const lenInfo = schema.withLength.fromBytes(bytes, cursor)
      cursor += lenInfo.shift
    }
    

    const result: any = {}
    schema.schema.forEach(field => {
      const [name, schema] = field
      const parser = parserFromSchema(schema, toLongConverter)
      const {value, shift} = parser(bytes, cursor)
      cursor += shift
      if (value !== undefined) {
        // Name as array means than we need to save result to many object fields
        if (Array.isArray(name)) {
          Object.assign(result, value)
        } else {
          result[name] = value
        }
      }
    })

    return {value: result, shift: cursor - start}
  }
  else if (schema.type === 'anyOf') {
    const typeInfo = (schema.fromBytes || P_BYTE)(bytes, cursor + schema.discriminatorBytePos)

    // Не увеличивать курсор, если объект пишется целиком с дискриминатором или дискриминатор не на 0 позиции.
    // Стоит убрать запись и чтение дискриминаторов из anyOf и вынес
    if (schema.valueField && schema.discriminatorBytePos === 0) {
      cursor += typeInfo.shift
    }

    const item = schema.itemByByteKey(typeInfo.value)
    if (item == null) {
      throw new Error(`Failed to get schema for item with bytecode: ${typeInfo.value}`)
    }
    const parser = parserFromSchema(item.schema, toLongConverter)
    const {value, shift} = parser(bytes, cursor)
    cursor += shift


    return {
      // Checks if value should be written inside object. Eg. { type: 'int', value: 20}. Otherwise writes object directly. Eg. {type: 4, recipient: 'foo', timestamp:10000}
      value: schema.valueField ?
        {[schema.discriminatorField]: item.strKey, [schema.valueField]: value} :
        value,
      shift: cursor - start,
    }
  }
  else if (schema.type === 'dataTxField') {
    const key = byteToStringWithLength(bytes, cursor)
    cursor += key.shift
    let dataType = P_BYTE(bytes, cursor)
    cursor += dataType.shift
    const itemRecord = [...schema.items].find((_, i) => i === dataType.value)
    if (!itemRecord) {
      throw new Error(`Parser Error: Unknown dataTxField type: ${dataType.value}`)
    }
    const parser = parserFromSchema(itemRecord![1], toLongConverter)
    const result = parser(bytes, cursor)
    //cursor += result.shift;
    return {
      value: {
        value: result.value,
        key: key.value,
        type: itemRecord[0],
      },
      shift: result.shift + key.shift + dataType.shift,
    }
  }
  else if (schema.type === 'primitive' || schema.type === undefined) {
    const parser = schema.fromBytes
    let {value, shift} = parser(bytes, start)

    //Capture LONG Parser and convert strings desired instance if longFactory is present
    if (parser === P_LONG && toLongConverter) {
      value = toLongConverter(value)
    }
    return {value, shift: shift}
  } else {
    throw new Error(`Parser Error: Unknown schema type: ${schema!.type}`)
  }
}

export const parseHeader = (bytes: Uint8Array): { type: number, version: number } => {
  let shift = 0
  let typeInfo = P_BYTE(bytes, shift)
  shift += typeInfo.shift

  // ExchangeTransactionV2 have leading 0 in bodybytes
  if (typeInfo.value === 0) {
    typeInfo = P_BYTE(bytes, shift)
    shift += typeInfo.shift
  }
  let versionInfo =  P_BYTE(bytes, shift)

  return {
    type: typeInfo.value,
    version: versionInfo.value,
  }
}

/**
 * This function cannot parse transactions without version
 */
export function parseTx<LONG = string>(bytes: Uint8Array, toLongConverter?: TToLongConverter<LONG>) {
  const {type, version} = parseHeader(bytes)
  const schema = getTransactionSchema(type, version)

  return parserFromSchema(schema, toLongConverter)(bytes).value
}


/**
 * This function cannot parse OrderV1, which doesn't have version field
 */
export function parseOrder<LONG = string>(bytes: Uint8Array, toLongConverter?: TToLongConverter<LONG>) {
  return parserFromSchema(orderSchemaV2, toLongConverter)(bytes).value
}