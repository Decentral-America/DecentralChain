import { type PreferencesAccount } from 'preferences/types';

import { MessageFinal } from './_common/final';
import { AuthCard, AuthFinal, AuthScreen } from './auth/auth';
import { AuthOriginCard, AuthOriginFinal, AuthOriginScreen } from './authOrigin/authOrigin';
import { CancelOrderCard, CancelOrderScreen } from './cancelOrder/cancelOrder';
import { CustomDataCard, CustomDataFinal, CustomDataScreen } from './customData/customData';
import { DccAuthCard, DccAuthFinal, DccAuthScreen } from './dccAuth/dccAuth';
import { OrderCard, OrderScreen } from './order/order';
import { RequestCard, RequestFinal, RequestScreen } from './request/request';
import { TransactionCard, TransactionScreen } from './transaction/transaction';
import {
  TransactionPackageCard,
  TransactionPackageScreen,
} from './transactionPackage/transactionPackage';
import { type Message, type MessageOfType } from './types';

interface MessageConfig<T extends Message['type']> {
  card: React.ComponentType<{
    className?: string | undefined;
    collapsed?: boolean | undefined;
    message: MessageOfType<T>;
  }>;
  screen: React.ComponentType<{
    message: MessageOfType<T>;
    selectedAccount: PreferencesAccount;
  }>;
  final: React.ComponentType<{
    isApprove: boolean;
    isReject: boolean;
    isSend: boolean | undefined;
  }>;
}

const messageConfigs = {
  auth: {
    card: AuthCard,
    final: AuthFinal,
    screen: AuthScreen,
  },
  authOrigin: {
    card: AuthOriginCard,
    final: AuthOriginFinal,
    screen: AuthOriginScreen,
  },
  cancelOrder: {
    card: CancelOrderCard,
    final: MessageFinal,
    screen: CancelOrderScreen,
  },
  customData: {
    card: CustomDataCard,
    final: CustomDataFinal,
    screen: CustomDataScreen,
  },
  dccAuth: {
    card: DccAuthCard,
    final: DccAuthFinal,
    screen: DccAuthScreen,
  },
  order: {
    card: OrderCard,
    final: MessageFinal,
    screen: OrderScreen,
  },
  request: {
    card: RequestCard,
    final: RequestFinal,
    screen: RequestScreen,
  },
  transaction: {
    card: TransactionCard,
    final: MessageFinal,
    screen: TransactionScreen,
  },
  transactionPackage: {
    card: TransactionPackageCard,
    final: MessageFinal,
    screen: TransactionPackageScreen,
  },
};

export function getMessageConfig<T extends Message['type']>(input: MessageOfType<T>) {
  return messageConfigs[input.type] as unknown as MessageConfig<T>;
}
