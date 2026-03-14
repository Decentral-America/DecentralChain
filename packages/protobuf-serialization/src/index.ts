// Barrel re-export of all generated protobuf types, schemas, and enums.
// Consumers import directly: import { Transaction, TransactionSchema } from '@decentralchain/protobuf-serialization';

// Re-export @bufbuild/protobuf utilities for convenience
export { create, fromBinary, toBinary } from '@bufbuild/protobuf';
// Core types
export { type Amount, AmountSchema } from './gen/waves/amount_pb.js';
// Block types
export {
  type Block,
  type Block_Header,
  type Block_Header_ChallengedHeader,
  Block_Header_ChallengedHeaderSchema,
  Block_HeaderSchema,
  BlockSchema,
  type EndorseBlock,
  EndorseBlockSchema,
  type FinalizationVoting,
  FinalizationVotingSchema,
  type MicroBlock,
  MicroBlockSchema,
  type SignedMicroBlock,
  SignedMicroBlockSchema,
} from './gen/waves/block_pb.js';
// Events
export {
  type BlockchainUpdated,
  type BlockchainUpdated_Append,
  BlockchainUpdated_AppendSchema,
  type BlockchainUpdated_Rollback,
  BlockchainUpdated_Rollback_RollbackType,
  BlockchainUpdated_Rollback_RollbackTypeSchema,
  BlockchainUpdated_RollbackSchema,
  BlockchainUpdatedSchema,
  type StateUpdate,
  type StateUpdate_BalanceUpdate,
  StateUpdate_BalanceUpdateSchema,
  StateUpdateSchema,
} from './gen/waves/events/events_pb.js';
// Invoke script result
export {
  type InvokeScriptResult,
  type InvokeScriptResult_Burn,
  InvokeScriptResult_BurnSchema,
  type InvokeScriptResult_Call,
  type InvokeScriptResult_Call_Argument,
  InvokeScriptResult_Call_ArgumentSchema,
  InvokeScriptResult_CallSchema,
  type InvokeScriptResult_ErrorMessage,
  InvokeScriptResult_ErrorMessageSchema,
  type InvokeScriptResult_Invocation,
  InvokeScriptResult_InvocationSchema,
  type InvokeScriptResult_Issue,
  InvokeScriptResult_IssueSchema,
  type InvokeScriptResult_Lease,
  type InvokeScriptResult_LeaseCancel,
  InvokeScriptResult_LeaseCancelSchema,
  InvokeScriptResult_LeaseSchema,
  type InvokeScriptResult_Payment,
  InvokeScriptResult_PaymentSchema,
  type InvokeScriptResult_Reissue,
  InvokeScriptResult_ReissueSchema,
  type InvokeScriptResult_SponsorFee,
  InvokeScriptResult_SponsorFeeSchema,
  InvokeScriptResultSchema,
} from './gen/waves/invoke_script_result_pb.js';
// DApp meta
export type { DAppMeta } from './gen/waves/lang/dapp_meta_pb.js';
export {
  type DAppMeta_CallableFuncSignature,
  DAppMeta_CallableFuncSignatureSchema,
  DAppMetaSchema,
} from './gen/waves/lang/dapp_meta_pb.js';
// gRPC API types (transactions)
export {
  TransactionStatus_Status,
  TransactionStatus_StatusSchema,
} from './gen/waves/node/grpc/transactions_api_pb.js';
export {
  type AssetPair,
  AssetPairSchema,
  type Order,
  Order_PriceMode,
  Order_PriceModeSchema,
  Order_Side,
  Order_SideSchema,
  OrderSchema,
} from './gen/waves/order_pb.js';
export { type Recipient, RecipientSchema } from './gen/waves/recipient_pb.js';
// Reward
export { type RewardShare, RewardShareSchema } from './gen/waves/reward_share_pb.js';

// Block snapshot (state_snapshot.proto)
export {
  type BlockSnapshot,
  BlockSnapshotSchema,
} from './gen/waves/state_snapshot_pb.js';
// Transaction types
export {
  type BurnTransactionData,
  BurnTransactionDataSchema,
  type CommitToGenerationTransactionData,
  CommitToGenerationTransactionDataSchema,
  type CreateAliasTransactionData,
  CreateAliasTransactionDataSchema,
  type DataEntry,
  DataEntrySchema,
  type DataTransactionData,
  DataTransactionDataSchema,
  type ExchangeTransactionData,
  ExchangeTransactionDataSchema,
  type GenesisTransactionData,
  GenesisTransactionDataSchema,
  type InvokeExpressionTransactionData,
  InvokeExpressionTransactionDataSchema,
  type InvokeScriptTransactionData,
  InvokeScriptTransactionDataSchema,
  type IssueTransactionData,
  IssueTransactionDataSchema,
  type LeaseCancelTransactionData,
  LeaseCancelTransactionDataSchema,
  type LeaseTransactionData,
  LeaseTransactionDataSchema,
  type MassTransferTransactionData,
  type MassTransferTransactionData_Transfer,
  MassTransferTransactionData_TransferSchema,
  MassTransferTransactionDataSchema,
  type PaymentTransactionData,
  PaymentTransactionDataSchema,
  type ReissueTransactionData,
  ReissueTransactionDataSchema,
  type SetAssetScriptTransactionData,
  SetAssetScriptTransactionDataSchema,
  type SetScriptTransactionData,
  SetScriptTransactionDataSchema,
  type SignedTransaction,
  SignedTransactionSchema,
  type SponsorFeeTransactionData,
  SponsorFeeTransactionDataSchema,
  type Transaction,
  TransactionSchema,
  type TransferTransactionData,
  TransferTransactionDataSchema,
  type UpdateAssetInfoTransactionData,
  UpdateAssetInfoTransactionDataSchema,
} from './gen/waves/transaction_pb.js';
// Transaction state snapshot
export type { TransactionStateSnapshot } from './gen/waves/transaction_state_snapshot_pb.js';
export {
  type TransactionStateSnapshot_AccountData,
  TransactionStateSnapshot_AccountDataSchema,
  type TransactionStateSnapshot_Balance,
  TransactionStateSnapshot_BalanceSchema,
  type TransactionStateSnapshot_CancelledLease,
  TransactionStateSnapshot_CancelledLeaseSchema,
  type TransactionStateSnapshot_LeaseBalance,
  TransactionStateSnapshot_LeaseBalanceSchema,
  type TransactionStateSnapshot_NewAsset,
  TransactionStateSnapshot_NewAssetSchema,
  type TransactionStateSnapshot_NewLease,
  TransactionStateSnapshot_NewLeaseSchema,
  type TransactionStateSnapshot_OrderFill,
  TransactionStateSnapshot_OrderFillSchema,
  type TransactionStateSnapshot_Sponsorship,
  TransactionStateSnapshot_SponsorshipSchema,
  TransactionStateSnapshotSchema,
  TransactionStatus,
  TransactionStatusSchema,
} from './gen/waves/transaction_state_snapshot_pb.js';
