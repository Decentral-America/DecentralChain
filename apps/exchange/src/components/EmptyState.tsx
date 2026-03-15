/**
 * Empty State Components
 * Displays helpful messages and actions when no data exists
 */
import type React from 'react';
import styled from 'styled-components';
import { Button } from './atoms/Button';

const Container = styled.div<{ variant?: 'default' | 'compact' | 'fullscreen' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${(props) => {
    switch (props.variant) {
      case 'compact':
        return '2rem';
      case 'fullscreen':
        return '4rem';
      default:
        return '3rem';
    }
  }};
  text-align: center;
  min-height: ${(props) => (props.variant === 'fullscreen' ? '60vh' : 'auto')};
`;

const IconWrapper = styled.div<{ size?: 'small' | 'medium' | 'large' }>`
  margin-bottom: 1.5rem;
  opacity: 0.6;
  font-size: ${(props) => {
    switch (props.size) {
      case 'small':
        return '2rem';
      case 'large':
        return '4rem';
      default:
        return '3rem';
    }
  }};

  svg {
    width: ${(props) => {
      switch (props.size) {
        case 'small':
          return '48px';
        case 'large':
          return '96px';
        default:
          return '64px';
      }
    }};
    height: ${(props) => {
      switch (props.size) {
        case 'small':
          return '48px';
        case 'large':
          return '96px';
        default:
          return '64px';
      }
    }};
  }
`;

const Title = styled.h3<{ size?: 'small' | 'medium' | 'large' }>`
  margin: 0 0 0.75rem 0;
  color: ${(props) => props.theme.colors.text};
  font-size: ${(props) => {
    switch (props.size) {
      case 'small':
        return '1.125rem';
      case 'large':
        return '1.75rem';
      default:
        return '1.5rem';
    }
  }};
  font-weight: 600;
`;

const Message = styled.p<{ size?: 'small' | 'medium' | 'large' }>`
  margin: 0 0 1.5rem 0;
  color: ${(props) => props.theme.colors.text}99;
  font-size: ${(props) => {
    switch (props.size) {
      case 'small':
        return '0.875rem';
      case 'large':
        return '1.125rem';
      default:
        return '1rem';
    }
  }};
  max-width: 480px;
  line-height: 1.6;
`;

const ActionContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const SecondaryMessage = styled.p`
  margin: 1rem 0 0 0;
  color: ${(props) => props.theme.colors.text}66;
  font-size: 0.875rem;
  max-width: 400px;
`;

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  icon?: React.ReactNode;
}

export interface EmptyStateProps {
  /**
   * Icon or illustration to display
   */
  icon?: React.ReactNode;

  /**
   * Main title text
   */
  title: string;

  /**
   * Descriptive message
   */
  message: string;

  /**
   * Primary action button
   */
  action?: EmptyStateAction | undefined;

  /**
   * Secondary action button
   */
  secondaryAction?: EmptyStateAction | undefined;

  /**
   * Additional help text below actions
   */
  helpText?: string;

  /**
   * Visual variant
   */
  variant?: 'default' | 'compact' | 'fullscreen';

  /**
   * Size of icon and text
   */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Generic empty state component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
  secondaryAction,
  helpText,
  variant = 'default',
  size = 'medium',
}) => (
  <Container variant={variant}>
    {icon && <IconWrapper size={size}>{icon}</IconWrapper>}
    <Title size={size}>{title}</Title>
    <Message size={size}>{message}</Message>
    {(action || secondaryAction) && (
      <ActionContainer>
        {action && (
          <Button
            variant={action.variant || 'primary'}
            onClick={action.onClick}
            leftIcon={action.icon}
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant={secondaryAction.variant || 'secondary'}
            onClick={secondaryAction.onClick}
            leftIcon={secondaryAction.icon}
          >
            {secondaryAction.label}
          </Button>
        )}
      </ActionContainer>
    )}
    {helpText && <SecondaryMessage>{helpText}</SecondaryMessage>}
  </Container>
);

/**
 * Empty transaction list
 */
export const EmptyTransactions: React.FC<{
  onCreateTransaction?: () => void;
}> = ({ onCreateTransaction }) => (
  <EmptyState
    icon="📝"
    title="No Transactions Yet"
    message="You haven't made any transactions yet. Start by sending or receiving DCC."
    action={
      onCreateTransaction
        ? {
            label: 'Send DCC',
            onClick: onCreateTransaction,
            variant: 'primary',
          }
        : undefined
    }
  />
);

/**
 * Empty asset list
 */
export const EmptyAssets: React.FC<{
  onAddAsset?: () => void;
}> = ({ onAddAsset }) => (
  <EmptyState
    icon="💎"
    title="No Assets"
    message="You don't have any assets in your wallet yet. Assets will appear here once you receive them."
    action={
      onAddAsset
        ? {
            label: 'Add Asset',
            onClick: onAddAsset,
            variant: 'primary',
          }
        : undefined
    }
    helpText="Assets are automatically added when you receive them"
  />
);

/**
 * Empty DEX orders
 */
export const EmptyOrders: React.FC<{
  onCreateOrder?: () => void;
}> = ({ onCreateOrder }) => (
  <EmptyState
    icon="📊"
    title="No Open Orders"
    message="You don't have any open orders on the DEX. Create a new order to start trading."
    action={
      onCreateOrder
        ? {
            label: 'Create Order',
            onClick: onCreateOrder,
            variant: 'primary',
          }
        : undefined
    }
  />
);

/**
 * Empty search results
 */
export const EmptySearch: React.FC<{
  searchQuery: string;
  onClearSearch?: () => void;
}> = ({ searchQuery, onClearSearch }) => (
  <EmptyState
    icon="🔍"
    title="No Results Found"
    message={`No results found for "${searchQuery}". Try adjusting your search terms.`}
    action={
      onClearSearch
        ? {
            label: 'Clear Search',
            onClick: onClearSearch,
            variant: 'text',
          }
        : undefined
    }
    variant="compact"
  />
);

/**
 * Empty filter results
 */
export const EmptyFilter: React.FC<{
  onClearFilters?: () => void;
}> = ({ onClearFilters }) => (
  <EmptyState
    icon="🔎"
    title="No Matching Items"
    message="No items match your current filters. Try adjusting or clearing your filters."
    action={
      onClearFilters
        ? {
            label: 'Clear Filters',
            onClick: onClearFilters,
            variant: 'secondary',
          }
        : undefined
    }
    variant="compact"
  />
);

/**
 * Empty wallet (no accounts)
 */
export const EmptyWallet: React.FC<{
  onCreateWallet?: () => void;
  onImportWallet?: () => void;
}> = ({ onCreateWallet, onImportWallet }) => (
  <EmptyState
    icon="👛"
    title="No Wallet"
    message="You don't have a wallet yet. Create a new wallet or import an existing one to get started."
    action={
      onCreateWallet
        ? {
            label: 'Create Wallet',
            onClick: onCreateWallet,
            variant: 'primary',
          }
        : undefined
    }
    secondaryAction={
      onImportWallet
        ? {
            label: 'Import Wallet',
            onClick: onImportWallet,
            variant: 'secondary',
          }
        : undefined
    }
    variant="fullscreen"
    size="large"
  />
);

/**
 * Network error state
 */
export const NetworkError: React.FC<{
  onRetry?: () => void;
}> = ({ onRetry }) => (
  <EmptyState
    icon="🌐"
    title="Connection Error"
    message="Unable to connect to the network. Please check your internet connection and try again."
    action={
      onRetry
        ? {
            label: 'Retry',
            onClick: onRetry,
            variant: 'primary',
          }
        : undefined
    }
    helpText="Make sure you're connected to the internet"
  />
);

/**
 * Generic error state
 */
export const ErrorState: React.FC<{
  error?: Error | string;
  onRetry?: () => void;
}> = ({ error, onRetry }) => (
  <EmptyState
    icon="⚠️"
    title="Something Went Wrong"
    message={
      typeof error === 'string'
        ? error
        : error?.message || 'An unexpected error occurred. Please try again.'
    }
    action={
      onRetry
        ? {
            label: 'Try Again',
            onClick: onRetry,
            variant: 'primary',
          }
        : undefined
    }
  />
);

/**
 * Coming soon state
 */
export const ComingSoon: React.FC<{
  feature: string;
}> = ({ feature }) => (
  <EmptyState
    icon="🚀"
    title="Coming Soon"
    message={`${feature} is currently under development. Check back soon for updates!`}
    variant="fullscreen"
    size="large"
  />
);

/**
 * Maintenance mode
 */
export const Maintenance: React.FC<{
  estimatedTime?: string;
}> = ({ estimatedTime }) => (
  <EmptyState
    icon="🔧"
    title="Under Maintenance"
    message={
      estimatedTime
        ? `We're performing scheduled maintenance. We'll be back ${estimatedTime}.`
        : "We're performing scheduled maintenance. We'll be back soon."
    }
    variant="fullscreen"
    size="large"
    helpText="Thank you for your patience"
  />
);

/**
 * Not found (404) state
 */
export const NotFound: React.FC<{
  onGoHome?: () => void;
}> = ({ onGoHome }) => (
  <EmptyState
    icon="❓"
    title="Page Not Found"
    message="The page you're looking for doesn't exist or has been moved."
    action={
      onGoHome
        ? {
            label: 'Go Home',
            onClick: onGoHome,
            variant: 'primary',
          }
        : undefined
    }
    variant="fullscreen"
    size="large"
  />
);

/**
 * Unauthorized (403) state
 */
export const Unauthorized: React.FC<{
  onLogin?: () => void;
}> = ({ onLogin }) => (
  <EmptyState
    icon="🔒"
    title="Access Denied"
    message="You don't have permission to access this page. Please sign in with an authorized account."
    action={
      onLogin
        ? {
            label: 'Sign In',
            onClick: onLogin,
            variant: 'primary',
          }
        : undefined
    }
    variant="fullscreen"
  />
);
