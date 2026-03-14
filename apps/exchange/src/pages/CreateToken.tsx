/**
 * Create Token Page
 * Modern multi-step wizard for creating new tokens on the blockchain
 * Matches Angular version: src/modules/tokens/templates/tokens.html
 */
import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Select,
  MenuItem,
  FormControl,
  Slider,
  Switch,
  FormControlLabel,
  Checkbox,
  Alert,
  Avatar,
  IconButton,
  Tooltip,
  Container,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material';
import {
  AddCircleOutline,
  HelpOutline,
  Palette,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  InfoOutlined,
  TokenOutlined,
  SettingsOutlined,
  CodeOutlined,
  PreviewOutlined,
  WarningAmber,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { landingTheme } from '@/theme/landingTheme';
import { TransactionType, transactionService } from '@/services/transactionService';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { useAuth } from '@/contexts/AuthContext';

const steps = [
  {
    label: 'Basic Info',
    title: 'Token Information',
    description:
      "Define the fundamental properties of your token. Choose a unique name and provide a clear description to help users understand your token's purpose.",
    icon: <TokenOutlined />,
  },
  {
    label: 'Properties',
    title: 'Token Properties',
    description:
      'Configure the technical specifications of your token. Set the quantity, decimals, and reissuability options based on your use case.',
    icon: <SettingsOutlined />,
  },
  {
    label: 'Smart Asset',
    title: 'Smart Asset Script',
    description:
      'Optionally add a smart contract script to create a Smart Asset. Scripts allow you to enforce custom validation rules on token transfers.',
    icon: <CodeOutlined />,
  },
  {
    label: 'Review',
    title: 'Review & Create',
    description:
      'Review all your token details before creation. Make sure everything is correct as the name and description cannot be changed later.',
    icon: <PreviewOutlined />,
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
    switch (activeStep) {
      case 0:
        return name.length >= 4 && name.length <= 16;
      case 1:
        return count && parseFloat(count) > 0;
      case 2:
        return !hasAssetScript || script;
      case 3:
        return agreeConditions && !hasInsufficientBalance;
      default:
        return false;
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    console.log('Creating token:', { name, description, count, precision, reissuable, script });
    // TODO: Implement token creation logic
  };

  return (
    <ThemeProvider theme={landingTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
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
                mb: 1,
                background: 'linear-gradient(135deg, #5940d4 0%, #3d26be 100%)',
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
            <Grid item xs={12} md={5}>
              <Card
                sx={{
                  height: '100%',
                  background: 'linear-gradient(135deg, #5940d4 0%, #3d26be 100%)',
                  color: 'white',
                  position: 'sticky',
                  top: 80,
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      fontSize: 30,
                    }}
                  >
                    {steps[activeStep].icon}
                  </Box>

                  <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                    {steps[activeStep].title}
                  </Typography>

                  <Typography variant="body1" sx={{ mb: 4, opacity: 0.95, lineHeight: 1.7 }}>
                    {steps[activeStep].description}
                  </Typography>

                  {/* Progress Indicator */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="caption" sx={{ opacity: 0.8, mb: 1, display: 'block' }}>
                      Step {activeStep + 1} of {steps.length}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {steps.map((_, index) => (
                        <Box
                          key={index}
                          sx={{
                            flex: 1,
                            height: 4,
                            borderRadius: 2,
                            bgcolor: index <= activeStep ? 'white' : 'rgba(255, 255, 255, 0.3)',
                            transition: 'background-color 0.3s',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>

                  {/* Info Box */}
                  <Box
                    sx={{
                      mt: 4,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <InfoOutlined sx={{ fontSize: 20, mt: 0.2 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                          {activeStep === 0 && 'Token Name Guidelines'}
                          {activeStep === 1 && 'Understanding Decimals'}
                          {activeStep === 2 && 'Smart Asset Benefits'}
                          {activeStep === 3 && 'Creation Fee'}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
                          {activeStep === 0 &&
                            'Choose a clear and memorable name. Avoid names that could be confused with existing tokens to prevent scams.'}
                          {activeStep === 1 &&
                            'Decimals determine divisibility. For currencies, use 8. For NFTs, use 0.'}
                          {activeStep === 2 &&
                            'Smart Assets can have custom rules like transfer restrictions or conditions. This is permanent once set.'}
                          {activeStep === 3 && 'Token creation requires a fee of 100,000 DCC.'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column - Forms */}
            <Grid item xs={12} md={7}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  minHeight: 500,
                }}
              >
                {/* Step 0: Basic Info */}
                {activeStep === 0 && (
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
                        sx={{ mb: 1.5, display: 'block' }}
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
                        sx={{ mb: 1.5, display: 'block' }}
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
                        sx={{ mt: 1, display: 'block', textAlign: 'right' }}
                      >
                        {description.length}/1000 characters
                      </Typography>
                    </Box>
                  </Stack>
                )}

                {/* Step 1: Properties */}
                {activeStep === 1 && (
                  <Stack spacing={3}>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Typography variant="body1" fontWeight={600}>
                          Quantity *
                        </Typography>
                        <Tooltip title="Total number of tokens to create. Can be increased later if reissuable.">
                          <HelpOutline sx={{ fontSize: 18, color: 'text.secondary' }} />
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
                          <HelpOutline sx={{ fontSize: 18, color: 'text.secondary' }} />
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
                          <HelpOutline sx={{ fontSize: 18, color: 'text.secondary' }} />
                        </Tooltip>
                      </Stack>
                      <Box sx={{ px: 2 }}>
                        <Slider
                          value={precision}
                          onChange={(_, value) => setPrecision(value as number)}
                          min={0}
                          max={8}
                          marks={[
                            { value: 0, label: '0 (NFT)' },
                            { value: 2, label: '2' },
                            { value: 4, label: '4' },
                            { value: 6, label: '6' },
                            { value: 8, label: '8 (Currency)' },
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
                )}

                {/* Step 2: Smart Asset */}
                {activeStep === 2 && (
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
                          <HelpOutline sx={{ fontSize: 18, color: 'text.secondary' }} />
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
                              fontFamily: 'monospace',
                              '& textarea': {
                                fontFamily: 'monospace',
                              },
                            }}
                          />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 1, display: 'block' }}
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
                          p: 4,
                          textAlign: 'center',
                          bgcolor: '#F9FAFB',
                          borderRadius: 2,
                          border: '2px dashed #E5E7EB',
                        }}
                      >
                        <CodeOutlined sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
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
                )}

                {/* Step 3: Review */}
                {activeStep === 3 && (
                  <Stack spacing={3}>
                    {/* Preview Card */}
                    <Box>
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                        Token Preview
                      </Typography>
                      <Paper
                        sx={{
                          p: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2.5,
                          bgcolor: '#F9FAFB',
                          border: '1px solid #E5E7EB',
                          borderRadius: 2,
                        }}
                      >
                        <Box sx={{ position: 'relative' }}>
                          <Avatar
                            sx={{
                              width: 64,
                              height: 64,
                              bgcolor: 'primary.main',
                              fontSize: 28,
                              fontWeight: 700,
                            }}
                          >
                            {name ? name.charAt(0).toUpperCase() : '?'}
                          </Avatar>
                          <Tooltip title="Click to customize token appearance">
                            <IconButton
                              size="small"
                              sx={{
                                position: 'absolute',
                                bottom: -4,
                                right: -4,
                                bgcolor: 'white',
                                boxShadow: 2,
                                '&:hover': { bgcolor: 'white' },
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
                            p: 2,
                            bgcolor: '#F9FAFB',
                            borderRadius: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
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
                            p: 2,
                            bgcolor: '#F9FAFB',
                            borderRadius: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
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
                            p: 2,
                            bgcolor: '#F9FAFB',
                            borderRadius: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
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
                            p: 2,
                            bgcolor: '#F9FAFB',
                            borderRadius: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
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
                            p: 2,
                            bgcolor: '#F9FAFB',
                            borderRadius: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
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
                              p: 2,
                              bgcolor: '#F9FAFB',
                              borderRadius: 1,
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
                        p: 3,
                        bgcolor: '#EEF2FF',
                        border: '1px solid #5940d4',
                        borderRadius: 2,
                      }}
                    >
                      <Stack spacing={2}>
                        {/* Header */}
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <InfoOutlined sx={{ fontSize: 20, color: 'primary.main' }} />
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
                )}
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
                      minWidth: 120,
                      background: 'linear-gradient(180deg, #5940d4 0%, #3d26be 100%)',
                      '&:hover': {
                        background: 'linear-gradient(180deg, #4a35c0 0%, #32219f 100%)',
                      },
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
                      minWidth: 160,
                      background: 'linear-gradient(180deg, #5940d4 0%, #3d26be 100%)',
                      '&:hover': {
                        background: 'linear-gradient(180deg, #4a35c0 0%, #32219f 100%)',
                      },
                      '&:disabled': {
                        background: '#E5E7EB',
                        color: '#9CA3AF',
                      },
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
