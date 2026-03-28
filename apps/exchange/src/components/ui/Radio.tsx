/**
 * Radio Component
 * Replaces Angular w-radio directive
 * Single selection from multiple options in a radio group
 */
import type React from 'react';
import styled from 'styled-components';

const HiddenRadio = styled.input.attrs({ type: 'radio' })`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;

  &:focus + div {
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}33;
  }
`;

const RadioWrapper = styled.label<{ disabled?: boolean; hasError?: boolean }>`
  display: flex;
  align-items: center;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  user-select: none;
  position: relative;

  &:hover ${HiddenRadio}:not(:disabled) + div {
    border-color: ${({ theme, hasError }) =>
      hasError ? theme.colors.error : theme.colors.primary};
  }

  &:focus-within div {
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}33;
  }
`;

const StyledRadio = styled.div<{
  checked: boolean;
  disabled?: boolean;
  hasError?: boolean;
}>`
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
  border: 2px solid
    ${({ theme, checked, hasError }) => {
      if (hasError) return theme.colors.error;
      if (checked) return theme.colors.primary;
      return theme.colors.border || '#e0e0e0';
    }};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: ${({ theme }) => theme.colors.background || '#ffffff'};

  &::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ theme, disabled }) => (disabled ? theme.colors.border : theme.colors.primary)};
    opacity: ${({ checked }) => (checked ? 1 : 0)};
    transform: scale(${({ checked }) => (checked ? 1 : 0.3)});
    transition: all 0.2s ease;
  }
`;

const Label = styled.span<{ disabled?: boolean }>`
  margin-left: 8px;
  font-size: 14px;
  color: ${({ theme, disabled }) => (disabled ? `${theme.colors.text}66` : theme.colors.text)};
  line-height: 1.5;
`;

const Description = styled.div`
  margin-left: 28px;
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) => `${theme.colors.text}99`};
  line-height: 1.4;
`;

const ErrorMessage = styled.div`
  margin-left: 28px;
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.error};
`;

export interface RadioProps {
  /**
   * Radio group name (all radios in a group must have the same name)
   */
  name: string;

  /**
   * Value of this radio option
   */
  value: string;

  /**
   * Whether this radio is checked
   */
  checked: boolean;

  /**
   * Change handler receives the value when this radio is selected
   */
  onChange: (value: string) => void;

  /**
   * Label text displayed next to the radio
   */
  label?: string;

  /**
   * Description text displayed below the label
   */
  description?: string | undefined;

  /**
   * Whether the radio is disabled
   */
  disabled?: boolean | undefined;

  /**
   * Error message (displays below radio if provided)
   */
  error?: string | undefined;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
}

/**
 * Radio Button Component
 *
 * Used for single selection from multiple options.
 * Group multiple radios with the same `name` prop.
 *
 * @example
 * ```tsx
 * const [selected, setSelected] = useState('option1');
 *
 * <Radio
 *   name="options"
 *   value="option1"
 *   checked={selected === 'option1'}
 *   onChange={setSelected}
 *   label="Option 1"
 * />
 * <Radio
 *   name="options"
 *   value="option2"
 *   checked={selected === 'option2'}
 *   onChange={setSelected}
 *   label="Option 2"
 * />
 * ```
 */
export const Radio: React.FC<RadioProps> = ({
  name,
  value,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  error,
  className,
  ariaLabel,
}) => {
  const handleChange = () => {
    if (!disabled) {
      onChange(value);
    }
  };

  return (
    <>
      <RadioWrapper
        className={className}
        disabled={disabled}
        hasError={!!error}
        role="radio"
        aria-checked={checked}
        aria-disabled={disabled}
        aria-label={ariaLabel || label}
      >
        <HiddenRadio
          name={name}
          value={value}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          aria-label={ariaLabel || label}
        />
        <StyledRadio checked={checked} disabled={disabled} hasError={!!error} />
        {label && <Label disabled={disabled}>{label}</Label>}
      </RadioWrapper>
      {description && !error && <Description>{description}</Description>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </>
  );
};

/**
 * RadioGroup Component
 *
 * Container for multiple radio buttons with shared state.
 *
 * @example
 * ```tsx
 * const options = [
 *   { value: 'mainnet', label: 'Mainnet', description: 'Production network' },
 *   { value: 'testnet', label: 'Testnet', description: 'Test network' },
 * ];
 *
 * <RadioGroup
 *   name="network"
 *   options={options}
 *   value={selectedNetwork}
 *   onChange={setSelectedNetwork}
 * />
 * ```
 */

const RadioGroupContainer = styled.div<{ direction?: 'vertical' | 'horizontal' }>`
  display: flex;
  flex-direction: ${({ direction }) => (direction === 'horizontal' ? 'row' : 'column')};
  gap: ${({ direction }) => (direction === 'horizontal' ? '24px' : '12px')};
`;

const RadioGroupLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
`;

export interface RadioGroupOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /**
   * Radio group name
   */
  name: string;

  /**
   * Currently selected value
   */
  value: string;

  /**
   * Change handler
   */
  onChange: (value: string) => void;

  /**
   * Array of radio options
   */
  options: RadioGroupOption[];

  /**
   * Optional label for the group
   */
  label?: string;

  /**
   * Layout direction
   */
  direction?: 'vertical' | 'horizontal';

  /**
   * Error message for the group
   */
  error?: string;

  /**
   * Whether all radios are disabled
   */
  disabled?: boolean;

  /**
   * Custom className
   */
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  options,
  label,
  direction = 'vertical',
  error,
  disabled = false,
  className,
}) => (
  <div className={className} role="radiogroup" aria-label={label}>
    {label && <RadioGroupLabel>{label}</RadioGroupLabel>}
    <RadioGroupContainer direction={direction}>
      {options.map((option) => (
        <Radio
          key={option.value}
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={onChange}
          label={option.label}
          description={option.description}
          disabled={disabled || option.disabled}
          error={value === option.value ? error : undefined}
        />
      ))}
    </RadioGroupContainer>
  </div>
);
