/**
 * Create Token Page
 * Modern multi-step wizard for creating new tokens on the blockchain
 * Matches Angular version: src/modules/tokens/templates/tokens.html
 */

import {
  AddCircleOutlined,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  CodeOutlined,
  HelpOutlined,
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
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
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
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSurface } from '@/components/atoms/SurfaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { LogoSubmissionCard } from '@/features/token-logos/LogoSubmissionCard';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { useTransactionSigning } from '@/hooks/useTransactionSigning';
import { PageFrame } from '@/layouts/PageFrame';
import { logger } from '@/lib/logger';
import { TransactionType, transactionService } from '@/services/transactionService';
import { mobileLayout } from '@/styles/mobileTokens';
import { palette as brandPalette, radii } from '@/styles/tokens';
import { tokens } from '@/theme/tokens/semantic';
import { formatAmount } from '@/utils/formatters';

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
  const { compact } = useSurface();
  const { palette } = useTheme();
  const t = tokens(palette.mode);
  const stepsRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [issuedAssetId, setIssuedAssetId] = useState<string | null>(null);

  // Get user and balance data
  const { user } = useAuth();
  const { signIssue } = useTransactionSigning();
  const { balances } = useBalanceWatcher({
    enabled: !!user?.address,
  });

  /*
   * Whether the step bar has reached its pinned position.
   *
   * It is compared against its own resolved `top` rather than a constant: the
   * bar pins below the header band, and the band shrinks as it collapses, so
   * the offset it sticks at is not fixed. Reading the computed value keeps the
   * two in agreement without this needing to know the band exists.
   */
  useEffect(() => {
    const el = stepsRef.current;
    if (!compact || !el) return;
    const onScroll = () => {
      const offset = Number.parseFloat(getComputedStyle(el).top) || 0;
      setStuck(el.getBoundingClientRect().top <= offset + 1);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [compact]);

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

  const handleSubmit = async () => {
    if (!user || !agreeConditions || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const quantity = Math.floor(parseFloat(count) * 10 ** precision);

      const issueParams: {
        name: string;
        description: string;
        quantity: number;
        decimals: number;
        reissuable: boolean;
        fee: number;
        script?: string;
      } = {
        decimals: precision,
        description,
        fee: totalFeeInWavelets,
        name,
        quantity,
        reissuable,
      };

      if (hasAssetScript && script.trim()) {
        issueParams.script = `base64:${btoa(script.trim())}`;
      }

      // signIssue uses the wallet seed to create a properly signed Issue tx
      const signedTx = await signIssue(issueParams);

      const broadcastResult = await transactionService.broadcast(signedTx);
      if (broadcastResult.status === 'error') {
        throw new Error(broadcastResult.error ?? 'Failed to broadcast transaction');
      }

      setIssuedAssetId(broadcastResult.id ?? null);
      setSubmitSuccess(true);
      logger.info('[CreateToken] Token issued:', broadcastResult.id);
    } catch (err) {
      logger.error('[CreateToken] Issue transaction failed:', err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Token creation failed. Check your balance and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageFrame title="Create token" subtitle="Issue a new asset on DecentralChain.">
      {/*
            Stepper. On a phone this is the one piece of the form worth keeping
            in view: it says where you are in a long flow. So it runs edge to
            edge on its own surface and pins directly beneath the band, which
            publishes its height because it shrinks as it collapses.
          */}
      <Box
        ref={stepsRef}
        sx={
          compact
            ? {
                '& .MuiStepIcon-root': { fontSize: 26 },
                // Desktop label sizing wraps "Smart Asset" onto a second
                // line at a quarter of a phone's width, which makes a
                // permanently-pinned bar taller than it needs to be.
                '& .MuiStepLabel-label': { fontSize: 12, lineHeight: 1.3, mt: '4px' },
                /*
                 * Sitting in the page, the steps are part of it and read on
                 * the canvas. Pinned, they are chrome laid over content
                 * passing underneath, and need their own surface to stay
                 * legible — so the surface arrives with the pinning.
                 *
                 * That surface must be *mode-aware*, because the `StepLabel`
                 * ink on it is. This pinned `mobileSurface.card`
                 * (`palette.pureWhite`) and `mobileSurface.border`;
                 * `styles/mobileTokens.ts` has no mode dimension by design,
                 * so both were fixed light fills under MUI's mode-aware
                 * `text.primary`/`text.secondary` — 1.09:1 in dark, i.e. the
                 * one element pinned specifically so it survives a glance was
                 * the one that vanished. `surface.raised`/`border.subtle` are
                 * the same roles with the mode dimension the mobile set
                 * lacks.
                 */
                bgcolor: stuck ? t.surface.raised : 'transparent',
                // Transparent rather than absent, so gaining the rule costs
                // no height and shifts nothing below it.
                borderBottom: `1px solid ${stuck ? t.border.subtle : 'transparent'}`,
                mb: 2,
                // Break out of the shell's gutter to reach both edges.
                mx: `-${mobileLayout.gutter}px`,
                position: 'sticky',
                pt: 1.5,
                px: `${mobileLayout.gutter}px`,
                top: 'var(--mobile-band-height, 0px)',
                transition: 'background-color 160ms ease, border-color 160ms ease',
                // Under the band, so it can never cover it.
                zIndex: 1050,
              }
            : { mb: 4 }
        }
      >
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
              background: brandPalette.indigoInk,
              color: brandPalette.pureWhite,
              height: '100%',
              position: 'sticky',
              top: 80,
            }}
          >
            <CardContent>
              <Box
                sx={{
                  alignItems: 'center',
                  bgcolor: alpha(brandPalette.pureWhite, 0.2),
                  borderRadius: '4px',
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

              <Typography variant="h4" sx={{ fontWeight: 300, mb: 2 }}>
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
                        bgcolor:
                          stepIndex <= activeStep
                            ? brandPalette.pureWhite
                            : alpha(brandPalette.pureWhite, 0.3),
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
                  bgcolor: alpha(brandPalette.pureWhite, 0.15),
                  borderRadius: 2,
                  mt: 4,
                  p: 2,
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                  <InfoOutlined sx={{ fontSize: 20, mt: 0.2 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 400, mb: 0.5 }}>
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
              borderRadius: radii.cards,
              minHeight: 500,
              p: 4,
            }}
          >
            {[
              // Step 0: Basic Info
              () => (
                <Stack spacing={3}>
                  <Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 400 }}>
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
                    <Typography variant="body1" sx={{ fontWeight: 400, mb: 1 }}>
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
                      slotProps={{ htmlInput: { maxLength: 1000 } }}
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
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 400 }}>
                        Quantity *
                      </Typography>
                      <Tooltip title="Total number of tokens to create. Can be increased later if reissuable.">
                        <HelpOutlined sx={{ color: 'text.secondary', fontSize: 18 }} />
                      </Tooltip>
                    </Stack>
                    <TextField
                      fullWidth
                      type="number"
                      value={count}
                      onChange={(e) => setCount(e.target.value)}
                      placeholder="Enter total quantity"
                      slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                      sx={{ mb: 2 }}
                    />
                  </Box>

                  <Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 400 }}>
                        Reissuable
                      </Typography>
                      <Tooltip title="Reissuable: You can issue more tokens later. Not reissuable: The total number is fixed forever.">
                        <HelpOutlined sx={{ color: 'text.secondary', fontSize: 18 }} />
                      </Tooltip>
                    </Stack>
                    <FormControl fullWidth>
                      <Select
                        value={reissuable ? 'true' : 'false'}
                        onChange={(e) => setReissuable(e.target.value === 'true')}
                      >
                        <MenuItem value="false">
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 400 }}>
                              Not Reissuable
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Total supply is fixed permanently
                            </Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="true">
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 400 }}>
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
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 400 }}>
                        Decimals: {precision}
                      </Typography>
                      <Tooltip title="Number of decimal places for your token (0-8). Use 0 for NFTs, 8 for currencies.">
                        <HelpOutlined sx={{ color: 'text.secondary', fontSize: 18 }} />
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
                        // `bgcolor` was a fixed light literal; the Alert's
                        // own text/icon ink is MUI's *ambient*, mode-aware
                        // `info` computation, which the fixed bg no longer
                        // pairs with once dark mode reaches it. Dropping
                        // the override lets MUI supply both together, as
                        // every other unmodified Alert in this file
                        // already does. The accent bar keeps its identity
                        // in both modes via the semantic token.
                        borderLeft: `4px solid ${t.intent.info}`,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 400, mb: 0.5 }}>
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
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 400 }}>
                        Enable Smart Asset Script
                      </Typography>
                      <Tooltip
                        title={
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{ display: 'block', fontWeight: 400, mb: 0.5 }}
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
                        <HelpOutlined sx={{ color: 'text.secondary', fontSize: 18 }} />
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
                        <Typography variant="body1" sx={{ fontWeight: 400, mb: 1.5 }}>
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

                      {/*
                          No `bgcolor` override — the fixed light literal it
                          used to carry left MUI's own mode-aware `warning`
                          ink stranded on a permanently-light panel once dark
                          mode reached it (measured 1.11:1; task-6-report.md).
                          Every other Alert in this file already lets MUI
                          supply the pair.
                        */}
                      <Alert severity="warning">
                        <Typography variant="body2" sx={{ fontWeight: 400, mb: 0.5 }}>
                          Permanent Change
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
                        // Fixed light literals; `text.secondary`/default
                        // ink on top measured 1.04:1 once dark mode
                        // reached this still-fixed-light panel (see
                        // task-6-report.md). `surface.sunken`/
                        // `border.subtle` track the same mode as the ink.
                        bgcolor: t.surface.sunken,
                        border: `2px dashed ${t.border.subtle}`,
                        borderRadius: 2,
                        p: 4,
                        textAlign: 'center',
                      }}
                    >
                      <CodeOutlined sx={{ color: 'text.secondary', fontSize: 60, mb: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 400, mb: 1 }}>
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
                    <Typography variant="h6" sx={{ fontWeight: 300, mb: 2 }}>
                      Token Preview
                    </Typography>
                    <Paper
                      sx={{
                        alignItems: 'center',
                        // Fixed light literals; `text.primary`/
                        // `text.secondary` ink on top measured 1.04:1
                        // once dark mode reached this still-fixed-light
                        // panel (see task-6-report.md).
                        bgcolor: t.surface.sunken,
                        border: `1px solid ${t.border.subtle}`,
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
                            color: 'primary.contrastText',
                            fontSize: 28,
                            fontWeight: 300,
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
                              '&:hover': { bgcolor: brandPalette.pureWhite },
                              bgcolor: brandPalette.pureWhite,
                              bottom: -4,
                              boxShadow: 2,
                              // This badge is deliberately fixed white in
                              // both modes (a floating chip over the
                              // avatar), but its icon had no explicit
                              // colour, so it fell back to the *ambient*
                              // `action.active` default — dark ink in
                              // light mode (fine, coincidentally), pure
                              // white in MUI's stock dark palette, i.e.
                              // white-on-white (measured exactly 1:1; see
                              // task-6-report.md). The fixed badge needs a
                              // fixed ink to match, the same "surface
                              // pinned, ink pinned to the same mode"
                              // pairing `LandingPage`'s canvas already
                              // established (task-5-report.md).
                              color: tokens('light').text.primary,
                              position: 'absolute',
                              right: -4,
                            }}
                          >
                            <Palette sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 300, mb: 0.5 }}>
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
                            bgcolor: brandPalette.indigoInk,
                            color: brandPalette.pureWhite,
                            fontWeight: 400,
                          }}
                        />
                      )}
                    </Paper>
                  </Box>

                  {/* Details Summary */}
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 300, mb: 2 }}>
                      Token Details
                    </Typography>
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          // Fixed light literal; the row's ink is
                          // theme-relative (`text.secondary`/default),
                          // measured 1.04:1 once dark mode reached this
                          // still-fixed-light row (task-6-report.md).
                          bgcolor: t.surface.sunken,
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          p: 2,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          {name || '-'}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          // Fixed light literal; the row's ink is
                          // theme-relative (`text.secondary`/default),
                          // measured 1.04:1 once dark mode reached this
                          // still-fixed-light row (task-6-report.md).
                          bgcolor: t.surface.sunken,
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          p: 2,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Quantity
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          {count ? parseFloat(count).toLocaleString() : '-'}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          // Fixed light literal; the row's ink is
                          // theme-relative (`text.secondary`/default),
                          // measured 1.04:1 once dark mode reached this
                          // still-fixed-light row (task-6-report.md).
                          bgcolor: t.surface.sunken,
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          p: 2,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Decimals
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          {precision}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          // Fixed light literal; the row's ink is
                          // theme-relative (`text.secondary`/default),
                          // measured 1.04:1 once dark mode reached this
                          // still-fixed-light row (task-6-report.md).
                          bgcolor: t.surface.sunken,
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          p: 2,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Reissuable
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          {reissuable ? 'Yes' : 'No'}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          // Fixed light literal; the row's ink is
                          // theme-relative (`text.secondary`/default),
                          // measured 1.04:1 once dark mode reached this
                          // still-fixed-light row (task-6-report.md).
                          bgcolor: t.surface.sunken,
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          p: 2,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Smart Asset
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          {hasAssetScript ? 'Yes' : 'No'}
                        </Typography>
                      </Box>
                      {description && (
                        <Box
                          sx={{
                            // Fixed light literal; the row's ink is
                            // theme-relative (`text.secondary`/default),
                            // measured 1.04:1 once dark mode reached this
                            // still-fixed-light row (task-6-report.md).
                            bgcolor: t.surface.sunken,
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
                  {/* No `bgcolor` override — see the identical note above. */}
                  <Alert severity="warning">
                    <Typography variant="body2" sx={{ fontWeight: 400, mb: 0.5 }}>
                      Important Notice
                    </Typography>
                    <Typography variant="caption">
                      Make sure all the information is correct. The name and description of the
                      token cannot be changed after creation.
                    </Typography>
                  </Alert>

                  {/* Fee Info */}
                  <Paper
                    sx={{
                      // Was the fixed light literal `#E8E9FF` — the
                      // `primary.main`/`accent.primary` ink this panel
                      // holds (the icon, "Transaction Fees" and "Total
                      // Cost") is tuned as *text on a dark surface* in
                      // dark mode, not ink on a permanently pale wash:
                      // measured 2.71:1 once dark mode reached it (see
                      // task-6-report.md). `accent.muted` — the semantic
                      // token this hue otherwise maps to — has the same
                      // problem (3.24:1 dark); `surface.sunken` is the
                      // neutral panel `accent.primary` is actually
                      // designed to sit on (5.7-6.2:1 both modes).
                      bgcolor: t.surface.sunken,
                      // The border also moves off its fixed brand-indigo
                      // literal (`#533afd`) to the same neutral hairline
                      // every other panel in this file uses — not a
                      // contrast fix (a border is non-text), but the
                      // brand outline is intentionally given up here for
                      // one consistent neutral frame (fix round 1, flagged
                      // in task-6-report.md after the original report
                      // named only the bgcolor change).
                      border: `1px solid ${t.border.subtle}`,
                      borderRadius: 2,
                      p: 3,
                    }}
                  >
                    <Stack spacing={2}>
                      {/* Header */}
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <InfoOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="body2" color="primary" sx={{ fontWeight: 300 }}>
                          Transaction Fees
                        </Typography>
                      </Stack>

                      {/* Fee Breakdown */}
                      <Stack spacing={1.5}>
                        {/* Token Creation Fee */}
                        <Stack
                          direction="row"
                          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <Stack>
                            <Typography variant="body2" sx={{ fontWeight: 400 }}>
                              Token Creation (Issue)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              One-time fee to register your token on the blockchain
                            </Typography>
                          </Stack>
                          <Typography variant="body1" sx={{ fontWeight: 300 }}>
                            {formatAmount(issueFeeInDCC)} DCC
                          </Typography>
                        </Stack>

                        {/* Smart Asset Script Fee */}
                        {hasAssetScript && (
                          <Stack
                            direction="row"
                            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                          >
                            <Stack>
                              <Typography variant="body2" sx={{ fontWeight: 400 }}>
                                Smart Asset Script
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Fee for attaching a script to your token
                              </Typography>
                            </Stack>
                            <Typography variant="body1" sx={{ fontWeight: 300 }}>
                              +{formatAmount(scriptFeeInDCC)} DCC
                            </Typography>
                          </Stack>
                        )}

                        <Divider sx={{ my: 1 }} />

                        {/* Total Fee */}
                        <Stack
                          direction="row"
                          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <Typography variant="body1" sx={{ fontWeight: 300 }}>
                            Total Cost
                          </Typography>
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 300 }}>
                            {formatAmount(totalFeeInDCC)} DCC
                          </Typography>
                        </Stack>

                        {/* User Balance */}
                        {user && (
                          <Stack
                            direction="row"
                            sx={{ alignItems: 'center', justifyContent: 'space-between', pt: 1 }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              Your Available Balance
                            </Typography>
                            <Typography
                              variant="body2"
                              color={hasInsufficientBalance ? 'error.main' : 'success.main'}
                              sx={{ fontWeight: 400 }}
                            >
                              {formatAmount(userBalanceInDCC)} DCC
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </Stack>
                  </Paper>

                  {/* Insufficient Balance Warning */}
                  {hasInsufficientBalance && user && (
                    // No colour override — see the identical Alert note
                    // above (measured 1.26:1 pre-fix; task-6-report.md).
                    <Alert severity="error" icon={<WarningAmber />}>
                      <Typography variant="body2" sx={{ fontWeight: 400, mb: 0.5 }}>
                        Insufficient Balance
                      </Typography>
                      <Typography variant="caption">
                        You need at least {formatAmount(totalFeeInDCC)} DCC to create this token.
                        Your current balance is {formatAmount(userBalanceInDCC)} DCC. Please add
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
            {/*
                Neither button below names its own fill/hover/disabled
                colours any more. Both did (a fixed violet fill, hover to a
                fixed darker violet), which duplicated — and once dark mode could
                actually reach it, contradicted — what `variant="contained"`
                already derives from `primary.main`/`primary.dark` with a
                matching `primary.contrastText` ink. The duplicate was
                invisible under the old wrapper (always light, so the two
                systems' light values coincided); once real dark mode
                reached it, the *ink* correctly went mode-aware
                (`primary.contrastText` → near-black) while the *fill*
                stayed the fixed light-tuned literal: measured 2.95:1 (see
                task-6-report.md). Plain `variant="contained"` keeps both in
                the one place that already derives them together.
              */}
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={handleNext}
                disabled={!isStepValid()}
                sx={{ minWidth: 120 }}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                startIcon={<AddCircleOutlined />}
                onClick={handleSubmit}
                disabled={!agreeConditions || isSubmitting || submitSuccess}
                sx={{ minWidth: 160 }}
              >
                {isSubmitting ? 'Creating...' : submitSuccess ? 'Created!' : 'Create Token'}
              </Button>
            )}
          </Stack>

          {submitError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {submitError}
            </Alert>
          )}
          {submitSuccess && issuedAssetId && (
            <>
              <Alert severity="success" sx={{ mt: 2 }}>
                Token created! Asset ID: <strong>{issuedAssetId}</strong>
              </Alert>
              <LogoSubmissionCard
                assetId={issuedAssetId}
                name={name}
                symbol={name.slice(0, 4).toUpperCase()}
                issuer={user?.address ?? ''}
              />
            </>
          )}
        </Grid>
      </Grid>
    </PageFrame>
  );
};
