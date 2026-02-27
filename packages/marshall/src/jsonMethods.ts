import * as create from './libs/parseJsonBigNumber'

const {parse, stringify} = create()
import {getTransactionSchema, orderSchemaV1, orderSchemaV2} from './schemas'
import {TSchema} from './schemaTypes'
import {LONG} from './serializePrimitives'
import {convertLongFields, convertTxLongFields} from './index'
import {TToLongConverter} from './parse'
import {TFromLongConverter} from './serialize'

function resolvePath(path: string[], obj: any): any {
  if (path.length === 0) return obj
  if (typeof obj !== 'object') return undefined

  return resolvePath(path.slice(1), obj[path[0]])
}

const isLongProp = (fullPath: string[], fullSchema: TSchema | undefined, targetObject: any): any => {

  function go(path: string[], schema?: TSchema): boolean {
    if (schema == null) return false

    if (path.length === 0 && (schema.type === 'primitive' || schema.type === undefined)) return schema.toBytes === LONG

    if (schema.type === 'object') {
      const field = schema.schema.find(([name, _]) => name === path[0])
      return go(path.slice(1), field && field[1])
    }

    if (schema.type === 'array') {
      return go(path.slice(1), schema.items)
    }

    if (schema.type === 'dataTxField') {
      if (path[0] !== 'value') return false
      const dataObj = resolvePath(fullPath.slice(0, fullPath.length - 1), targetObject)
      const dataSchema = schema.items.get(dataObj.type)
      return go(path.slice(1), dataSchema)
    }

    if (schema.type === 'anyOf') {

      // Find object and get it's schema
      const obj = resolvePath(fullPath.slice(0, fullPath.length - 1), targetObject)
      const objType = obj[schema.discriminatorField]
      const objSchema = schema.itemByKey(objType)
      if (!objSchema) return false


      // If valueField exists in schema we also check if value and not type field is currently processed. E.g:
      // {type: 'integer', value: 1000}
      if (schema.valueField != null && fullPath[fullPath.length - 1] === schema.valueField) {
        return go(path.slice(1), objSchema.schema)
      }
      //  Otherwise whole object is used as value. E.g.: {type:14, sender: 'example', amount: 1000}
      else {
        return go(path, objSchema.schema)
      }

    }

    return false
  }

  return go(fullPath, fullSchema)

}

/**
 * Converts object to JSON string using binary schema. For every string found, it checks if given string is LONG property.
 * If true - function writes this string as number
 * @param obj
 * @param schema
 */
export function stringifyWithSchema(obj: any, schema?: TSchema): string {
  const path: string[] = []
  const stack: any[] = []

  function stringifyValue(value: any): string | undefined {

    if (typeof value === 'string') {

      // ///TODO: DIRTY HACK
      // if (value === 'integer'
      //   && path[0] === 'call'
      //   && path[1] === 'args'
      //   && path[3] === 'type'
      // ) { return `"${value}"` }

      if (isLongProp(path, schema, obj)) {
        return value
      }
    }

    if (typeof value === 'boolean' || value instanceof Boolean ||
      value === null ||
      typeof value === 'number' || value instanceof Number ||
      typeof value === 'string' || value instanceof String ||
      value instanceof Date) {
      return JSON.stringify(value)
    }

    if (Array.isArray(value)) {
      return stringifyArray(value)
    }

    if (value && typeof value === 'object') {
      return stringifyObject(value)
    }

    return undefined
  }

  function stringifyArray(array: any[]): string {
    let str = '['

    const stackIndex = stack.length
    stack[stackIndex] = array

    for (let i = 0; i < array.length; i++) {
      let key = i + ''
      let item = array[i]

      if (typeof item !== 'undefined' && typeof item !== 'function') {
        path[stackIndex] = key
        str += stringifyValue(item)
      }
      else {
        str += 'null'
      }

      if (i < array.length - 1) {
        str += ','
      }
    }

    stack.length = stackIndex
    path.length = stackIndex

    str += ']'
    return str
  }

  function stringifyObject(object: any): string {
    let first = true
    let str = '{'

    const stackIndex = stack.length
    stack[stackIndex] = object

    for (let key in object) {
      if (object.hasOwnProperty(key)) {
        let value = object[key]

        if (includeProperty(value)) {
          if (first) {
            first = false
          }
          else {
            str += ','
          }

          str += ('"' + key + '":')

          path[stackIndex] = key
          str += stringifyValue(value)
        }
      }
    }

    stack.length = stackIndex
    path.length = stackIndex

    str += '}'
    return str
  }

  function includeProperty(value: any) {
    return typeof value !== 'undefined'
      && typeof value !== 'function'
  }

  return stringifyValue(obj) || ''
}

/**
 * Safe parse json string to TX. Converts unsafe numbers to strings. Converts all LONG fields with converter if provided
 * @param str
 * @param toLongConverter
 */
export function parseTx<LONG = string>(str: string, toLongConverter?: TToLongConverter<LONG>) {
  const tx = parse(str)
  return toLongConverter ? convertTxLongFields(tx, toLongConverter) : tx
}

/**
 * Converts transaction to JSON string.
 * If transaction contains custom LONG instances and this instances doesn't have toString method, you can provide converter as second param
 * @param tx
 * @param fromLongConverter
 */
export function stringifyTx<LONG>(tx: any, fromLongConverter?: TFromLongConverter<LONG>): string {
  const {type, version} = tx
  const schema = getTransactionSchema(type, version)
  const txWithStrings = convertLongFields(tx, schema, undefined, fromLongConverter)
  return stringifyWithSchema(txWithStrings, schema)
}

/**
 * Safe parse json string to order. Converts unsafe numbers to strings. Converts all LONG fields with converter if provided
 * @param str
 * @param toLongConverter
 */
export function parseOrder<LONG = string>(str: string, toLongConverter?: TToLongConverter<LONG>) {
  const ord = parse(str)
  const schema = ord.version === 2 ? orderSchemaV2 : orderSchemaV1
  return toLongConverter ? convertLongFields(ord, schema, toLongConverter) : ord
}

/**
 * Converts order to JSON string
 * If order contains custom LONG instances and this instances doesn't have toString method, you can provide converter as second param
 * @param ord
 * @param fromLongConverter
 */
export function stringifyOrder<LONG>(ord: any, fromLongConverter?: TFromLongConverter<LONG>): string {
  const schema = ord.version === 2 ? orderSchemaV2 : orderSchemaV1
  const ordWithStrings = convertLongFields(ord, schema, undefined, fromLongConverter)
  return stringifyWithSchema(ordWithStrings, schema)
}

