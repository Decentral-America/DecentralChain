/**
 * Create Token Page
 * Modern multi-step wizard for creating new tokens on the blockchain
 * Matches Angular version: src/modules/tokens/templates/tokens.html
 */

import {
  AddCircleOutline,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  CodeOutlined,
  HelpOutline,
  InfoOutlined,
  Palette,
  PreviewOutlined,
  SettingsOutlined,
  TokenOutlined,
  WarningAmber,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { logger } from '@/lib/logger';
import { TransactionType, transactionService } from '@/services/transactionService';
import { landingTheme } from '@/theme/landingTheme';

const steps = [
  {
    description:
      "Define the fundamental properties of your token. Choose a unique name and provide a clear description to help users understand your token's purpose.",
    icon: <TokenOutlined />,
    label: 'Basic Info',
    title: 'Token Information',
  },
  {
    description:
      'Configure the technical specifications of your token. Set the quantity, decimals, and reissuability options based on your use case.',
    icon: <SettingsOutlined />,
    label: 'Properties',
    title: 'Token Properties',
  },
  {
    description:
      'Optionally add a smart contract script to create a Smart Asset. Scripts allow you to enforce custom validation rules on token transfers.',
    icon: <CodeOutlined />,
    label: 'Smart Asset',
    title: 'Smart Asset Script',
  },
  {
    description:
      'Review all your token details before creation. Make sure everything is correct as the name and description cannot be changed later.',
    icon: <PreviewOutlined />,
    label: 'Review',
    title: 'Review & Create',
  },
];

const STEP_TIPS = [
  {
    text: 'Choose a clear and memorable name. Avoid names that could be confused with existing tokens to prevent scams.',
    title: 'Token Name Guidelines',
  },
  {
    text: 'Decimals determine divisibility. For currencies, use 8. For NFTs, use 0.',
    title: 'Understanding Decimals',
  },
  {
    text: 'Smart Assets can have custom rules like transfer restrictions or conditions. This is permanent once set.',
    title: 'Smart Asset Benefits',
  },
  {
    text: 'Token creation requires a fee of 100,000 DCC.',
    title: 'Creation Fee',
  },
];

export const CreateToken = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [count, setCount] = useState('');
  const [precision, setPrecision] = useState(8);
  const [reissuable, setReissuable] = useState(false);
  const [hasAssetScript, setHasAssetScript] = useState(false);
  const [script, setScript] = useState('');
  const [agreeConditions, setAgreeConditions] = useState(false);
  const [nameWarning, setNameWarning] = useState(false);

  // Get user and balance data
  const { user } = useAuth();
  const { balances } = useBalanceWatcher({
    enabled: !!user?.address,
  });

  const isNFT = precision === 0 && count === '1' && !reissuable;

  /**
   * Calculate total transaction fees
   * - Token creation (Issue transaction): 100,000,000 wavelets = 1 DCC
   * - Smart asset script (SetAssetScript): +100,000,000 wavelets = +1 DCC if hasAssetScript
   */
  const totalFeeInWavelets = useMemo(() => {
    const issueFee = transactionService.calculateFee(TransactionType.Issue);
    const scriptFee = hasAssetScript
      ? transactionService.calculateFee(TransactionType.SetAssetScript)
      : 0;
    return issueFee + scriptFee;
  }, [hasAssetScript]);

  // Convert wavelets to DCC (1 DCC = 100,000,000 wavelets)
  const totalFeeInDCC = totalFeeInWavelets / 100000000;
  const issueFeeInDCC = 1.0; // 100,000,000 wavelets
  const scriptFeeInDCC = hasAssetScript ? 1.0 : 0;

  // Check if user has sufficient balance
  const userBalanceInDCC = balances?.available ? balances.available / 100000000 : 0;
  const hasInsufficientBalance = userBalanceInDCC < totalFeeInDCC;

  const isStepValid = () => {
    const validators: Record<number, () => boolean> = {
      0: () => name.length >= 4 && name.length <= 16,
      1: () => !!count && parseFloat(count) > 0,
      2: () => !hasAssetScript || !!script,
      3: () => agreeConditions && !hasInsufficientBalance,
    };
    return validators[activeStep]?.() ?? false;
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    logger.debug('Creating token:', { count, description, name, precision, reissuable, script });
    // TODO: Implement token creation logic
  };

  return (
    <ThemeProvider theme={landingTheme}>
      <Box
        sx={{
          bgcolor: 'background.default',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h3"
              fontWeight={800}
              sx={{
                background: 'linear-gradient(135deg, #5940d4 0%, #3d26be 100%)',
                mb: 1,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Create Your Token
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: 18 }}>
              Follow the steps below to create your custom token on the blockchain
            </Typography>
          </Box>

          {/* Stepper */}
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((step) => (
                <Step key={step.label}>
                  <StepLabel>{step.label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Main Content */}
          <Grid container spacing={4}>
            {/* Left Column - Description with Gradient Background */}
            <Grid
              size={{
                md: 5,
                xs: 12,
              }}
            >
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #5940d4 0%, #3d26be 100%)',
                  color: 'white',
                  height: '100%',
                  position: 'sticky',
                  top: 80,
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      alignItems: 'center',
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      display: 'flex',
                      fontSize: 30,
                      height: 60,
                      justifyContent: 'center',
                      mb: 3,
                      width: 60,
                    }}
                  >
                    {steps[activeStep]?.icon}
                  </Box>

                  <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                    {steps[activeStep]?.title}
                  </Typography>

                  <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 4, opacity: 0.95 }}>
                    {steps[activeStep]?.description}
                  </Typography>

                  {/* Progress Indicator */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.8 }}>
                      Step {activeStep + 1} of {steps.length}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {steps.map((step, stepIndex) => (
                        <Box
                          key={step.label}
                          sx={{
                            bgcolor: stepIndex <= activeStep ? 'white' : 'rgba(255, 255, 255, 0.3)',
                            borderRadius: 2,
                            flex: 1,
                            height: 4,
                            transition: 'background-color 0.3s',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>

                  {/* Info Box */}
                  <Box
                    sx={{
                      backdropFilter: 'blur(10px)',
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: 2,
                      mt: 4,
                      p: 2,
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <InfoOutlined sx={{ fontSize: 20, mt: 0.2 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                          {STEP_TIPS[activeStep]?.title}
                        </Typography>
                        <Typography variant="caption" sx={{ lineHeight: 1.6, opacity: 0.9 }}>
                          {STEP_TIPS[activeStep]?.text}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column - Forms */}
            <Grid
              size={{
                md: 7,
                xs: 12,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  minHeight: 500,
                  p: 4,
                }}
              >
                {[
                  // Step 0: Basic Info
                  () => (
                    <Stack spacing={3}>
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <Typography variant="body1" fontWeight={600}>
                            Token Name *
                          </Typography>
                        </Stack>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 1.5 }}
                        >
                          Choose a name for your token. Minimum 4 characters, maximum 16.
                        </Typography>
                        <TextField
                          fullWidth
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            setNameWarning(e.target.value.length > 0 && e.target.value.length < 4);
                          }}
                          placeholder="Enter token name"
                          error={nameWarning}
                          helperText={
                            nameWarning
                              ? 'Name is too short. Token names can be similar to existing tokens. Make sure you are not being scammed!'
                              : ''
                          }
                        />
                      </Box>

                      <Box>
                        <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
                          Description (Optional)
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 1.5 }}
                        >
                          Provide additional information about your token
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={6}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe your token's purpose, use case, or any other relevant information..."
                          inputProps={{ maxLength: 1000 }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 1, textAlign: 'right' }}
                        >
                          {description.length}/1000 characters
                        </Typography>
                      </Box>
                    </Stack>
                  ),
                  // Step 1: Properties
                  () => (
                    <Stack spacing={3}>
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <Typography variant="body1" fontWeight={600}>
                            Quantity *
                          </Typography>
                          <Tooltip title="Total number of tokens to create. Can be increased later if reissuable.">
                            <HelpOutline sx={{ color: 'text.secondary', fontSize: 18 }} />
                          </Tooltip>
                        </Stack>
                        <TextField
                          fullWidth
                          type="number"
                          value={count}
                          onChange={(e) => setCount(e.target.value)}
                          placeholder="Enter total quantity"
                          inputProps={{ min: 0, step: 'any' }}
                          sx={{ mb: 2 }}
                        />
                      </Box>

                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <Typography variant="body1" fontWeight={600}>
                            Reissuable
                          </Typography>
                          <Tooltip title="Reissuable: You can issue more tokens later. Not reissuable: The total number is fixed forever.">
                            <HelpOutline sx={{ color: 'text.secondary', fontSize: 18 }} />
                          </Tooltip>
                        </Stack>
                        <FormControl fullWidth>
                          <Select
                            value={reissuable ? 'true' : 'false'}
                            onChange={(e) => setReissuable(e.target.value === 'true')}
                          >
                            <MenuItem value="false">
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  Not Reissuable
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Total supply is fixed permanently
                                </Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="true">
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  Reissuable
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  You can create more tokens later
                                </Typography>
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Box>

                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                          <Typography variant="body1" fontWeight={600}>
                            Decimals: {precision}
                          </Typography>
                          <Tooltip title="Number of decimal places for your token (0-8). Use 0 for NFTs, 8 for currencies.">
                            <HelpOutline sx={{ color: 'text.secondary', fontSize: 18 }} />
                          </Tooltip>
                        </Stack>
                        <Box sx={{ px: 2 }}>
                          <Slider
                            value={precision}
                            onChange={(_, value) => setPrecision(value as number)}
                            min={0}
                            max={8}
                            marks={[
                              { label: '0 (NFT)', value: 0 },
                              { label: '2', value: 2 },
                              { label: '4', value: 4 },
                              { label: '6', value: 6 },
                              { label: '8 (Currency)', value: 8 },
                            ]}
                            valueLabelDisplay="auto"
                            step={1}
                          />
                        </Box>
                      </Box>

                      {/* NFT Detection */}
                      {isNFT && (
                        <Alert
                          severity="info"
                          icon={<CheckCircle />}
                          sx={{
                            bgcolor: '#EEF2FF',
                            borderLeft: '4px solid #5940d4',
                          }}
                        >
                          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                            NFT Detected
                          </Typography>
                          <Typography variant="caption">
                            Your settings match NFT standards: quantity = 1, decimals = 0, not
                            reissuable
                          </Typography>
                        </Alert>
                      )}
                    </Stack>
                  ),
                  // Step 2: Smart Asset
                  () => (
                    <Stack spacing={3}>
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                          <Typography variant="body1" fontWeight={600}>
                            Enable Smart Asset Script
                          </Typography>
                          <Tooltip
                            title={
                              <Box>
                                <Typography
                                  variant="caption"
                                  fontWeight={600}
                                  sx={{ display: 'block', mb: 0.5 }}
                                >
                                  Smart Asset
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                  A smart asset is an asset with an attached script that validates
                                  transactions.
                                </Typography>
                                <Typography
                                  variant="caption"
                                  component="a"
                                  href="https://docs.decentralchain.io"
                                  target="_blank"
                                  sx={{ color: 'primary.light', textDecoration: 'underline' }}
                                >
                                  Learn more
                                </Typography>
                              </Box>
                            }
                          >
                            <HelpOutline sx={{ color: 'text.secondary', fontSize: 18 }} />
                          </Tooltip>
                        </Stack>

                        <FormControlLabel
                          control={
                            <Switch
                              checked={hasAssetScript}
                              onChange={(e) => setHasAssetScript(e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Typography variant="body2">
                              {hasAssetScript
                                ? 'Script enabled - Your token will be a Smart Asset'
                                : 'Enable to add a custom script to your token'}
                            </Typography>
                          }
                        />
                      </Box>

                      {hasAssetScript && (
                        <>
                          <Box>
                            <Typography variant="body1" fontWeight={600} sx={{ mb: 1.5 }}>
                              Asset Script *
                            </Typography>
                            <TextField
                              fullWidth
                              multiline
                              rows={12}
                              value={script}
                              onChange={(e) => setScript(e.target.value)}
                              placeholder="# Enter your RIDE script here
# Example:
# {-# STDLIB_VERSION 5 #-}
# {-# CONTENT_TYPE EXPRESSION #-}
# {-# SCRIPT_TYPE ASSET #-}
# true"
                              required={hasAssetScript}
                              sx={{
                                '& textarea': {
                                  fontFamily: 'monospace',
                                },
                                fontFamily: 'monospace',
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 1 }}
                            >
                              Use RIDE IDE to write and test your script before deploying
                            </Typography>
                          </Box>

                          <Alert severity="warning" sx={{ bgcolor: '#FFF7ED' }}>
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                              ⚠️ Permanent Change
                            </Typography>
                            <Typography variant="caption">
                              Setting a script makes your asset a Smart Asset. This operation is
                              irreversible and cannot be removed or modified later.
                            </Typography>
                          </Alert>
                        </>
                      )}

                      {!hasAssetScript && (
                        <Box
                          sx={{
                            bgcolor: '#F9FAFB',
                            border: '2px dashed #E5E7EB',
                            borderRadius: 2,
                            p: 4,
                            textAlign: 'center',
                          }}
                        >
                          <CodeOutlined sx={{ color: 'text.secondary', fontSize: 60, mb: 2 }} />
                          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                            No Script Required
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Your token will be created as a standard asset without custom validation
                            rules. You can skip this step if you don&apos;t need smart asset
                            functionality.
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  ),
                  // Step 3: Review
                  () => (
                    <Stack spacing={3}>
                      {/* Preview Card */}
                      <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                          Token Preview
                        </Typography>
                        <Paper
                          sx={{
                            alignItems: 'center',
                            bgcolor: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            borderRadius: 2,
                            display: 'flex',
                            gap: 2.5,
                            p: 3,
                          }}
                        >
                          <Box sx={{ position: 'relative' }}>
                            <Avatar
                              sx={{
                                bgcolor: 'primary.main',
                                fontSize: 28,
                                fontWeight: 700,
                                height: 64,
                                width: 64,
                              }}
                            >
                              {name ? name.charAt(0).toUpperCase() : '?'}
                            </Avatar>
                            <Tooltip title="Click to customize token appearance">
                              <IconButton
                                size="small"
                                sx={{
                                  '&:hover': { bgcolor: 'white' },
                                  bgcolor: 'white',
                                  bottom: -4,
                                  boxShadow: 2,
                                  position: 'absolute',
                                  right: -4,
                                }}
                              >
                                <Palette sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Box flex={1}>
                            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                              {name || 'Token Name'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {count
                                ? `${parseFloat(count).toLocaleString()} ${name || 'tokens'}`
                                : 'Quantity not set'}
                            </Typography>
                          </Box>
                          {isNFT && (
                            <Chip
                              label="NFT"
                              size="small"
                              sx={{
                                bgcolor: '#5940d4',
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </Paper>
                      </Box>

                      {/* Details Summary */}
                      <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                          Token Details
                        </Typography>
                        <Stack spacing={2}>
                          <Box
                            sx={{
                              bgcolor: '#F9FAFB',
                              borderRadius: 1,
                              display: 'flex',
                              justifyContent: 'space-between',
                              p: 2,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Name
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {name || '-'}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              bgcolor: '#F9FAFB',
                              borderRadius: 1,
                              display: 'flex',
                              justifyContent: 'space-between',
                              p: 2,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Quantity
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {count ? parseFloat(count).toLocaleString() : '-'}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              bgcolor: '#F9FAFB',
                              borderRadius: 1,
                              display: 'flex',
                              justifyContent: 'space-between',
                              p: 2,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Decimals
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {precision}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              bgcolor: '#F9FAFB',
                              borderRadius: 1,
                              display: 'flex',
                              justifyContent: 'space-between',
                              p: 2,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Reissuable
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {reissuable ? 'Yes' : 'No'}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              bgcolor: '#F9FAFB',
                              borderRadius: 1,
                              display: 'flex',
                              justifyContent: 'space-between',
                              p: 2,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Smart Asset
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {hasAssetScript ? 'Yes' : 'No'}
                            </Typography>
                          </Box>
                          {description && (
                            <Box
                              sx={{
                                bgcolor: '#F9FAFB',
                                borderRadius: 1,
                                p: 2,
                              }}
                            >
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Description
                              </Typography>
                              <Typography variant="body2">{description}</Typography>
                            </Box>
                          )}
                        </Stack>
                      </Box>

                      {/* Warning */}
                      <Alert severity="warning" sx={{ bgcolor: '#FFF7ED' }}>
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                          ⚠️ Important Notice
                        </Typography>
                        <Typography variant="caption">
                          Make sure all the information is correct. The name and description of the
                          token cannot be changed after creation.
                        </Typography>
                      </Alert>

                      {/* Fee Info */}
                      <Paper
                        sx={{
                          bgcolor: '#EEF2FF',
                          border: '1px solid #5940d4',
                          borderRadius: 2,
                          p: 3,
                        }}
                      >
                        <Stack spacing={2}>
                          {/* Header */}
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <InfoOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
                            <Typography variant="body2" fontWeight={700} color="primary">
                              Transaction Fees
                            </Typography>
                          </Stack>

                          {/* Fee Breakdown */}
                          <Stack spacing={1.5}>
                            {/* Token Creation Fee */}
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Stack>
                                <Typography variant="body2" fontWeight={600}>
                                  Token Creation (Issue)
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  One-time fee to register your token on the blockchain
                                </Typography>
                              </Stack>
                              <Typography variant="body1" fontWeight={700}>
                                {issueFeeInDCC.toFixed(8)} DCC
                              </Typography>
                            </Stack>

                            {/* Smart Asset Script Fee */}
                            {hasAssetScript && (
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Stack>
                                  <Typography variant="body2" fontWeight={600}>
                                    Smart Asset Script
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Fee for attaching a script to your token
                                  </Typography>
                                </Stack>
                                <Typography variant="body1" fontWeight={700}>
                                  +{scriptFeeInDCC.toFixed(8)} DCC
                                </Typography>
                              </Stack>
                            )}

                            <Divider sx={{ my: 1 }} />

                            {/* Total Fee */}
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography variant="body1" fontWeight={700}>
                                Total Cost
                              </Typography>
                              <Typography variant="h6" fontWeight={700} color="primary">
                                {totalFeeInDCC.toFixed(8)} DCC
                              </Typography>
                            </Stack>

                            {/* User Balance */}
                            {user && (
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ pt: 1 }}
                              >
                                <Typography variant="caption" color="text.secondary">
                                  Your Available Balance
                                </Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color={hasInsufficientBalance ? 'error.main' : 'success.main'}
                                >
                                  {userBalanceInDCC.toFixed(8)} DCC
                                </Typography>
                              </Stack>
                            )}
                          </Stack>
                        </Stack>
                      </Paper>

                      {/* Insufficient Balance Warning */}
                      {hasInsufficientBalance && user && (
                        <Alert
                          severity="error"
                          icon={<WarningAmber />}
                          sx={{ bgcolor: '#FEF2F2', border: '1px solid #FCA5A5' }}
                        >
                          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                            Insufficient Balance
                          </Typography>
                          <Typography variant="caption">
                            You need at least {totalFeeInDCC.toFixed(8)} DCC to create this token.
                            Your current balance is {userBalanceInDCC.toFixed(8)} DCC. Please add
                            funds to your wallet to continue.
                          </Typography>
                        </Alert>
                      )}

                      {/* Terms */}
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={agreeConditions}
                            onChange={(e) => setAgreeConditions(e.target.checked)}
                          />
                        }
                        label={
                          <Typography variant="body2">
                            I have read and agree to the{' '}
                            <Typography
                              component="a"
                              href="#"
                              sx={{ color: 'primary.main', textDecoration: 'underline' }}
                            >
                              Terms of Token Creation
                            </Typography>
                          </Typography>
                        }
                      />
                    </Stack>
                  ),
                ][activeStep]?.()}
              </Paper>

              {/* Navigation Buttons */}
              <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<ArrowBack />}
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  sx={{ minWidth: 120 }}
                >
                  Back
                </Button>
                <Box sx={{ flex: 1 }} />
                {activeStep < steps.length - 1 ? (
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    sx={{
                      '&:hover': {
                        background: 'linear-gradient(180deg, #4a35c0 0%, #32219f 100%)',
                      },
                      background: 'linear-gradient(180deg, #5940d4 0%, #3d26be 100%)',
                      minWidth: 120,
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddCircleOutline />}
                    onClick={handleSubmit}
                    disabled={!isStepValid()}
                    sx={{
                      '&:disabled': {
                        background: '#E5E7EB',
                        color: '#9CA3AF',
                      },
                      '&:hover': {
                        background: 'linear-gradient(180deg, #4a35c0 0%, #32219f 100%)',
                      },
                      background: 'linear-gradient(180deg, #5940d4 0%, #3d26be 100%)',
                      minWidth: 160,
                    }}
                  >
                    Create Token
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};
