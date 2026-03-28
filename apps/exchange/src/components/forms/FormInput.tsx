/**
 * FormInput Component
 * React Hook Form integrated input component
 * Provides automatic field registration, validation, and error display
 */
import React from 'react';
import { type FieldValues, type Path, type RegisterOptions, useFormContext } from 'react-hook-form';
import { Input, type InputProps } from '@/components/atoms/Input';

export interface FormInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<InputProps, 'name' | 'error'> {
  /**
   * Field name (must match schema key)
   */
  name: Path<TFieldValues>;

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
   * Whether to trim whitespace on blur
   * @default false
   */
  trimOnBlur?: boolean;

  /**
   * Maximum character length
   */
  maxLength?: number;

  /**
   * Step value for number inputs
   */
  step?: string;

  /**
   * Minimum value for number inputs
   */
  min?: string;

  /**
   * Maximum value for number inputs
   */
  max?: string;
}

export function FormInput<TFieldValues extends FieldValues = FieldValues>({
  name,
  rules,
  validateOnBlur = true,
  transform,
  errorMessage,
  trimOnBlur = false,
  onBlur,
  onChange,
  ...inputProps
}: FormInputProps<TFieldValues>) {
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
  }, [errors, name]);

  // Register field with react-hook-form
  const {
    ref,
    onChange: registerOnChange,
    onBlur: registerOnBlur,
    ...registration
  } = register(name, rules);

  // Handle value transformation and trimming
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

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
    [registerOnChange, onChange, transform],
  );

  const handleBlur = React.useCallback(
    async (e: React.FocusEvent<HTMLInputElement>) => {
      let value = e.target.value;

      // Trim whitespace if enabled
      if (trimOnBlur && typeof value === 'string') {
        value = value.trim();
        setValue(name, value as TFieldValues[typeof name], { shouldValidate: validateOnBlur });
      }

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
    [name, registerOnBlur, onBlur, trimOnBlur, validateOnBlur, transform, setValue, trigger],
  );

  return (
    <Input
      {...inputProps}
      {...registration}
      ref={ref}
      // biome-ignore lint/nursery/useNullishCoalescing: errorMessage may be '' (empty string = no error text) — || fallback to error prop is intentional
      error={errorMessage || error}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

// Specialized variants for common use cases

/**
 * FormInput for numeric values (amount, price, etc.)
 */
export function FormNumberInput<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormInputProps<TFieldValues>, 'type' | 'transform'>,
) {
  return (
    <FormInput<TFieldValues>
      {...props}
      type="number"
      transform={{
        input: (value: string) => {
          // Allow empty string
          if (value === '') return '';
          // Convert to number
          const num = parseFloat(value);
          return Number.isNaN(num) ? '' : String(num);
        },
        output: (value: string) => {
          const num = parseFloat(value);
          return Number.isNaN(num) ? '' : String(num);
        },
      }}
    />
  );
}

/**
 * FormInput for email addresses (with automatic trimming and lowercase)
 */
export function FormEmailInput<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormInputProps<TFieldValues>, 'type' | 'transform' | 'trimOnBlur'>,
) {
  return (
    <FormInput<TFieldValues>
      {...props}
      type="email"
      autoComplete="email"
      trimOnBlur={true}
      transform={{
        output: (value: string) => (typeof value === 'string' ? value.toLowerCase() : value),
      }}
    />
  );
}

/**
 * FormInput for passwords (with security enhancements)
 */
export function FormPasswordInput<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormInputProps<TFieldValues>, 'type' | 'autoComplete'>,
) {
  return (
    <FormInput<TFieldValues>
      {...props}
      type="password"
      autoComplete="current-password"
      trimOnBlur={false}
    />
  );
}

/**
 * FormInput for DCC addresses (with automatic trimming and validation)
 */
export function FormAddressInput<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormInputProps<TFieldValues>, 'trimOnBlur' | 'placeholder'>,
) {
  return (
    <FormInput<TFieldValues> {...props} trimOnBlur={true} placeholder="3P..." maxLength={35} />
  );
}

/**
 * FormInput for DCC aliases (with automatic trimming and validation)
 */
export function FormAliasInput<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormInputProps<TFieldValues>, 'trimOnBlur' | 'placeholder'>,
) {
  return (
    <FormInput<TFieldValues>
      {...props}
      trimOnBlur={true}
      placeholder="alias:W:your-alias"
      maxLength={30}
    />
  );
}

/**
 * FormInput for seed phrases (with security and trimming)
 */
export function FormSeedInput<TFieldValues extends FieldValues = FieldValues>(
  props: Omit<FormInputProps<TFieldValues>, 'type' | 'autoComplete' | 'trimOnBlur'>,
) {
  return (
    <FormInput<TFieldValues>
      {...props}
      type="text"
      autoComplete="off"
      trimOnBlur={true}
      placeholder="Enter 15 word seed phrase"
    />
  );
}
