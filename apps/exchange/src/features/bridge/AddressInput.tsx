/**
 * AddressInput Component
 * Form input for external blockchain addresses with real-time validation
 * Uses gateway regex patterns for address format validation
 */
import { useState, useEffect } from 'react';
import { TextField, InputAdornment, Box, Typography } from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import { useConfig } from '@/contexts/ConfigContext';
import {
  validateGatewayAddress,
  getGatewayConfig,
  getAddressFormatHint,
} from '@/services/gateway/utils';

interface AddressInputProps {
  /** Asset ID for validation rules */
  assetId: string;
  /** Current input value */
  value: string;
  /** Callback when value or validation state changes */
  onChange: (value: string, isValid: boolean) => void;
  /** Input label */
  label?: string;
  /** Input placeholder */
  placeholder?: string;
  /** Whether input is disabled */
  disabled?: boolean;
}

/**
 * Validated address input component for gateway operations
 * Provides real-time validation feedback with visual indicators
 */
export const AddressInput: React.FC<AddressInputProps> = ({
  assetId,
  value,
  onChange,
  label = 'Destination Address',
  placeholder = 'Enter blockchain address',
  disabled = false,
}) => {
  const { wavesGateway } = useConfig();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');
  const [formatHint, setFormatHint] = useState<string>('');

  /**
   * Get format hint from gateway config
   */
  useEffect(() => {
    const config = getGatewayConfig(assetId, wavesGateway || {});
    if (config?.regex) {
      const hint = getAddressFormatHint(config.regex);
      setFormatHint(hint);
    } else {
      setFormatHint('');
    }
  }, [assetId, wavesGateway]);

  /**
   * Validate address on every change
   */
  useEffect(() => {
    // Clear validation for empty input
    if (!value) {
      setIsValid(null);
      setError('');
      return;
    }

    // Validate address
    const valid = validateGatewayAddress(value, assetId, wavesGateway || {});
    setIsValid(valid);

    if (!valid) {
      setError('Invalid address format');
    } else {
      setError('');
    }
  }, [value, assetId, wavesGateway]);

  /**
   * Handle input change
   */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value.trim();
    
    // Update parent with new value and current validation state
    // Validation will be updated in the next effect cycle
    const valid = newValue
      ? validateGatewayAddress(newValue, assetId, wavesGateway || {})
      : false;
    
    onChange(newValue, valid);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        fullWidth
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        error={isValid === false}
        helperText={error}
        InputProps={{
          endAdornment: isValid !== null && value && (
            <InputAdornment position="end">
              {isValid ? (
                <CheckCircle color="success" sx={{ fontSize: 24 }} />
              ) : (
                <Error color="error" sx={{ fontSize: 24 }} />
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '&.Mui-error': {
              '& fieldset': {
                borderColor: 'error.main',
              },
            },
            '&.Mui-focused': {
              '& fieldset': {
                borderColor: isValid ? 'success.main' : undefined,
              },
            },
          },
        }}
      />
      
      {/* Format Hint */}
      {formatHint && !error && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, display: 'block', ml: 1.5 }}
        >
          Expected format: {formatHint}
        </Typography>
      )}
    </Box>
  );
};
