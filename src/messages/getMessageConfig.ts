import { type PreferencesAccount } from 'preferences/types';

import { MessageFinal } from './_common/final';
import { AuthCard, AuthFinal, AuthScreen } from './auth/auth';
import {
  AuthOriginCard,
  AuthOriginFinal,
  AuthOriginScreen,
} from './authOrigin/authOrigin';
import { CancelOrderCard, CancelOrderScreen } from './cancelOrder/cancelOrder';
import {
  CustomDataCard,
  CustomDataFinal,
  CustomDataScreen,
} from './customData/customData';
import { OrderCard, OrderScreen } from './order/order';
import { RequestCard, RequestFinal, RequestScreen } from './request/request';
import { TransactionCard, TransactionScreen } from './transaction/transaction';
import {
  TransactionPackageCard,
  TransactionPackageScreen,
} from './transactionPackage/transactionPackage';
import { type Message, type MessageOfType } from './types';
import {
  DccAuthCard,
  DccAuthFinal,
  DccAuthScreen,
} from './dccAuth/dccAuth';

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
    screen: AuthScreen,
    final: AuthFinal,
  },
  authOrigin: {
    card: AuthOriginCard,
    screen: AuthOriginScreen,
    final: AuthOriginFinal,
  },
  cancelOrder: {
    card: CancelOrderCard,
    screen: CancelOrderScreen,
    final: MessageFinal,
  },
  customData: {
    card: CustomDataCard,
    screen: CustomDataScreen,
    final: CustomDataFinal,
  },
  order: {
    card: OrderCard,
    screen: OrderScreen,
    final: MessageFinal,
  },
  request: {
    card: RequestCard,
    screen: RequestScreen,
    final: RequestFinal,
  },
  transaction: {
    card: TransactionCard,
    screen: TransactionScreen,
    final: MessageFinal,
  },
  transactionPackage: {
    card: TransactionPackageCard,
    screen: TransactionPackageScreen,
    final: MessageFinal,
  },
  dccAuth: {
    card: DccAuthCard,
    screen: DccAuthScreen,
    final: DccAuthFinal,
  },
};

export function getMessageConfig<T extends Message['type']>(
  input: MessageOfType<T>,
) {
  return messageConfigs[input.type] as unknown as MessageConfig<T>;
}
