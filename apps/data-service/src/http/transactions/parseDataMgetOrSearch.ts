import { BigNumber } from '@decentralchain/data-entities';
import { Either } from 'effect';
import { isNil } from 'ramda';
import { ParseError } from '../../errorHandling';
import { type DataEntryValue } from '../../services/transactions/data/repo/types';
import { type DataTxsServiceSearchRequest } from '../../services/transactions/data/types';
import { DataEntryType, type ServiceMgetRequest } from '../../types';
import { parseBool } from '../../utils/parsers/parseBool';
import { parseFilterValues, withDefaults } from '../_common/filters';
import commonFilters from '../_common/filters/filters';
import { type Parser } from '../_common/filters/types';
import { type HttpRequest } from '../_common/types';
import { isMgetRequest } from './_common';

const isDataEntryType = (raw: unknown): raw is DataEntryType =>
  [
    DataEntryType.Binary,
    DataEntryType.Boolean,
    DataEntryType.Integer,
    DataEntryType.String,
  ].includes(raw as DataEntryType);

function parseValue(
  type: typeof DataEntryType.Boolean,
  vs: string,
): Either.Either<boolean, ParseError>;
function parseValue(
  type: typeof DataEntryType.Integer,
  vs: string,
): Either.Either<BigNumber, ParseError>;
function parseValue(
  type: typeof DataEntryType.Binary | typeof DataEntryType.String,
  vs: string,
): Either.Either<string, ParseError>;
function parseValue(
  type: DataEntryType | undefined,
  vu: undefined,
): Either.Either<undefined, ParseError>;
function parseValue(
  type: DataEntryType | undefined,
  vu: string | undefined,
): Either.Either<DataEntryValue, ParseError>;

function parseValue(
  type?: DataEntryType,
  value?: string,
): Either.Either<DataEntryValue | undefined, ParseError> {
  if (type === undefined || value === undefined) return Either.right(undefined);
  if (type === DataEntryType.Boolean) return parseBool(value);
  else if (type === DataEntryType.Integer) {
    try {
      const v = new BigNumber(value);
      if (v.isNaN()) {
        throw new Error('Provided value is not a number');
      } else {
        return Either.right(v);
      }
    } catch (e) {
      return Either.left(new ParseError(e as Error | string));
    }
  } else return Either.right(value);
}

const parseDataEntryType: Parser<DataEntryType | undefined> = (raw) => {
  if (isNil(raw)) return Either.right(undefined);

  if (isDataEntryType(raw)) {
    return Either.right(raw);
  } else {
    return Either.left(new ParseError(new Error('Invalid type param value')));
  }
};

export const parseDataMgetOrSearch = ({
  query,
}: HttpRequest<string[]>): Either.Either<
  ServiceMgetRequest | DataTxsServiceSearchRequest,
  ParseError
> => {
  if (!query) {
    return Either.left(new ParseError(new Error('Query is empty')));
  }

  return (Either.flatMap as any)(
    parseFilterValues({
      key: commonFilters.query,
      type: parseDataEntryType,
      value: commonFilters.query,
    })(query),
    (fValues: any) => {
      if (isMgetRequest(fValues)) {
        return Either.right(fValues);
      } else {
        const fValuesWithDefaults = withDefaults(fValues);
        if (!isNil(fValuesWithDefaults.value) && isNil(fValuesWithDefaults.type)) {
          return Either.left(
            new ParseError(new Error('Type param has to be set with value param')),
          );
        }
        return Either.map(
          parseValue(fValuesWithDefaults.type, fValuesWithDefaults.value),
          (value) => ({
            ...fValuesWithDefaults,
            ...(value ? { value } : {}),
          }),
        );
      }
    },
  );
};
