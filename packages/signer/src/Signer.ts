import { broadcastTx, getNetworkByte, waitForTx } from '@decentralchain/node-api-js';
import { fetchBalanceDetails } from '@decentralchain/node-api-js/api-node/addresses';
import { fetchAssetsBalance } from '@decentralchain/node-api-js/api-node/assets';
import {
  type SignedTransaction,
  TRANSACTION_TYPE,
  type Transaction,
  type TransactionType,
  type WithApiMixin,
} from '@decentralchain/ts-types';
import { DEFAULT_OPTIONS } from './constants.js';
import {
  catchProviderError,
  checkAuthAsync,
  ensureProvider,
  ensureProviderAsync,
} from './decorators.js';
import { type ErrorHandler, errorHandlerFactory } from './helpers.js';
import { type IConsole, makeConsole, makeOptions } from './logger.js';
import { ERRORS } from './SignerError.js';
import { type ChainApi1stCall } from './types/api.js';
import {
  type AliasArgs,
  type AuthEvents,
  type Balance,
  type BroadcastedTx,
  type BroadcastOptions,
  type BurnArgs,
  type CancelLeaseArgs,
  type DataArgs,
  type ExchangeArgs,
  type Handler,
  type InvokeArgs,
  type IssueArgs,
  type LeaseArgs,
  type MassTransferArgs,
  type Provider,
  type ReissueArgs,
  type SetAssetScriptArgs,
  type SetScriptArgs,
  type SignedTx,
  type SignerAliasTx,
  type SignerBurnTx,
  type SignerCancelLeaseTx,
  type SignerDataTx,
  type SignerExchangeTx,
  type SignerInvokeTx,
  type SignerIssueTx,
  type SignerLeaseTx,
  type SignerMassTransferTx,
  type SignerOptions,
  type SignerReissueTx,
  type SignerSetAssetScriptTx,
  type SignerSetScriptTx,
  type SignerSponsorshipTx,
  type SignerTransferTx,
  type SignerTx,
  type SignerUpdateAssetInfoTx,
  type SponsorshipArgs,
  type TOrderArgs,
  type TransferArgs,
  type TSignedOrder,
  type TypedData,
  type UpdateAssetInfoArgs,
  type UserData,
} from './types/index.js';
import { argsValidators, validateProviderInterface, validateSignerOptions } from './validation.js';

/**
 * Convert a raw integer-string balance (e.g. "100000000") into a human-readable
 * token amount (e.g. 1.0) using integer arithmetic to avoid floating-point
 * precision loss. Falls back gracefully for non-integer strings.
 */
function safeTokens(raw: string, decimals: number): number {
  if (decimals === 0) return Number(raw);
  const str = raw.replace(/^-/, '');
  const isNeg = raw.startsWith('-');
  const padded = str.padStart(decimals + 1, '0');
  const intPart = padded.slice(0, padded.length - decimals);
  const fracPart = padded.slice(padded.length - decimals);
  const result = parseFloat(`${intPart}.${fracPart}`);
  return isNeg ? -result : result;
}

export * from './types/index.js';

export class Signer {
  public currentProvider: Provider | undefined;
  private _userData: UserData | undefined;
  private __connectPromise: Promise<Provider> | undefined;
  private _settingProvider = false;
  private readonly _options: SignerOptions;
  private readonly _networkBytePromise: Promise<number>;
  private readonly _logger: IConsole;
  private readonly _handleError: ErrorHandler;

  private get _connectPromise(): Promise<Provider> {
    return this.__connectPromise ?? Promise.reject(new Error('Has no provider!'));
  }

  private set _connectPromise(promise: Promise<Provider>) {
    this.__connectPromise = promise;
  }

  constructor(options?: Partial<SignerOptions>) {
    this._logger = makeConsole(makeOptions(options?.LOG_LEVEL ?? 'production', 'Signer'));

    this._handleError = errorHandlerFactory(this._logger);

    this._options = { ...DEFAULT_OPTIONS, ...(options ?? {}) };

    const { isValid, invalidOptions } = validateSignerOptions(this._options);

    if (!isValid) {
      const error = this._handleError(ERRORS.SIGNER_OPTIONS, [invalidOptions]);
      throw error;
    }

    const makeNetworkByteError = (e: unknown) => {
      const message = e instanceof Error ? e.message : String(e);
      const error = this._handleError(ERRORS.NETWORK_BYTE, [
        { error: message, node: this._options.NODE_URL },
      ]);
      this._logger.error(error);
      return error;
    };

    try {
      this._networkBytePromise = getNetworkByte(this._options.NODE_URL).catch((e: unknown) =>
        Promise.reject(makeNetworkByteError(e)),
      );
    } catch (e: unknown) {
      throw makeNetworkByteError(e);
    }

    this._logger.info('Signer instance created.');
  }

  // ---------------------------------------------------------------------------
  // Event handling
  // ---------------------------------------------------------------------------

  @ensureProvider
  public on<EVENT extends keyof AuthEvents>(
    event: EVENT,
    handler: Handler<AuthEvents[EVENT]>,
  ): Signer {
    this.currentProvider?.on(event, handler);
    this._logger.info(`Handler for "${event}" has been added.`);
    return this;
  }

  @ensureProvider
  public once<EVENT extends keyof AuthEvents>(
    event: EVENT,
    handler: Handler<AuthEvents[EVENT]>,
  ): Signer {
    this.currentProvider?.once(event, handler);
    this._logger.info(`One-Time handler for "${event}" has been added.`);
    return this;
  }

  @ensureProvider
  public off<EVENT extends keyof AuthEvents>(
    event: EVENT,
    handler: Handler<AuthEvents[EVENT]>,
  ): Signer {
    this.currentProvider?.off(event, handler);
    this._logger.info(`Handler for "${event}" has been removed.`);
    return this;
  }

  // ---------------------------------------------------------------------------
  // Broadcast
  // ---------------------------------------------------------------------------

  public broadcast<T extends SignerTx>(
    toBroadcast: SignedTx<T>,
    options?: BroadcastOptions,
  ): Promise<BroadcastedTx<SignedTx<T>>>;
  public broadcast<T extends SignerTx>(
    toBroadcast: Array<SignedTx<T>>,
    options?: BroadcastOptions,
  ): Promise<BroadcastedTx<SignedTx<T>[]>>;
  public broadcast<T extends SignerTx>(
    toBroadcast: SignedTx<T> | Array<SignedTx<T>>,
    options?: BroadcastOptions,
  ): Promise<BroadcastedTx<SignedTx<T>> | BroadcastedTx<Array<SignedTx<T>>>> {
    if (Array.isArray(toBroadcast)) {
      return this._broadcastWire(toBroadcast);
    }
    return this._broadcastWire(toBroadcast, options);
  }

  /** Retrieve the network byte for the configured node. */
  public getNetworkByte(): Promise<number> {
    return this._networkBytePromise;
  }

  // ---------------------------------------------------------------------------
  // Provider management
  // ---------------------------------------------------------------------------

  /**
   * Set the signing provider.
   *
   * ```ts
   * import Signer from '@decentralchain/signer';
   * import Provider from '@decentralchain/seed-provider';
   *
   * const signer = new Signer();
   * signer.setProvider(new Provider('SEED'));
   * ```
   */
  public async setProvider(provider: Provider): Promise<void> {
    // Reentrancy guard – prevent concurrent setProvider calls from corrupting state
    if (this._settingProvider) {
      throw new Error(
        'setProvider is already in progress. Wait for the previous call to complete.',
      );
    }
    this._settingProvider = true;

    try {
      const providerValidation = validateProviderInterface(provider);

      if (!providerValidation.isValid) {
        const error = this._handleError(ERRORS.PROVIDER_INTERFACE, [
          providerValidation.invalidProperties,
        ]);
        throw error;
      }

      this.currentProvider = provider;
      this._logger.info('Provider has been set.');

      this._connectPromise = this._networkBytePromise.then(async (byte) => {
        try {
          await provider.connect({
            NETWORK_BYTE: byte,
            NODE_URL: this._options.NODE_URL,
          });
          this._logger.info('Provider has connected to node.');
          return provider;
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : String(e);
          const error = this._handleError(ERRORS.PROVIDER_CONNECT, [
            { error: message, node: this._options.NODE_URL },
          ]);
          this._logger.error(error);
          throw error;
        }
      });
    } finally {
      this._settingProvider = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Balances
  // ---------------------------------------------------------------------------

  /**
   * Retrieve the user's balances. Requires prior login.
   *
   * ```ts
   * await signer.getBalance();
   * ```
   */
  @ensureProviderAsync
  @checkAuthAsync
  public getBalance(): Promise<Array<Balance>> {
    const userData = this._userData;
    if (!userData) return Promise.reject(new Error('User not authenticated'));
    return Promise.all([
      fetchBalanceDetails(this._options.NODE_URL, userData.address).then((data) => ({
        amount: String(data.available),
        assetId: 'DCC',
        assetName: 'DCC',
        decimals: 8,
        isMyAsset: false,
        isSmart: false,
        sponsorship: null,
        tokens: safeTokens(String(data.available), 8),
      })),
      fetchAssetsBalance(this._options.NODE_URL, userData.address).then((data) =>
        data.balances.map((item) => {
          const issueTx = item.issueTransaction;
          return {
            amount: String(item.balance),
            assetId: item.assetId,
            assetName: issueTx?.name ?? '',
            decimals: issueTx?.decimals ?? 0,
            isMyAsset: issueTx?.sender === this._userData?.address,
            isSmart: !!issueTx?.script,
            sponsorship:
              item.sponsorBalance != null &&
              Number(item.sponsorBalance) > 10 ** 8 &&
              Number(item.minSponsoredAssetFee ?? 0) < Number(item.balance)
                ? item.minSponsoredAssetFee
                : null,
            tokens: safeTokens(String(item.balance), issueTx?.decimals ?? 0),
          };
        }),
      ),
    ]).then(([native, assets]) => [native, ...assets]);
  }

  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  /**
   * Log in via the current provider. Returns the user's address and public key.
   *
   * NOTE: The provider's `login` method is invoked synchronously within this
   * call context — do not introduce additional async wrapping.
   *
   * ```ts
   * await signer.login();
   * ```
   */
  @ensureProviderAsync
  public login(): Promise<UserData> {
    const provider = this.currentProvider;
    if (!provider) throw new Error('Provider not set');
    return provider
      .login()
      .then((data) => {
        this._logger.info('Logged in.');
        this._userData = data;
        return data;
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.message === 'User rejection!') {
          throw err;
        }
        const message = err instanceof Error ? err.message : String(err);
        const error = this._handleError(ERRORS.PROVIDER_INTERNAL, [message]);
        throw error;
      });
  }

  /** Log out the current user. */
  @ensureProviderAsync
  public async logout(): Promise<void> {
    await this._connectPromise;

    try {
      await this.currentProvider?.logout();
      this._userData = undefined;
      this._logger.info('Logged out.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      const error = this._handleError(ERRORS.PROVIDER_INTERNAL, [message]);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Signing helpers
  // ---------------------------------------------------------------------------

  /** Sign a message (the provider may add a prefix). */
  @ensureProviderAsync
  public signMessage(message: string | number): Promise<string> {
    return this._connectPromise.then((provider) => provider.signMessage(message));
  }

  /** Sign an exchange order. */
  @ensureProviderAsync
  public signOrder(order: TOrderArgs): Promise<TSignedOrder> {
    return this._connectPromise.then((provider) => provider.signOrder(order));
  }

  /** Sign typed data. */
  @ensureProviderAsync
  public signTypedData(data: Array<TypedData>): Promise<string> {
    return this._connectPromise.then((provider) => provider.signTypedData(data));
  }

  // ---------------------------------------------------------------------------
  // Sponsorship helpers
  // ---------------------------------------------------------------------------

  /** Retrieve balances eligible for fee sponsorship. */
  public getSponsoredBalances(): Promise<Balance[]> {
    return this.getBalance().then((balance) => balance.filter((item) => !!item.sponsorship));
  }

  // ---------------------------------------------------------------------------
  // Batch API
  // ---------------------------------------------------------------------------

  public batch(tsx: SignerTx[]) {
    const sign = (): Promise<SignedTx<SignerTx>[]> => this._sign(tsx).then((result) => result);

    return {
      broadcast: (opt?: BroadcastOptions): Promise<BroadcastedTx<SignedTx<SignerTx>>[]> =>
        sign().then((transactions) => this.broadcast(transactions, opt)),
      sign,
    };
  }

  // ---------------------------------------------------------------------------
  // Transaction builders — public entry points
  // ---------------------------------------------------------------------------

  public issue(data: IssueArgs): ChainApi1stCall<SignerIssueTx> {
    return this._issue([])(data);
  }

  public transfer(data: TransferArgs): ChainApi1stCall<SignerTransferTx> {
    return this._transfer([])(data);
  }

  public reissue(data: ReissueArgs): ChainApi1stCall<SignerReissueTx> {
    return this._reissue([])(data);
  }

  public burn(data: BurnArgs): ChainApi1stCall<SignerBurnTx> {
    return this._burn([])(data);
  }

  public lease(data: LeaseArgs): ChainApi1stCall<SignerLeaseTx> {
    return this._lease([])(data);
  }

  public exchange(data: ExchangeArgs): ChainApi1stCall<SignerExchangeTx> {
    return this._exchange([])(data);
  }

  public cancelLease(data: CancelLeaseArgs): ChainApi1stCall<SignerCancelLeaseTx> {
    return this._cancelLease([])(data);
  }

  public alias(data: AliasArgs): ChainApi1stCall<SignerAliasTx> {
    return this._alias([])(data);
  }

  public massTransfer(data: MassTransferArgs): ChainApi1stCall<SignerMassTransferTx> {
    return this._massTransfer([])(data);
  }

  public data(data: DataArgs): ChainApi1stCall<SignerDataTx> {
    return this._data([])(data);
  }

  public sponsorship(data: SponsorshipArgs): ChainApi1stCall<SignerSponsorshipTx> {
    return this._sponsorship([])(data);
  }

  public setScript(data: SetScriptArgs): ChainApi1stCall<SignerSetScriptTx> {
    return this._setScript([])(data);
  }

  public setAssetScript(data: SetAssetScriptArgs): ChainApi1stCall<SignerSetAssetScriptTx> {
    return this._setAssetScript([])(data);
  }

  public invoke(data: InvokeArgs): ChainApi1stCall<SignerInvokeTx> {
    return this._invoke([])(data);
  }

  public updateAssetInfo(data: UpdateAssetInfoArgs): ChainApi1stCall<SignerUpdateAssetInfoTx> {
    return this._updateAssetInfo([])(data);
  }

  // ---------------------------------------------------------------------------
  // Wait for confirmation
  // ---------------------------------------------------------------------------

  /** Wait for a single transaction to reach the specified confirmation depth. */
  public waitTxConfirm<T extends Transaction & WithApiMixin>(
    tx: T,
    confirmations: number,
  ): Promise<T>;
  /** Wait for multiple transactions to reach the specified confirmation depth. */
  public waitTxConfirm<T extends Transaction & WithApiMixin>(
    tx: T[],
    confirmations: number,
  ): Promise<T[]>;
  public waitTxConfirm<T extends Transaction & WithApiMixin>(
    tx: T | T[],
    confirmations: number,
  ): Promise<T | T[]> {
    if (Array.isArray(tx)) {
      return waitForTx(this._options.NODE_URL, tx, { confirmations });
    }
    return waitForTx(this._options.NODE_URL, tx, { confirmations });
  }

  // ---------------------------------------------------------------------------
  // Private — transaction builder closures
  // ---------------------------------------------------------------------------

  private readonly _issue =
    (txList: SignerTx[]) =>
    (data: IssueArgs): ChainApi1stCall<SignerIssueTx> =>
      this._createPipelineAPI<SignerIssueTx>(txList, {
        ...data,
        type: TRANSACTION_TYPE.ISSUE,
      });

  private readonly _transfer =
    (txList: SignerTx[]) =>
    (data: TransferArgs): ChainApi1stCall<SignerTransferTx> =>
      this._createPipelineAPI<SignerTransferTx>(txList, {
        ...data,
        type: TRANSACTION_TYPE.TRANSFER,
      });

  private readonly _reissue =
    (txList: SignerTx[]) =>
    (data: ReissueArgs): ChainApi1stCall<SignerReissueTx> =>
      this._createPipelineAPI<SignerReissueTx>(txList, {
        ...data,
        type: TRANSACTION_TYPE.REISSUE,
      });

  private readonly _burn =
    (txList: SignerTx[]) =>
    (data: BurnArgs): ChainApi1stCall<SignerBurnTx> =>
      this._createPipelineAPI<SignerBurnTx>(txList, {
        ...data,
        type: TRANSACTION_TYPE.BURN,
      });

  private readonly _lease =
    (txList: SignerTx[]) =>
    (data: LeaseArgs): ChainApi1stCall<SignerLeaseTx> =>
      this._createPipelineAPI<SignerLeaseTx>(txList, {
        ...data,
        type: TRANSACTION_TYPE.LEASE,
      });

  private readonly _exchange =
    (txList: SignerTx[]) =>
    (data: ExchangeArgs): ChainApi1stCall<SignerExchangeTx> =>
      this._createPipelineAPI<SignerExchangeTx>(txList, {
        ...data,
        type: TRANSACTION_TYPE.EXCHANGE,
      });

  private readonly _cancelLease =
    (txList: SignerTx[]) =>
    (data: CancelLeaseArgs): ChainApi1stCall<SignerCancelLeaseTx> =>
      this._createPipelineAPI<SignerCancelLeaseTx>(txList, {
        ...data,
        type: TRANSACTION_TYPE.CANCEL_LEASE,
      });

  private readonly _alias =
    (txList: SignerTx[]) =>
    (data: AliasArgs): ChainApi1stCall<SignerAliasTx> =>
      this._createPipelineAPI<SignerAliasTx>(txList, {
        ...data,
        type: TRANSACTION_TYPE.ALIAS,
      });

  private readonly _massTransfer =
    (txList: SignerTx[]) =>
    (data: MassTransferArgs): ChainApi1stCall<SignerMassTransferTx> =>
      this._createPipelineAPI<SignerMassTransferTx>(txList, {
        ...data,
        type: TRANSACTION_TYPE.MASS_TRANSFER,
      });

  private readonly _data =
    (txList: SignerTx[]) =>
    (data: DataArgs): ChainApi1stCall<SignerDataTx> =>
      this._createPipelineAPI<SignerDataTx>(txList, {
        ...data,
        type: TRANSACTION_TYPE.DATA,
      });

  private readonly _sponsorship =
    (txList: SignerTx[]) =>
    (data: SponsorshipArgs): ChainApi1stCall<SignerSponsorshipTx> =>
      this._createPipelineAPI<SignerSponsorshipTx>(txList, {
        ...data,
        type: TRANSACTION_TYPE.SPONSORSHIP,
      });

  private readonly _setScript =
    (txList: SignerTx[]) =>
    (data: SetScriptArgs): ChainApi1stCall<SignerSetScriptTx> =>
      this._createPipelineAPI<SignerSetScriptTx>(txList, {
        ...data,
        type: TRANSACTION_TYPE.SET_SCRIPT,
      });

  private readonly _setAssetScript =
    (txList: SignerTx[]) =>
    (data: SetAssetScriptArgs): ChainApi1stCall<SignerSetAssetScriptTx> =>
      this._createPipelineAPI<SignerSetAssetScriptTx>(txList, {
        ...data,
        type: TRANSACTION_TYPE.SET_ASSET_SCRIPT,
      });

  private readonly _invoke =
    (txList: SignerTx[]) =>
    (data: InvokeArgs): ChainApi1stCall<SignerInvokeTx> =>
      this._createPipelineAPI<SignerInvokeTx>(txList, {
        ...data,
        type: TRANSACTION_TYPE.INVOKE_SCRIPT,
      });

  private readonly _updateAssetInfo =
    (txList: SignerTx[]) =>
    (data: UpdateAssetInfoArgs): ChainApi1stCall<SignerUpdateAssetInfoTx> =>
      this._createPipelineAPI<SignerUpdateAssetInfoTx>(txList, {
        ...data,
        type: TRANSACTION_TYPE.UPDATE_ASSET_INFO,
      });

  // ---------------------------------------------------------------------------
  // Private — pipeline API factory
  // ---------------------------------------------------------------------------

  private _createPipelineAPI<T extends SignerTx>(
    prevCallTxList: SignerTx[],
    signerTx: T,
  ): ChainApi1stCall<T> {
    const _this = this;
    const txs = prevCallTxList.length ? [...prevCallTxList, signerTx] : [signerTx];
    const chainArgs = Array.isArray(txs) ? txs : [txs];

    return {
      alias: this._alias(chainArgs),
      broadcast(options?: BroadcastOptions) {
        if (_this.currentProvider?.isSignAndBroadcastByProvider === true) {
          // isSignAndBroadcastByProvider: the provider signs AND broadcasts atomically.
          // Its sign() returns BroadcastedTx<SignedTx<T>> at runtime — a contract not
          // expressible in Provider.sign's declared type. See _broadcastWire for the
          // same pattern isolated at the node-api-js boundary.
          return _this.currentProvider.sign(txs as T[]) as Promise<BroadcastedTx<SignedTx<T>>>;
        }

        return _this._sign(txs).then((signed) => _this._broadcastWire(signed, options));
      },
      burn: this._burn(chainArgs),
      cancelLease: this._cancelLease(chainArgs),
      data: this._data(chainArgs),
      exchange: this._exchange(chainArgs),
      invoke: this._invoke(chainArgs),
      issue: this._issue(chainArgs),
      lease: this._lease(chainArgs),
      massTransfer: this._massTransfer(chainArgs),
      reissue: this._reissue(chainArgs),
      setAssetScript: this._setAssetScript(chainArgs),
      setScript: this._setScript(chainArgs),
      sign: () => _this._sign(txs),
      sponsorship: this._sponsorship(chainArgs),
      transfer: this._transfer(chainArgs),
      updateAssetInfo: this._updateAssetInfo(chainArgs),
    } as unknown as ChainApi1stCall<T>;
  }

  // ---------------------------------------------------------------------------
  // Private — validation
  // ---------------------------------------------------------------------------

  private _validate<T extends SignerTx>(toSign: T | T[]): { isValid: boolean; errors: string[] } {
    const signerTxs = Array.isArray(toSign) ? toSign : [toSign];

    const validateTx = (tx: SignerTx) => {
      const validatorFn = argsValidators[tx.type];
      if (!validatorFn) {
        return {
          invalidFields: [] as string[],
          isValid: false,
          method: 'unknown',
          transaction: tx,
        };
      }
      return validatorFn(tx);
    };
    const knownTxPredicate = (type: TransactionType) =>
      Object.keys(argsValidators).includes(String(type));

    const unknownTxs = signerTxs.filter(({ type }) => !knownTxPredicate(type));
    const knownTxs = signerTxs.filter(({ type }) => knownTxPredicate(type));

    const invalidTxs = knownTxs.map(validateTx).filter(({ isValid }) => !isValid);

    if (invalidTxs.length === 0 && unknownTxs.length === 0) {
      return { errors: [], isValid: true };
    }

    return {
      errors: [
        ...invalidTxs.map(
          ({ method: scope, invalidFields }) =>
            `Validation error for ${scope} transaction. Invalid arguments: ${invalidFields?.join(', ')}`,
        ),
        ...unknownTxs.map((tx) => `Validation error: unknown transaction type ${String(tx.type)}`),
      ],
      isValid: false,
    };
  }

  // ---------------------------------------------------------------------------
  // Private — sign
  // ---------------------------------------------------------------------------

  private _sign<T extends SignerTx>(toSign: T): Promise<SignedTx<T>>;
  private _sign<T extends SignerTx>(toSign: T[]): Promise<[SignedTx<T>]>;
  @catchProviderError
  private _sign<T extends SignerTx>(toSign: T[]): Promise<SignedTx<T>[]> {
    const validation = this._validate(toSign);

    if (this.currentProvider?.isSignAndBroadcastByProvider === true) {
      const error = this._handleError(ERRORS.PROVIDER_SIGN_NOT_SUPPORTED, [
        { error: 'PROVIDER_SIGN_NOT_SUPPORTED', node: this._options.NODE_URL },
      ]);
      throw error;
    }

    if (validation.isValid) {
      // Provider.sign(T[]) overload returns Promise<Array<SignedTx<T>>> — no cast needed.
      return this._connectPromise.then((provider) => provider.sign(toSign));
    }

    const error = this._handleError(ERRORS.API_ARGUMENTS, [validation.errors]);
    throw error;
  }

  // ---------------------------------------------------------------------------
  // Private — broadcastTx wire bridge
  // ---------------------------------------------------------------------------

  /**
   * Isolated escape hatch for the cross-package type boundary between
   * SignedTx<T> (signer-internal) and SignedTransaction<Transaction> (node-api-js).
   *
   * SignedTx<T> = SignedTransaction<TransactionMap[T['type']]> & WithId, which is
   * structurally a SignedTransaction<Transaction> in every concrete case.
   * TypeScript cannot prove this without materialising T['type'] at compile time —
   * hence this single private method is the sole location of `as unknown as` in
   * the broadcast path.
   */
  private _broadcastWire<T extends SignerTx>(
    tx: SignedTx<T>,
    options?: BroadcastOptions,
  ): Promise<BroadcastedTx<SignedTx<T>>>;
  private _broadcastWire<T extends SignerTx>(
    txs: Array<SignedTx<T>>,
    options?: BroadcastOptions,
  ): Promise<BroadcastedTx<SignedTx<T>[]>>;
  private _broadcastWire<T extends SignerTx>(
    txOrArr: SignedTx<T> | Array<SignedTx<T>>,
    options?: BroadcastOptions,
  ): Promise<BroadcastedTx<SignedTx<T>> | BroadcastedTx<SignedTx<T>[]>> {
    if (Array.isArray(txOrArr)) {
      return broadcastTx(
        this._options.NODE_URL,
        txOrArr as unknown as SignedTransaction<Transaction>[],
      ) as unknown as Promise<BroadcastedTx<SignedTx<T>[]>>;
    }
    return broadcastTx(
      this._options.NODE_URL,
      txOrArr as unknown as SignedTransaction<Transaction>,
      options,
    ) as unknown as Promise<BroadcastedTx<SignedTx<T>>>;
  }
}
