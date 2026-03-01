import type { IAliasTransaction } from '@decentralchain/ts-types';
import { ALIAS, type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type IDefaultGuiTx, getDefaultTransform } from './general.js';
import { prop, pipe, length, lte, gte } from '../utils/index.js';
import {
  charsInDictionary,
  createValidator,
  isString,
  requiredValidator,
  validate,
} from '../validators/index.js';

export const alias = factory<IDCCGuiAlias, IAliasTransaction<string>>({
  ...getDefaultTransform(),
  alias: pipe(
    prop('alias'),
    validate(
      requiredValidator('alias'),
      createValidator(isString, 'Alias is not a string!'),
      createValidator(
        pipe(length, gte(ALIAS.MAX_ALIAS_LENGTH)),
        `Alias max length is ${ALIAS.MAX_ALIAS_LENGTH}`,
      ),
      createValidator(
        pipe(length, lte(ALIAS.MIN_ALIAS_LENGTH)),
        `Alias min length is ${ALIAS.MIN_ALIAS_LENGTH}`,
      ),
      createValidator(
        charsInDictionary(ALIAS.AVAILABLE_CHARS),
        `Available alias chars is "${ALIAS.AVAILABLE_CHARS}"`,
      ),
    ),
  ),
});

export interface IDCCGuiAlias extends IDefaultGuiTx<typeof TYPES.ALIAS> {
  alias: string;
}
