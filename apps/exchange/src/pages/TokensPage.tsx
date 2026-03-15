import { Box, MenuItem, Slider as MuiSlider, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import type React from 'react';
import { useState } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '../components/atoms/Button';
import { Checkbox } from '../components/atoms/Checkbox';
import { Input } from '../components/atoms/Input';

// Types
interface TokenForm {
  name: string;
  description: string;
  quantity: string;
  decimals: number;
  reissuable: boolean;
  hasScript: boolean;
  script: string;
}

// Styled Components (migrating to MUI gradually)
const Container = styled(Box)(({ theme }) => ({
  margin: '0 auto',
  maxWidth: 800,
  minHeight: '100vh',
  padding: theme.spacing(4, 2),
}));

const TextArea = styled('textarea')(({ theme }) => ({
  '&:disabled': {
    backgroundColor: theme.palette.action.disabledBackground,
    cursor: 'not-allowed',
  },
  '&:focus': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 3px ${theme.palette.primary.main}33`,
  },
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  color: theme.palette.text.primary,
  fontFamily: '"Courier New", monospace',
  fontSize: '1rem',
  minHeight: 120,
  outline: 'none',
  padding: theme.spacing(1.5),
  resize: 'vertical',
  transition: 'border-color 0.2s ease',
  width: '100%',
}));

export const TokensPage: React.FC = () => {
  const [formData, setFormData] = useState<TokenForm>({
    decimals: 8,
    description: '',
    hasScript: false,
    name: '',
    quantity: '',
    reissuable: false,
    script: '',
  });

  const [agreeTerms, setAgreeTerms] = useState(false);

  const isNFT = formData.decimals === 0 && formData.quantity === '1';

  const handleInputChange = (field: keyof TokenForm, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatQuantity = (quantity: string, decimals: number): string => {
    if (!quantity) return '0';
    const num = parseFloat(quantity);
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(num);
  };

  const isFormValid = (): boolean => {
    return (
      formData.name.length >= 4 &&
      formData.name.length <= 16 &&
      Boolean(formData.quantity) &&
      parseFloat(formData.quantity) > 0 &&
      agreeTerms &&
      (!formData.hasScript || formData.script.trim().length > 0)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    logger.debug('Creating token with data:', formData);
    // In real implementation, this would call the blockchain API
    alert('Token creation submitted! (Demo mode - not actually created)');
  };

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          Token Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Issue new tokens on the DecentralChain blockchain
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        {/* Token Name */}
        <Box>
          <Typography variant="body1" fontWeight={500} sx={{ mb: 1 }}>
            Token Name *
          </Typography>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter token name (4-16 characters)"
            inputProps={{ maxLength: 16 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Choose a unique name for your token. Between 4 and 16 characters.
          </Typography>
        </Box>

        {/* Description */}
        <Box>
          <Typography variant="body1" fontWeight={500} sx={{ mb: 1 }}>
            Description
          </Typography>
          <TextArea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your token (optional, max 1000 characters)"
            maxLength={1000}
          />
        </Box>

        {/* Quantity & Reissuable */}
        <Box>
          <Typography variant="body1" fontWeight={500} sx={{ mb: 1 }}>
            Total Amount *
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Input
              type="number"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              placeholder="0"
              sx={{ flex: 1 }}
              inputProps={{ min: '0', step: 'any' }}
            />
            <TextField
              select
              value={formData.reissuable ? 'true' : 'false'}
              onChange={(e) => handleInputChange('reissuable', e.target.value === 'true')}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="false">Not Reissuable</MenuItem>
              <MenuItem value="true">Reissuable</MenuItem>
            </TextField>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {formData.reissuable
              ? 'You can increase the supply later'
              : 'Supply is fixed and cannot be changed'}
          </Typography>
        </Box>

        {/* Decimals */}
        <Box>
          <Typography variant="body1" fontWeight={500} sx={{ mb: 1 }}>
            Decimals (Precision)
          </Typography>
          <Box sx={{ px: 1 }}>
            <MuiSlider
              value={formData.decimals}
              onChange={(_, value) => handleInputChange('decimals', value as number)}
              min={0}
              max={8}
              marks
              valueLabelDisplay="auto"
            />
            <Typography variant="h6" textAlign="center" sx={{ mt: 1 }}>
              {formData.decimals} decimals
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Number of decimal places (0-8). Use 0 for NFTs or whole units.
          </Typography>
        </Box>

        {/* NFT Warning */}
        {isNFT && (
          <Box
            sx={{
              bgcolor: 'rgba(255, 193, 7, 0.1)',
              borderColor: 'warning.main',
              borderLeft: 4,
              borderRadius: 1,
              p: 2,
            }}
          >
            <Box sx={{ mb: 1 }}>
              <Box
                component="span"
                sx={{
                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                  border: 1,
                  borderColor: 'success.main',
                  borderRadius: 2,
                  color: 'success.main',
                  display: 'inline-block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  px: 1.5,
                  py: 0.5,
                }}
              >
                NFT Mode
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              You&apos;re creating a Non-Fungible Token (NFT) with quantity 1 and 0 decimals. This
              token will be unique and indivisible.
            </Typography>
          </Box>
        )}

        {/* Smart Script */}
        <Box>
          <Typography variant="body1" fontWeight={500} sx={{ mb: 1 }}>
            Smart Asset Script
          </Typography>
          <Box
            sx={{
              alignItems: 'center',
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              display: 'flex',
              gap: 1.5,
              p: 2,
            }}
          >
            <Checkbox
              checked={formData.hasScript}
              onChange={(e) => handleInputChange('hasScript', e.target.checked)}
            />
            <Typography variant="body2" fontWeight={500} color="text.secondary">
              {formData.hasScript ? 'Script enabled (advanced users only)' : 'Enable custom script'}
            </Typography>
          </Box>
          {formData.hasScript && (
            <>
              <TextArea
                value={formData.script}
                onChange={(e) => handleInputChange('script', e.target.value)}
                placeholder="Enter RIDE script code..."
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Learn more about RIDE scripting at{' '}
                <a
                  href="https://docs.decentralchain.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#2196F3' }}
                >
                  docs.decentralchain.io
                </a>
              </Typography>
              <Box
                sx={{
                  bgcolor: 'rgba(255, 193, 7, 0.1)',
                  borderColor: 'warning.main',
                  borderLeft: 4,
                  borderRadius: 1,
                  mt: 1,
                  p: 2,
                }}
              >
                <Typography variant="body1" fontWeight={600} color="warning.main" sx={{ mb: 1 }}>
                  Warning: Smart Asset Script
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Adding a script to your asset makes it a &quot;smart asset&quot;. All operations
                  with this asset will require script validation, which may add complexity and fees.
                </Typography>
              </Box>
            </>
          )}
        </Box>

        {/* Preview */}
        <Box>
          <Typography variant="body1" fontWeight={500} sx={{ mb: 1 }}>
            Token Preview
          </Typography>
          <Box
            sx={{
              alignItems: 'center',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              display: 'flex',
              gap: 2,
              p: 3,
            }}
          >
            <Box
              sx={{
                '&::after': formData.hasScript
                  ? {
                      bottom: -4,
                      content: '"📜"',
                      fontSize: '1.25rem',
                      position: 'absolute',
                      right: -4,
                    }
                  : {},
                alignItems: 'center',
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                borderRadius: '50%',
                color: 'white',
                display: 'flex',
                flexShrink: 0,
                fontSize: '1.5rem',
                fontWeight: 600,
                height: 60,
                justifyContent: 'center',
                position: 'relative',
                width: 60,
              }}
            >
              {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                {formData.name || 'Token Name'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {formData.quantity ? formatQuantity(formData.quantity, formData.decimals) : '0'}{' '}
                {formData.name || 'TOKENS'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Warning */}
        <Box
          sx={{
            bgcolor: 'rgba(255, 193, 7, 0.1)',
            borderColor: 'warning.main',
            borderLeft: 4,
            borderRadius: 1,
            p: 2,
          }}
        >
          <Typography variant="body1" fontWeight={600} color="warning.main" sx={{ mb: 1 }}>
            Important Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Token creation is irreversible. Make sure all information is correct before proceeding.
            There is a network fee of 1 DCC for token issuance.
          </Typography>
        </Box>

        {/* Terms Agreement */}
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.5 }}>
          <Checkbox checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
          <Typography variant="body2">
            I understand the risks and agree to the terms of token creation
          </Typography>
        </Box>

        {/* Fee Info */}
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Network Fee: 1 DCC
        </Typography>

        {/* Submit Button */}
        <Button type="submit" disabled={!isFormValid()} fullWidth size="large">
          Create Token
        </Button>
      </Box>
    </Container>
  );
};
