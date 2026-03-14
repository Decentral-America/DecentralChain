import { type AliasTransaction } from '@decentralchain/ts-types';
import { ALIAS, type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { gte, length, lte, pipe, prop } from '../utils/index.js';
import {
  charsInDictionary,
  createValidator,
  isString,
  requiredValidator,
  validate,
} from '../validators/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

export const alias = factory<IDCCGuiAlias, AliasTransaction<string>>({
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
