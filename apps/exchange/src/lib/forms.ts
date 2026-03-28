/**
 * React Hook Form Configuration with Zod Validation
 * Type-safe form handling and validation utilities
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { type FieldValues, type Resolver, type UseFormProps, useForm } from 'react-hook-form';
import { type ZodSchema, z } from 'zod';

/**
 * Custom hook for forms with Zod validation
 * Provides type-safe form handling with automatic validation
 *
 * @param schema - Zod validation schema
 * @param options - react-hook-form options
 * @returns useForm hook with zod resolver
 *
 * @example
 * ```tsx
 * const schema = z.object({
 *   email: z.string().email(),
 *   amount: z.number().positive()
 * });
 *
 * const form = useZodForm(schema, {
 *   defaultValues: { email: '', amount: 0 }
 * });
 * ```
 */
export function useZodForm<TFieldValues extends FieldValues = FieldValues>(
  schema: ZodSchema,
  options?: Omit<UseFormProps<TFieldValues>, 'resolver'>,
) {
  return useForm<TFieldValues>({
    mode: 'onChange', // Validate on change for better UX
    // biome-ignore lint/suspicious/noExplicitAny: ZodSchema lacks the FieldValues generic required by zodResolver overloads; as any bridges the version boundary, then as unknown as restores the correct Resolver<TFieldValues> type
    resolver: zodResolver(schema as any) as unknown as Resolver<TFieldValues>,
    reValidateMode: 'onChange', // Revalidate on every change
    ...options,
  });
} /**
 * ============================================
 * COMMON VALIDATION SCHEMAS
 * Reusable Zod schemas for DecentralChain forms
 * ============================================
 */

/**
 * DCC Address Validation
 * Validates DecentralChain addresses (35 characters, starts with 3P)
 */
export const addressSchema = z
  .string()
  .min(35, 'Address must be 35 characters')
  .max(35, 'Address must be 35 characters')
  .regex(/^3P[a-zA-Z0-9]+$/, 'Invalid address format');

/**
 * Alias Validation
 * Validates DecentralChain aliases (4-30 characters, alphanumeric + @._-)
 */
export const aliasSchema = z
  .string()
  .min(4, 'Alias must be at least 4 characters')
  .max(30, 'Alias cannot exceed 30 characters')
  .regex(/^[a-z0-9@._-]+$/, 'Alias can only contain lowercase letters, numbers, @, ., _, -');

/**
 * Amount Validation
 * Validates positive numeric amounts with maximum precision
 */
export const amountSchema = z
  .number({ message: 'Amount must be a number' })
  .positive('Amount must be positive')
  .finite('Amount must be a finite number');

/**
 * Optional Amount Validation
 * Allows undefined/null for optional fee fields
 */
export const optionalAmountSchema = amountSchema.optional().nullable();

/**
 * Attachment Validation
 * Validates transaction attachment (max 140 bytes)
 */
export const attachmentSchema = z
  .string()
  .max(140, 'Attachment cannot exceed 140 characters')
  .optional();

/**
 * Password Validation
 * Strong password requirements for wallet encryption
 */
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[@$!%*?&#]/, 'Password must contain at least one special character (@$!%*?&#)');

/**
 * Seed Phrase Validation
 * Validates 15-word seed phrases
 */
export const seedPhraseSchema = z
  .string()
  .refine(
    (val) => {
      const words = val.trim().split(/\s+/);
      return words.length === 15;
    },
    { message: 'Seed phrase must contain exactly 15 words' },
  )
  .refine(
    (val) => {
      const words = val.trim().split(/\s+/);
      return words.every((word) => word.length > 0);
    },
    { message: 'Seed phrase cannot contain empty words' },
  );

/**
 * ============================================
 * TRANSACTION FORM SCHEMAS
 * Complete schemas for different transaction types
 * ============================================
 */

/**
 * Send Asset Form Schema
 * For Transfer (Type 4) transactions
 */
export const sendAssetSchema = z.object({
  amount: amountSchema,
  assetId: z.string().optional().nullable(), // null = DCC
  attachment: attachmentSchema,
  fee: optionalAmountSchema,
  recipient: z
    .string()
    .min(4, 'Recipient must be at least 4 characters')
    .refine(
      (val) => {
        try {
          addressSchema.parse(val);
          return true;
        } catch {
          try {
            aliasSchema.parse(val);
            return true;
          } catch {
            return false;
          }
        }
      },
      { message: 'Invalid recipient address or alias' },
    ),
});

export type SendAssetFormData = z.infer<typeof sendAssetSchema>;

/**
 * Mass Transfer Form Schema
 * For Mass Transfer (Type 11) transactions
 */
export const massTransferSchema = z.object({
  assetId: z.string().optional().nullable(),
  attachment: attachmentSchema,
  fee: optionalAmountSchema,
  recipients: z
    .array(
      z.object({
        amount: amountSchema,
        recipient: z
          .string()
          .min(4)
          .refine(
            (val) => {
              try {
                addressSchema.parse(val);
                return true;
              } catch {
                try {
                  aliasSchema.parse(val);
                  return true;
                } catch {
                  return false;
                }
              }
            },
            { message: 'Invalid address or alias' },
          ),
      }),
    )
    .min(1, 'At least one recipient required')
    .max(100, 'Maximum 100 recipients allowed'),
});

export type MassTransferFormData = z.infer<typeof massTransferSchema>;

/**
 * Lease Form Schema
 * For Lease (Type 8) transactions
 */
export const leaseSchema = z.object({
  amount: amountSchema,
  fee: optionalAmountSchema,
  recipient: addressSchema,
});

export type LeaseFormData = z.infer<typeof leaseSchema>;

/**
 * Token Issuance Form Schema
 * For Issue (Type 3) transactions
 */
export const tokenIssuanceSchema = z.object({
  decimals: z
    .number()
    .int()
    .min(0, 'Decimals must be 0 or greater')
    .max(8, 'Decimals cannot exceed 8'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters'),
  fee: optionalAmountSchema,
  name: z
    .string()
    .min(4, 'Name must be at least 4 characters')
    .max(16, 'Name cannot exceed 16 characters'),
  quantity: amountSchema,
  reissuable: z.boolean(),
});

export type TokenIssuanceFormData = z.infer<typeof tokenIssuanceSchema>;

/**
 * Asset Reissue Form Schema
 * For Reissue (Type 5) transactions
 */
export const assetReissueSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
  fee: optionalAmountSchema,
  quantity: amountSchema,
  reissuable: z.boolean(),
});

export type AssetReissueFormData = z.infer<typeof assetReissueSchema>;

/**
 * Asset Burn Form Schema
 * For Burn (Type 6) transactions
 */
export const assetBurnSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
  fee: optionalAmountSchema,
  quantity: amountSchema,
});

export type AssetBurnFormData = z.infer<typeof assetBurnSchema>;

/**
 * Alias Registration Form Schema
 * For CreateAlias (Type 10) transactions
 */
export const aliasRegistrationSchema = z.object({
  alias: aliasSchema,
  fee: optionalAmountSchema,
});

export type AliasRegistrationFormData = z.infer<typeof aliasRegistrationSchema>;

/**
 * Data Transaction Form Schema
 * For Data (Type 12) transactions
 */
export const dataTransactionSchema = z.object({
  data: z
    .array(
      z.object({
        key: z.string().min(1, 'Key cannot be empty').max(100, 'Key cannot exceed 100 characters'),
        type: z.enum(['string', 'integer', 'boolean', 'binary']),
        value: z.union([z.string(), z.number(), z.boolean()]),
      }),
    )
    .min(1, 'At least one data entry required'),
  fee: optionalAmountSchema,
});

export type DataTransactionFormData = z.infer<typeof dataTransactionSchema>;

/**
 * DEX Order Form Schema
 * For placing buy/sell orders on DEX
 */
export const dexOrderSchema = z.object({
  amount: amountSchema,
  amountAsset: z.string().min(1, 'Amount asset is required'),
  expiration: z.number().int().positive().optional(), // Timestamp in ms
  matcherFee: optionalAmountSchema,
  orderType: z.enum(['buy', 'sell']),
  price: amountSchema,
  priceAsset: z.string().min(1, 'Price asset is required'),
});

export type DexOrderFormData = z.infer<typeof dexOrderSchema>;

/**
 * ============================================
 * AUTHENTICATION FORM SCHEMAS
 * User authentication and wallet management
 * ============================================
 */

/**
 * Login Form Schema
 */
export const loginSchema = z.object({
  saveAccount: z.boolean().optional(),
  seedPhrase: seedPhraseSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Password Confirmation Schema
 * For password-protected operations
 */
export const passwordConfirmationSchema = z
  .object({
    confirmPassword: z.string(),
    password: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordConfirmationFormData = z.infer<typeof passwordConfirmationSchema>;

/**
 * ============================================
 * UTILITY FUNCTIONS
 * Helper functions for form handling
 * ============================================
 */

/**
 * Get error message from Zod validation
 * Extracts first error message from field errors
 */
export function getFormError(fieldErrors: unknown): string | undefined {
  if (!fieldErrors || typeof fieldErrors !== 'object') return;
  if ('message' in fieldErrors && typeof fieldErrors.message === 'string') {
    return fieldErrors.message;
  }
}

/**
 * Format form data for API submission
 * Removes undefined/null values and normalizes data
 */
export function formatFormData<T extends Record<string, unknown>>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined && value !== null),
  ) as T;
}

/**
 * Validate address or alias format
 * Returns 'address' | 'alias' | 'invalid'
 */
export function validateRecipient(value: string): 'address' | 'alias' | 'invalid' {
  try {
    addressSchema.parse(value);
    return 'address';
  } catch {
    try {
      aliasSchema.parse(value);
      return 'alias';
    } catch {
      return 'invalid';
    }
  }
}

/**
 * Convert wavelets to DCC amount
 * 1 DCC = 100,000,000 wavelets (8 decimals)
 */
export function waveletsToAmount(wavelets: number): number {
  return wavelets / 100_000_000;
}

/**
 * Convert DCC amount to wavelets
 * 1 DCC = 100,000,000 wavelets (8 decimals)
 */
export function amountToWavelets(amount: number): number {
  return Math.floor(amount * 100_000_000);
}
