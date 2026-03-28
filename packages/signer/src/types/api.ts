/**
 * Fluent pipeline types for Signer's chained transaction API.
 *
 *   signer.transfer({…}).issue({…}).sign()
 *
 * Uses TypeScript 4.0+ variadic tuple types to accumulate the transaction
 * tuple as each call is chained. TypeScript evaluates interface method return
 * types lazily — ChainApiCall references itself in return position only, so
 * there is no circular instantiation at definition time.
 */
import {
  type AliasArgs,
  type BroadcastedTx,
  type BroadcastOptions,
  type BurnArgs,
  type CancelLeaseArgs,
  type DataArgs,
  type ExchangeArgs,
  type InvokeArgs,
  type IssueArgs,
  type LeaseArgs,
  type MassTransferArgs,
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
  type SignerReissueTx,
  type SignerSetAssetScriptTx,
  type SignerSetScriptTx,
  type SignerSponsorshipTx,
  type SignerTransferTx,
  type SignerTx,
  type SignerUpdateAssetInfoTx,
  type SponsorshipArgs,
  type TransferArgs,
  type UpdateAssetInfoArgs,
} from './index.js';

/**
 * When the pipeline accumulates exactly one transaction, sign() returns the
 * single signed object directly — not a one-element tuple — preserving the
 * original ChainApi1stCall<Q>.sign(): Promise<SignedTx<Q>> contract.
 */
type UnwrapSingle<T extends SignerTx[]> = T extends [infer Only extends SignerTx] ? Only : T;

/**
 * Recursive fluent pipeline interface.
 *
 * Each transaction method appends its SignerTx to the Acc tuple, growing the
 * inferred type one entry per chained call. The interface form guarantees lazy
 * evaluation — TypeScript never expands ChainApiCall at definition time, only
 * when a call site is reached.
 *
 * Example:
 *   const result = await signer.transfer({…}).issue({…}).sign();
 *   //    ^— [SignedTransferTx, SignedIssueTx]  (fully typed tuple)
 */
export interface ChainApiCall<Acc extends SignerTx[]> {
  alias(data: AliasArgs): ChainApiCall<[...Acc, SignerAliasTx]>;
  burn(data: BurnArgs): ChainApiCall<[...Acc, SignerBurnTx]>;
  cancelLease(data: CancelLeaseArgs): ChainApiCall<[...Acc, SignerCancelLeaseTx]>;
  data(data: DataArgs): ChainApiCall<[...Acc, SignerDataTx]>;
  exchange(data: ExchangeArgs): ChainApiCall<[...Acc, SignerExchangeTx]>;
  invoke(data: InvokeArgs): ChainApiCall<[...Acc, SignerInvokeTx]>;
  issue(data: IssueArgs): ChainApiCall<[...Acc, SignerIssueTx]>;
  lease(data: LeaseArgs): ChainApiCall<[...Acc, SignerLeaseTx]>;
  massTransfer(data: MassTransferArgs): ChainApiCall<[...Acc, SignerMassTransferTx]>;
  reissue(data: ReissueArgs): ChainApiCall<[...Acc, SignerReissueTx]>;
  setAssetScript(data: SetAssetScriptArgs): ChainApiCall<[...Acc, SignerSetAssetScriptTx]>;
  setScript(data: SetScriptArgs): ChainApiCall<[...Acc, SignerSetScriptTx]>;
  sponsorship(data: SponsorshipArgs): ChainApiCall<[...Acc, SignerSponsorshipTx]>;
  transfer(data: TransferArgs): ChainApiCall<[...Acc, SignerTransferTx]>;
  updateAssetInfo(data: UpdateAssetInfoArgs): ChainApiCall<[...Acc, SignerUpdateAssetInfoTx]>;
  sign(): Promise<SignedTx<UnwrapSingle<Acc>>>;
  broadcast(options?: BroadcastOptions): Promise<BroadcastedTx<SignedTx<UnwrapSingle<Acc>>>>;
}

/** Entry-point alias used by Signer's public transaction builder methods. */
export type ChainApi1stCall<T extends SignerTx> = ChainApiCall<[T]>;
