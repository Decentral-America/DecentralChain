import { type IConsole } from './logger.js';
import {
  ERRORS,
  SignerApiArgumentsError,
  SignerAuthError,
  SignerEnsureProviderError,
  type SignerError,
  SignerNetworkByteError,
  SignerNetworkError,
  SignerOptionsError,
  SignerProviderConnectError,
  SignerProviderInterfaceError,
  SignerProviderInternalError,
  SignerProviderSignIsNotSupport,
} from './SignerError.js';

const ERRORS_MAP = {
  [ERRORS.SIGNER_OPTIONS]: SignerOptionsError,
  [ERRORS.NETWORK_BYTE]: SignerNetworkByteError,
  [ERRORS.PROVIDER_INTERFACE]: SignerProviderInterfaceError,
  [ERRORS.API_ARGUMENTS]: SignerApiArgumentsError,
  [ERRORS.PROVIDER_CONNECT]: SignerProviderConnectError,
  [ERRORS.PROVIDER_SIGN_NOT_SUPPORTED]: SignerProviderSignIsNotSupport,
  [ERRORS.ENSURE_PROVIDER]: SignerEnsureProviderError,
  [ERRORS.PROVIDER_INTERNAL]: SignerProviderInternalError,
  [ERRORS.NOT_AUTHORIZED]: SignerAuthError,
  [ERRORS.NETWORK_ERROR]: SignerNetworkError,
};

export type ErrorHandler = <T extends keyof typeof ERRORS_MAP>(
  code: T,
  parameters: ConstructorParameters<(typeof ERRORS_MAP)[T]>,
) => SignerError;

export const errorHandlerFactory =
  (logger: IConsole): ErrorHandler =>
  (
    errorCode: keyof typeof ERRORS_MAP,
    parameters: ConstructorParameters<(typeof ERRORS_MAP)[typeof errorCode]>,
  ): SignerError => {
    const error = new (ERRORS_MAP[errorCode] as new (...args: unknown[]) => SignerError)(
      ...(parameters || []),
    );
    logger.error(error.toString());
    return error;
  };
