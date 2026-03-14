/**
 * ValidationError Component
 * Displays validation error messages with consistent styling and animations
 * Provides enhanced error display with icons, animations, and accessibility
 */
import React from 'react';
import styled, { keyframes } from 'styled-components';

export interface ValidationErrorProps {
  /**
   * Error message to display
   */
  message?: string;

  /**
   * Error messages array (for multiple errors)
   */
  messages?: string[];

  /**
   * Show icon with error message
   * @default true
   */
  showIcon?: boolean;

  /**
   * Size variant
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Whether to animate error appearance
   * @default true
   */
  animate?: boolean;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Custom test ID for testing
   */
  testId?: string;
}

/**
 * Fade in animation for error messages
 */
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/**
 * Shake animation for emphasis
 */
const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
`;

const ErrorWrapper = styled.div<{ animate: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.xs};
  ${(p) => p.animate && `animation: ${fadeIn} 0.2s ease-out;`}
`;

const ErrorMessage = styled.div<{ size: 'small' | 'medium' | 'large'; animate: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${(p) => p.theme.spacing.xs};
  color: ${(p) => p.theme.colors.error};
  font-size: ${(p) => {
    switch (p.size) {
      case 'small':
        return p.theme.fontSizes.xs;
      case 'large':
        return p.theme.fontSizes.md;
      default:
        return p.theme.fontSizes.sm;
    }
  }};
  line-height: 1.4;
  ${(p) => p.animate && `animation: ${shake} 0.4s ease-in-out;`}
`;

const ErrorIcon = styled.span`
  flex-shrink: 0;
  margin-top: 2px;

  &::before {
    content: '⚠';
    font-size: 1em;
  }
`;

const ErrorText = styled.span`
  flex: 1;
`;

const ErrorList = styled.ul`
  margin: 0;
  padding-left: ${(p) => p.theme.spacing.md};
  list-style-type: disc;
`;

const ErrorListItem = styled.li`
  color: ${(p) => p.theme.colors.error};
  font-size: ${(p) => p.theme.fontSizes.sm};
  line-height: 1.4;

  & + & {
    margin-top: ${(p) => p.theme.spacing.xs};
  }
`;

export const ValidationError = React.forwardRef<HTMLDivElement, ValidationErrorProps>(
  (
    {
      message,
      messages,
      showIcon = true,
      size = 'medium',
      animate = true,
      className,
      testId = 'validation-error',
    },
    ref
  ) => {
    // Determine which errors to display
    const errorMessages = React.useMemo(() => {
      if (messages && messages.length > 0) {
        return messages;
      }
      if (message) {
        return [message];
      }
      return [];
    }, [message, messages]);

    // Don't render if no errors
    if (errorMessages.length === 0) {
      return null;
    }

    // Single error
    if (errorMessages.length === 1) {
      return (
        <ErrorWrapper ref={ref} className={className} animate={animate} data-testid={testId}>
          <ErrorMessage size={size} animate={animate} role="alert" aria-live="polite">
            {showIcon && <ErrorIcon aria-hidden="true" />}
            <ErrorText>{errorMessages[0]}</ErrorText>
          </ErrorMessage>
        </ErrorWrapper>
      );
    }

    // Multiple errors
    return (
      <ErrorWrapper ref={ref} className={className} animate={animate} data-testid={testId}>
        <ErrorMessage size={size} animate={false} role="alert" aria-live="polite">
          {showIcon && <ErrorIcon aria-hidden="true" />}
          <ErrorText>Please fix the following errors:</ErrorText>
        </ErrorMessage>
        <ErrorList>
          {errorMessages.map((msg, index) => (
            <ErrorListItem key={index}>{msg}</ErrorListItem>
          ))}
        </ErrorList>
      </ErrorWrapper>
    );
  }
);

ValidationError.displayName = 'ValidationError';

/**
 * Hook to collect all form errors for display
 */
export function useFormErrors(errors: Record<string, any>): string[] {
  return React.useMemo(() => {
    const messages: string[] = [];

    const collectErrors = (obj: any, prefix = ''): void => {
      if (!obj) return;

      Object.keys(obj).forEach((key) => {
        const value = obj[key];

        if (value && typeof value === 'object') {
          // If it has a message property, it's an error object
          if ('message' in value && typeof value.message === 'string') {
            const fieldName = prefix ? `${prefix}.${key}` : key;
            messages.push(`${fieldName}: ${value.message}`);
          } else {
            // Recurse for nested errors
            collectErrors(value, prefix ? `${prefix}.${key}` : key);
          }
        }
      });
    };

    collectErrors(errors);
    return messages;
  }, [errors]);
}

/**
 * Component to display all form errors at the top of a form
 */
export interface FormErrorSummaryProps {
  errors: Record<string, any>;
  showIcon?: boolean;
  animate?: boolean;
  className?: string;
}

export const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({
  errors,
  showIcon = true,
  animate = true,
  className,
}) => {
  const errorMessages = useFormErrors(errors);

  if (errorMessages.length === 0) {
    return null;
  }

  return (
    <ValidationError
      messages={errorMessages}
      showIcon={showIcon}
      animate={animate}
      size="medium"
      className={className}
      testId="form-error-summary"
    />
  );
};
