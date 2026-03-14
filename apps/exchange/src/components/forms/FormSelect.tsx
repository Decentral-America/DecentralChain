/**
 * FormSelect Component
 * React Hook Form integrated select component
 * Provides automatic field registration, validation, and error display for dropdowns
 */
import React from 'react';
import { useFormContext, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { Select, SelectOption, SelectProps } from '@/components/atoms/Select';

export interface FormSelectProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<SelectProps, 'name' | 'error' | 'options'> {
  /**
   * Field name (must match schema key)
   */
  name: Path<TFieldValues>;

  /**
   * Select options
   */
  options: SelectOption[];

  /**
   * Optional validation rules (in addition to schema validation)
   */
  rules?: RegisterOptions<TFieldValues>;

  /**
   * Whether to show inline validation on blur
   * @default true
   */
  validateOnBlur?: boolean;

  /**
   * Transform value before submission
   */
  transform?: {
    input?: (value: any) => any;
    output?: (value: any) => any;
  };

  /**
   * Custom error message override
   */
  errorMessage?: string;

  /**
   * Whether to allow empty/null values
   * @default false
   */
  allowEmpty?: boolean;
}

export function FormSelect<TFieldValues extends FieldValues = FieldValues>({
  name,
  options,
  rules,
  validateOnBlur = true,
  transform,
  errorMessage,
  allowEmpty = false,
  onChange,
  onBlur,
  ...selectProps
}: FormSelectProps<TFieldValues>) {
  const {
    register,
    formState: { errors },
    setValue,
    trigger,
  } = useFormContext<TFieldValues>();

  // Get nested error message
  const error = React.useMemo(() => {
    const fieldError = errors[name];
    if (!fieldError) return undefined;

    // Handle nested errors
    if (typeof fieldError === 'object' && 'message' in fieldError) {
      return (fieldError.message as string) || undefined;
    }

    return undefined;
  }, [errors, name]);

  // Register field with react-hook-form
  const {
    ref,
    onChange: registerOnChange,
    onBlur: registerOnBlur,
    ...registration
  } = register(name, rules);

  // Handle value transformation
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      let value = e.target.value;

      // Handle empty value
      if (value === '' && !allowEmpty) {
        value = undefined as any;
      }

      // Apply input transformation
      if (transform?.input) {
        value = transform.input(value);
        e.target.value = value;
      }

      // Call react-hook-form onChange
      registerOnChange(e);

      // Call custom onChange if provided
      onChange?.(e);
    },
    [registerOnChange, onChange, transform, allowEmpty]
  );

  const handleBlur = React.useCallback(
    async (e: React.FocusEvent<HTMLSelectElement>) => {
      let value = e.target.value;

      // Apply output transformation
      if (transform?.output) {
        value = transform.output(value);
        setValue(name, value as any, { shouldValidate: validateOnBlur });
      }

      // Trigger validation on blur if enabled
      if (validateOnBlur) {
        await trigger(name);
      }

      // Call react-hook-form onBlur
      registerOnBlur(e);

      // Call custom onBlur if provided
      onBlur?.(e);
    },
    [name, registerOnBlur, onBlur, validateOnBlur, transform, setValue, trigger]
  );

  return (
    <Select
      {...selectProps}
      {...registration}
      ref={ref}
      options={options}
      error={errorMessage || error}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

// Specialized variants for common use cases

/**
 * FormSelect for asset selection (with WAVES as first option)
 */
export function FormAssetSelect<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormSelectProps<TFieldValues>, 'options'> & {
    assets: Array<{ id: string; name: string; decimals: number }>;
    includeWaves?: boolean;
  }
) {
  const { assets, includeWaves = true, ...restProps } = props;

  const options = React.useMemo(() => {
    const assetOptions: SelectOption[] = assets.map((asset) => ({
      value: asset.id,
      label: asset.name,
    }));

    if (includeWaves) {
      assetOptions.unshift({
        value: 'WAVES',
        label: 'WAVES',
      });
    }

    return assetOptions;
  }, [assets, includeWaves]);

  return <FormSelect<TFieldValues> {...restProps} options={options} />;
}

/**
 * FormSelect for transaction type selection
 */
export function FormTransactionTypeSelect<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormSelectProps<TFieldValues>, 'options'>
) {
  const options: SelectOption[] = [
    { value: '4', label: 'Transfer' },
    { value: '11', label: 'Mass Transfer' },
    { value: '8', label: 'Lease' },
    { value: '9', label: 'Lease Cancel' },
    { value: '3', label: 'Issue' },
    { value: '5', label: 'Reissue' },
    { value: '6', label: 'Burn' },
    { value: '10', label: 'Create Alias' },
    { value: '12', label: 'Data Transaction' },
    { value: '13', label: 'Set Script' },
    { value: '14', label: 'Sponsorship' },
    { value: '15', label: 'Set Asset Script' },
    { value: '16', label: 'Invoke Script' },
  ];

  return <FormSelect<TFieldValues> {...props} options={options} />;
}

/**
 * FormSelect for DEX order type selection
 */
export function FormOrderTypeSelect<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormSelectProps<TFieldValues>, 'options'>
) {
  const options: SelectOption[] = [
    { value: 'buy', label: 'Buy' },
    { value: 'sell', label: 'Sell' },
  ];

  return <FormSelect<TFieldValues> {...props} options={options} />;
}

/**
 * FormSelect for DEX order time-in-force
 */
export function FormTimeInForceSelect<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormSelectProps<TFieldValues>, 'options'>
) {
  const options: SelectOption[] = [
    { value: 'GTC', label: 'Good Till Cancelled' },
    { value: 'IOC', label: 'Immediate or Cancel' },
    { value: 'FOK', label: 'Fill or Kill' },
  ];

  return <FormSelect<TFieldValues> {...props} options={options} />;
}

/**
 * FormSelect for network selection
 */
export function FormNetworkSelect<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormSelectProps<TFieldValues>, 'options'>
) {
  const options: SelectOption[] = [
    { value: 'mainnet', label: 'Mainnet (W)' },
    { value: 'testnet', label: 'Testnet (T)' },
    { value: 'stagenet', label: 'Stagenet (S)' },
  ];

  return <FormSelect<TFieldValues> {...props} options={options} />;
}

/**
 * FormSelect for language selection
 */
export function FormLanguageSelect<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormSelectProps<TFieldValues>, 'options'>
) {
  const options: SelectOption[] = [
    { value: 'en', label: 'English' },
    { value: 'ru', label: 'Русский' },
    { value: 'zh_CN', label: '简体中文' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'tr', label: 'Türkçe' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'pt_BR', label: 'Português (Brasil)' },
    { value: 'pt_PT', label: 'Português (Portugal)' },
    { value: 'nl_NL', label: 'Nederlands' },
    { value: 'it', label: 'Italiano' },
    { value: 'pl', label: 'Polski' },
    { value: 'hi_IN', label: 'हिन्दी' },
    { value: 'id', label: 'Bahasa Indonesia' },
    { value: 'et_EE', label: 'Eesti' },
  ];

  return <FormSelect<TFieldValues> {...props} options={options} />;
}
