/**
 * FormSelect Component
 * React Hook Form integrated select component
 * Provides automatic field registration, validation, and error display for dropdowns
 */
import React from 'react';
import { type FieldValues, type Path, type RegisterOptions, useFormContext } from 'react-hook-form';
import { Select, type SelectOption, type SelectProps } from '@/components/atoms/Select';

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
    input?: (value: string) => string;
    output?: (value: string) => string;
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
    if (!fieldError) return;

    // Handle nested errors
    if (typeof fieldError === 'object' && 'message' in fieldError) {
      return (fieldError.message as string) || undefined;
    }

    return;
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
        value = undefined as unknown as string;
      }

      // Apply input transformation
      if (transform?.input) {
        value = transform.input(value);
        e.target.value = value;
      }

      // Call react-hook-form onChange
      void registerOnChange(e);

      // Call custom onChange if provided
      onChange?.(e);
    },
    [registerOnChange, onChange, transform, allowEmpty],
  );

  const handleBlur = React.useCallback(
    async (e: React.FocusEvent<HTMLSelectElement>) => {
      let value = e.target.value;

      // Apply output transformation
      if (transform?.output) {
        value = transform.output(value);
        setValue(name, value as TFieldValues[typeof name], { shouldValidate: validateOnBlur });
      }

      // Trigger validation on blur if enabled
      if (validateOnBlur) {
        await trigger(name);
      }

      // Call react-hook-form onBlur
      void registerOnBlur(e);

      // Call custom onBlur if provided
      onBlur?.(e);
    },
    [name, registerOnBlur, onBlur, validateOnBlur, transform, setValue, trigger],
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
 * FormSelect for asset selection (with DCC as first option)
 */
export function FormAssetSelect<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormSelectProps<TFieldValues>, 'options'> & {
    assets: Array<{ id: string; name: string; decimals: number }>;
    includeDCC?: boolean;
  },
) {
  const { assets, includeDCC = true, ...restProps } = props;

  const options = React.useMemo(() => {
    const assetOptions: SelectOption[] = assets.map((asset) => ({
      label: asset.name,
      value: asset.id,
    }));

    if (includeDCC) {
      assetOptions.unshift({
        label: 'DCC',
        value: 'DCC',
      });
    }

    return assetOptions;
  }, [assets, includeDCC]);

  return <FormSelect<TFieldValues> {...restProps} options={options} />;
}

/**
 * FormSelect for transaction type selection
 */
export function FormTransactionTypeSelect<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormSelectProps<TFieldValues>, 'options'>,
) {
  const options: SelectOption[] = [
    { label: 'Transfer', value: '4' },
    { label: 'Mass Transfer', value: '11' },
    { label: 'Lease', value: '8' },
    { label: 'Lease Cancel', value: '9' },
    { label: 'Issue', value: '3' },
    { label: 'Reissue', value: '5' },
    { label: 'Burn', value: '6' },
    { label: 'Create Alias', value: '10' },
    { label: 'Data Transaction', value: '12' },
    { label: 'Set Script', value: '13' },
    { label: 'Sponsorship', value: '14' },
    { label: 'Set Asset Script', value: '15' },
    { label: 'Invoke Script', value: '16' },
  ];

  return <FormSelect<TFieldValues> {...props} options={options} />;
}

/**
 * FormSelect for DEX order type selection
 */
export function FormOrderTypeSelect<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormSelectProps<TFieldValues>, 'options'>,
) {
  const options: SelectOption[] = [
    { label: 'Buy', value: 'buy' },
    { label: 'Sell', value: 'sell' },
  ];

  return <FormSelect<TFieldValues> {...props} options={options} />;
}

/**
 * FormSelect for DEX order time-in-force
 */
export function FormTimeInForceSelect<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormSelectProps<TFieldValues>, 'options'>,
) {
  const options: SelectOption[] = [
    { label: 'Good Till Cancelled', value: 'GTC' },
    { label: 'Immediate or Cancel', value: 'IOC' },
    { label: 'Fill or Kill', value: 'FOK' },
  ];

  return <FormSelect<TFieldValues> {...props} options={options} />;
}

/**
 * FormSelect for network selection
 */
export function FormNetworkSelect<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormSelectProps<TFieldValues>, 'options'>,
) {
  const options: SelectOption[] = [
    { label: 'Mainnet (W)', value: 'mainnet' },
    { label: 'Testnet (T)', value: 'testnet' },
    { label: 'Stagenet (S)', value: 'stagenet' },
  ];

  return <FormSelect<TFieldValues> {...props} options={options} />;
}

/**
 * FormSelect for language selection
 */
export function FormLanguageSelect<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormSelectProps<TFieldValues>, 'options'>,
) {
  const options: SelectOption[] = [
    { label: 'English', value: 'en' },
    { label: 'Русский', value: 'ru' },
    { label: '简体中文', value: 'zh_CN' },
    { label: '日本語', value: 'ja' },
    { label: '한국어', value: 'ko' },
    { label: 'Türkçe', value: 'tr' },
    { label: 'Español', value: 'es' },
    { label: 'Français', value: 'fr' },
    { label: 'Deutsch', value: 'de' },
    { label: 'Português (Brasil)', value: 'pt_BR' },
    { label: 'Português (Portugal)', value: 'pt_PT' },
    { label: 'Nederlands', value: 'nl_NL' },
    { label: 'Italiano', value: 'it' },
    { label: 'Polski', value: 'pl' },
    { label: 'हिन्दी', value: 'hi_IN' },
    { label: 'Bahasa Indonesia', value: 'id' },
    { label: 'Eesti', value: 'et_EE' },
  ];

  return <FormSelect<TFieldValues> {...props} options={options} />;
}
