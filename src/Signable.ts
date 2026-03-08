import { BigNumber } from '@decentralchain/bignumber';
import { convert } from '@decentralchain/money-like-to-node';
import { libs } from '@decentralchain/transactions';
import { type Adapter } from './adapters';
import { ERRORS } from './constants';
import {
  DCC_ID,
  getValidateSchema,
  type IAdapterSignMethods,
  prepare,
  SIGN_TYPE,
  SIGN_TYPES,
  TRANSACTION_TYPE_NUMBER,
  type TSignData,
} from './prepareTx';
import { SignError } from './SignError';
import {
  currentCreateOrderFactory,
  currentFeeFactory,
  type IFeeConfig,
  isEmpty,
  last,
  normalizeAssetId,
} from './utils';

const { base58Encode, blake2b, verifySignature } = libs.crypto;

export class Signable {
  public readonly type: SIGN_TYPE;
  private readonly _forSign: TSignData;
  private readonly _adapter: Adapter;
  private readonly _bytePromise: Promise<Uint8Array>;
  private readonly _signMethod: keyof IAdapterSignMethods = 'signRequest';
  private _signPromise: Promise<string> | undefined;
  private _addProofPromise: Promise<string> | undefined;
  private _preparedData: Record<string, any>;
  private _proofs: string[] = [];

  /** Maximum number of proofs allowed per transaction (protocol limit). */
  private static readonly MAX_PROOFS = 8;

  constructor(forSign: TSignData, adapter: Adapter) {
    const networkCode = adapter.getNetworkByte();
    this._forSign = { ...forSign };
    this.type = forSign.type;
    this._adapter = adapter;
    const prepareMap = getValidateSchema(networkCode)[forSign.type];

    if (!prepareMap) {
      throw new SignError(
        `Can't find prepare api for tx type "${forSign.type}"!`,
        ERRORS.UNKNOWN_SIGN_TYPE,
      );
    }

    this._forSign.data.timestamp = new Date(this._forSign.data.timestamp ?? Date.now()).getTime();

    if (this._forSign.data.proofs) {
      this._proofs = this._forSign.data.proofs.slice();
    }

    const availableVersions = adapter.getSignVersions()[forSign.type];

    if (availableVersions.length === 0) {
      throw new SignError(`Can't sign data with type ${this.type}`, ERRORS.NO_SUPPORTED_VERSIONS);
    }

    if (isEmpty(this._forSign.data.version)) {
      this._forSign.data.version = last(availableVersions);
    }

    const version = this._forSign.data.version;

    if (!availableVersions.includes(version)) {
      throw new SignError(
        `Can't sign data with type "${this.type}" and version "${version}"`,

        ERRORS.VERSION_IS_NOT_SUPPORTED,
      );
    }

    if (!SIGN_TYPES[forSign.type as SIGN_TYPE].getBytes[version]) {
      throw new SignError(
        `Can't find prepare api for tx type "${forSign.type}" with version ${version}!`,
        ERRORS.VERSION_IS_NOT_SUPPORTED,
      );
    }

    this._signMethod = SIGN_TYPES[forSign.type].adapter;

    try {
      this._preparedData = prepare.signSchema(prepareMap)(this._forSign.data as unknown as Record<string, unknown>, true);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      throw new SignError(message, ERRORS.VALIDATION_FAILED, e);
    }

    this._bytePromise = this.getSignData().then(
      (signData) => SIGN_TYPES[forSign.type].getBytes[version]!(signData),
    );
  }

  public async getOrderFee(
    config: IFeeConfig,
    minOrderFee: BigNumber,
    hasMatcherScript: boolean,
    smartAssetIdList?: string[],
  ) {
    if (this._forSign.type === SIGN_TYPE.CREATE_ORDER) {
      const currentFee = currentCreateOrderFactory(config, minOrderFee);
      return currentFee(await this.getDataForApi(), hasMatcherScript, smartAssetIdList);
    }
  }

  public async getFee(config: IFeeConfig, hasScript: boolean, smartAssetIdList?: string[]) {
    const currentFee = currentFeeFactory(config);
    const txData = await this.getSignData();
    const bytes = await this.getBytes();
    return currentFee(txData as any, bytes, hasScript, smartAssetIdList);
  }

  public getTxData(): TSignData['data'] {
    return { ...this._forSign.data };
  }

  public async getSignData(): Promise<Record<string, any>> {
    const senderPublicKey = await this._adapter.getPublicKey();
    const sender = await this._adapter.getAddress();
    const dataForBytes = {
      ...this._preparedData,
      senderPublicKey,
      sender,
      ...this._forSign.data,
      type: this._forSign.type,
    };
    const toNodeFn = SIGN_TYPES[this._forSign.type as SIGN_TYPE].toNode || null;
    const signData = toNodeFn?.(dataForBytes, this._adapter.getNetworkByte());

    return signData || dataForBytes;
  }

  public async getAssetIds(): Promise<string[]> {
    const transaction = await this.getSignData();
    const hash = Object.create(null);
    hash[DCC_ID] = true;
    hash[normalizeAssetId(transaction.feeAssetId)] = true;

    switch (transaction.type) {
      case SIGN_TYPE.CREATE_ORDER:
        hash[normalizeAssetId(transaction.matcherFeeAssetId)] = true;
        hash[normalizeAssetId(transaction.assetPair.amountAsset)] = true;
        hash[normalizeAssetId(transaction.assetPair.priceAsset)] = true;
        break;
      case TRANSACTION_TYPE_NUMBER.REISSUE:
      case TRANSACTION_TYPE_NUMBER.BURN:
      case TRANSACTION_TYPE_NUMBER.MASS_TRANSFER:
      case TRANSACTION_TYPE_NUMBER.SPONSORSHIP:
      case TRANSACTION_TYPE_NUMBER.TRANSFER:
        hash[normalizeAssetId(transaction.assetId)] = true;
        break;
      case TRANSACTION_TYPE_NUMBER.EXCHANGE:
        hash[normalizeAssetId(transaction.order1.assetPair.amountAsset)] = true;
        hash[normalizeAssetId(transaction.order1.assetPair.priceAsset)] = true;
        hash[normalizeAssetId(transaction.order1.matcherFeeAssetId)] = true;
        hash[normalizeAssetId(transaction.order2.matcherFeeAssetId)] = true;
        break;
      case TRANSACTION_TYPE_NUMBER.SCRIPT_INVOCATION:
        transaction.payment.forEach((payment: { assetId: string }) => {
          hash[normalizeAssetId(payment.assetId)] = true;
        });
        break;
    }
    return Object.keys(hash);
  }

  public sign2fa(options: ISign2faOptions): Promise<Signable> {
    const code = options.code;

    return this._adapter
      .getAddress()
      .then((address) => {
        return options.request({
          address,
          code,
          signData: this._forSign,
        });
      })
      .then((signature) => {
        this.addProof(signature);

        return this;
      });
  }

  public addProof(signature: string): this {
    if (!signature || typeof signature !== 'string' || signature.trim().length === 0) {
      throw new SignError(
        'Invalid signature: must be a non-empty string',
        ERRORS.VALIDATION_FAILED,
      );
    }
    if (this._proofs.length >= Signable.MAX_PROOFS) {
      throw new SignError(
        `Maximum proof count (${Signable.MAX_PROOFS}) reached`,
        ERRORS.VALIDATION_FAILED,
      );
    }
    if (!this._proofs.includes(signature)) {
      this._proofs.push(signature);
    }

    return this;
  }

  public getHash() {
    return this._bytePromise.then((bytes) => base58Encode(blake2b(bytes)));
  }

  public getId(): Promise<string> {
    return this._bytePromise.then((bytes) => {
      const byteArr = Array.from(bytes);

      if (bytes[0] === 10) {
        bytes = new Uint8Array([byteArr[0] as number, ...byteArr.slice(36, -16)]);
      }

      return base58Encode(blake2b(bytes));
    });
  }

  public sign(): Promise<Signable> {
    this._makeSignPromise();
    return this._signPromise?.then(() => this) as Promise<Signable>;
  }

  public getSignature(): Promise<string> {
    this._makeSignPromise();
    return this._signPromise as Promise<string>;
  }

  public getBytes() {
    return this._bytePromise;
  }

  public getMyProofs(): Promise<string[]> {
    return Promise.all([this.getBytes(), this._adapter.getPublicKey()]).then(
      ([bytes, publicKey]) => {
        return this._proofs.filter((signature) => {
          try {
            return verifySignature(publicKey, bytes, signature);
          } catch {
            return false;
          }
        });
      },
    );
  }

  public hasMySignature(): Promise<boolean> {
    return this.getMyProofs().then((proofs) => !!proofs.length);
  }

  public addMyProof(): Promise<string> {
    if (this._addProofPromise) {
      return this._addProofPromise;
    }

    this._addProofPromise = this.hasMySignature()
      .then((hasMySignature) => {
        if (!hasMySignature) {
          return this.getSignature().then((signature) => {
            this.addProof(signature);
            return signature;
          });
        } else {
          return this.getMyProofs().then((list) => list[list.length - 1] as string);
        }
      })
      .finally(() => {
        this._addProofPromise = undefined;
      });

    return this._addProofPromise;
  }

  public async getDataForApi(needSign = true) {
    const data = await this.getSignData();
    if (needSign) {
      await this.addMyProof();
    }
    const proofs = (this._proofs || []).slice();

    try {
      return convert({ ...data, proofs } as any, (item: unknown) => new BigNumber(item as string));
    } catch {
      return { ...data, proofs, signature: proofs[0] };
    }
  }

  private _makeSignPromise(): this {
    if (!this._signPromise) {
      this._signPromise = this._bytePromise.then((bytes) => {
        if (this._signMethod === 'signRequest')
          return this._adapter.signRequest(bytes, this._forSign);
        else
          return this._adapter[this._signMethod](
            bytes,
            {
              amountPrecision: this._getAmountPrecision(),
              amount2Precision: this._getAmount2Precision(),
              feePrecision: this._getFeePrecision(),
            },
            this._forSign,
          );
      });

      this._signPromise.catch(() => {
        this._signPromise = undefined;
      });
    }
    return this;
  }

  private _getAmountPrecision() {
    const data = this._forSign.data as any;
    if (data.type === TRANSACTION_TYPE_NUMBER.SCRIPT_INVOCATION) {
      const payment = data.payment ?? [];
      return payment.length && payment[0]?.asset
        ? payment[0].asset.precision
        : 0;
    }
    return data.amount?.asset?.precision ?? 0;
  }

  private _getAmount2Precision() {
    const data = this._forSign.data as any;
    const payment = data.payment ?? [];
    return payment.length === 2 && payment[1]?.asset
      ? payment[1].asset.precision
      : 0;
  }

  private _getFeePrecision() {
    const data = this._forSign.data as any;
    return data.fee?.asset?.precision ?? 0;
  }
}

export interface ISign2faOptions {
  code: string;
  request(data: unknown): Promise<string>;
}
