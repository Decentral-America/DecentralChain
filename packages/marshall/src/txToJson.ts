import {getSchema} from "./index";
import {TObject, TSchema} from "./txSchemas";
import {LONG} from "./serializePrimitives";

function resolvePath(path: string[], obj: any): any{
  if (path.length === 0) return obj
  if (typeof obj !== 'object') return undefined

  return resolvePath(path.slice(1), obj[path[0]])
}

const isLongProp = (fullPath: string[], fullSchema: TSchema, targetObject: any): any => {

  function go(path: string[], schema?:TSchema): boolean{
    if (schema == null) return false

    if (path.length === 0 && (schema.type === 'primitive' || schema.type === undefined)) return schema.toBytes === LONG;

    if (schema.type === 'object') return go(path.slice(1), schema.schema.find(item => item.name === path[0]));

    if (schema.type === 'array') {
      return go(path.slice(1), schema.items)
    }

    if (schema.type === 'dataTxField'){
      if(path[0] !== 'value') return false
      const dataObj = resolvePath(fullPath.slice(0, fullPath.length -1), targetObject);
      const dataSchema = schema.items.get(dataObj.type)
      return go( path.slice(1), dataSchema)
    }

    if (schema.type === 'anyOf'){
      if (path[0] !== schema.discriminatorField || 'type'){
        return false
      }
      const obj = resolvePath(fullPath.slice(0, fullPath.length -1), targetObject);
      return go( path.slice(1), schema.items.get(obj[schema.discriminatorField || 'type']))
    }

    return false
  }
  return go(fullPath, fullSchema)

}


export function txToJson(tx: any): string {
  const path: string[] = [];
  const stack: any[] = [];

  const {type, version} = tx;
  const schema = getSchema(type, version);

  function stringifyValue(value: any): string | undefined {

    if (typeof value === 'string') {
      if (isLongProp(path, schema, tx)) {
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

  return stringifyValue(tx) || ''
}
