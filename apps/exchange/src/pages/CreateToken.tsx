/**
 * Create Token Page
 * Multi-step wizard for issuing a new token on DecentralChain.
 * Matches Angular version: src/modules/tokens/templates/tokens.html
 *
 * The form leads; guidance sits beside it as a quiet aside rather than a
 * coloured panel competing with it. Progress is the shared wizard rail (after
 * 21st.dev "Wizard Steps" by @ddoemonn), fields float their labels (after
 * 21st.dev "Floating Label" by @ddoemonn), and the review reads as a grouped
 * inset list whose figures are the same ones that will be signed.
 */

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  Slider,
  Switch,
  Typography,
} from '@mui/material';
import { ArrowLeft, ArrowRight, Code, Coins, Lightbulb, Plus } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from '@/components/atoms/Checkbox';
import { useSurface } from '@/components/atoms/SurfaceContext';
import { AnimatedNumber } from '@/components/premium/AnimatedNumber';
import { EmptyState } from '@/components/premium/EmptyState';
import { InsetLabelField } from '@/components/premium/InsetLabelField';
import { SegmentedControl } from '@/components/premium/SegmentedControl';
import { SettingsGroup, SettingsRow } from '@/components/premium/SettingsList';
import { StatusPill } from '@/components/premium/StatusPill';
import { WizardRail } from '@/components/premium/WizardRail';
import { useAuth } from '@/contexts/AuthContext';
import { LogoSubmissionCard } from '@/features/token-logos/LogoSubmissionCard';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { useTransactionSigning } from '@/hooks/useTransactionSigning';
import { PageFrame } from '@/layouts/PageFrame';
import { logger } from '@/lib/logger';
import { symbolFromName } from '@/lib/tokenLogos/submission';
import { TransactionType, transactionService } from '@/services/transactionService';
import { mobileLayout, mobileSurface } from '@/styles/mobileTokens';
import { typeScale } from '@/styles/tokens';
import { formatAmount } from '@/utils/formatters';

const steps = [
  {
    description:
      "Define the fundamental properties of your token. Choose a unique name and provide a clear description to help users understand your token's purpose.",
    label: 'Basic Info',
    title: 'Token Information',
  },
  {
    description:
      'Configure the technical specifications of your token. Set the quantity, decimals, and reissuability options based on your use case.',
    label: 'Properties',
    title: 'Token Properties',
  },
  {
    description:
      'Optionally add a smart contract script to create a Smart Asset. Scripts allow you to enforce custom validation rules on token transfers.',
    label: 'Smart Asset',
    title: 'Smart Asset Script',
  },
  {
    description:
      'Review all your token details before creation. Make sure everything is correct as the name and description cannot be changed later.',
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
    // The fee itself is filled in from the fee calculation, never a constant.
    text: '',
    title: 'Creation Fee',
  },
];

const PANEL = { damping: 34, mass: 0.8, stiffness: 260, type: 'spring' } as const;

const WAVELETS = 100000000;

/** A labelled form section: a medium label, an optional line of help, then the control. */
function Field({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: typeScale.body.size,
          fontWeight: 500,
          letterSpacing: typeScale.body.tracking,
        }}
      >
        {label}
      </Typography>
      {help ? (
        <Typography sx={{ color: 'text.secondary', fontSize: typeScale.bodySm.size, mt: 0.25 }}>
          {help}
        </Typography>
      ) : null}
      <Box sx={{ mt: 1.5 }}>{children}</Box>
    </Box>
  );
}

export const CreateToken = () => {
  const { compact } = useSurface();
  const reduced = useReducedMotion();
  const stepsRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
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
  const totalFeeInDCC = totalFeeInWavelets / WAVELETS;
  const issueFeeInDCC = 1.0; // 100,000,000 wavelets
  const scriptFeeInDCC = hasAssetScript ? 1.0 : 0;

  // Check if user has sufficient balance
  const userBalanceInDCC = balances?.available ? balances.available / WAVELETS : 0;
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
    setDirection(1);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setActiveStep((prev) => prev - 1);
  };

  /*
   * The rail only goes backwards: moving forward must pass each step's
   * validation through Next, so a finished step cannot be skipped past after
   * its fields were changed.
   */
  const handleStepClick = (index: number) => {
    if (index >= activeStep) return;
    setDirection(-1);
    setActiveStep(index);
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

  const tip = STEP_TIPS[activeStep];
  const tipText =
    activeStep === 3
      ? `Creating this token costs ${totalFeeInDCC.toLocaleString(undefined, { maximumFractionDigits: 8 })} DCC in network fees${hasAssetScript ? ', including the script' : ''}.`
      : tip?.text;

  const panels = [
    // Step 0: Basic Info
    () => (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <InsetLabelField
          label="Token name"
          required
          value={name}
          maxLength={16}
          placeholder="4 to 16 characters"
          onChange={(value) => {
            setName(value);
            setNameWarning(value.length > 0 && value.length < 4);
          }}
          invalid={nameWarning}
          hint={
            nameWarning
              ? 'Name is too short. Token names can be similar to existing tokens. Make sure you are not being scammed!'
              : 'Choose a name for your token. Minimum 4 characters, maximum 16.'
          }
        />
        <InsetLabelField
          label="Description (optional)"
          multiline
          rows={5}
          value={description}
          maxLength={1000}
          placeholder="Describe your token's purpose, use case, or any other relevant information..."
          onChange={(value) => setDescription(value)}
          hint="Provide additional information about your token"
        />
      </Box>
    ),
    // Step 1: Properties
    () => (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <InsetLabelField
          label="Quantity"
          required
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={count}
          placeholder="Enter total quantity"
          onChange={(value) => setCount(value)}
          hint="Total number of tokens to create. Can be increased later if reissuable."
        />

        <Field
          label="Supply"
          help={
            reissuable
              ? 'Reissuable: you can create more tokens later.'
              : 'Not reissuable: the total supply is fixed permanently.'
          }
        >
          <SegmentedControl
            label="Supply"
            value={reissuable ? 'true' : 'false'}
            onValueChange={(v) => setReissuable(v === 'true')}
            options={[
              { label: 'Not reissuable', value: 'false' },
              { label: 'Reissuable', value: 'true' },
            ]}
          />
        </Field>

        <Field
          label={`Decimals: ${precision}`}
          help="Number of decimal places for your token (0-8). Use 0 for NFTs, 8 for currencies."
        >
          <Box sx={{ px: 1.5 }}>
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
              aria-label="Decimals"
            />
          </Box>
        </Field>

        {/* NFT Detection */}
        {isNFT && (
          <Alert severity="info">
            <Typography sx={{ fontSize: typeScale.bodySm.size, fontWeight: 600 }}>
              NFT detected
            </Typography>
            Your settings match NFT standards: quantity = 1, decimals = 0, not reissuable
          </Alert>
        )}
      </Box>
    ),
    // Step 2: Smart Asset
    () => (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <SettingsGroup>
          <SettingsRow
            label="Smart asset script"
            htmlFor="create-token-script-toggle"
            description={
              hasAssetScript
                ? 'Script enabled: your token will be a Smart Asset.'
                : 'A script validates every transaction with this asset.'
            }
            control={
              <Switch
                id="create-token-script-toggle"
                checked={hasAssetScript}
                onChange={(e) => setHasAssetScript(e.target.checked)}
              />
            }
          />
        </SettingsGroup>

        {hasAssetScript ? (
          <>
            <InsetLabelField
              label="Asset script"
              required
              mono
              multiline
              rows={12}
              value={script}
              onChange={(value) => setScript(value)}
              placeholder={
                '# Enter your RIDE script here\n# Example:\n# {-# STDLIB_VERSION 5 #-}\n# {-# CONTENT_TYPE EXPRESSION #-}\n# {-# SCRIPT_TYPE ASSET #-}\n# true'
              }
              hint={
                <>
                  Use RIDE IDE to write and test your script before deploying.{' '}
                  <a
                    href="https://docs.decentralchain.io"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn more about RIDE scripts
                  </a>
                </>
              }
            />
            <Alert severity="warning">
              <Typography sx={{ fontSize: typeScale.bodySm.size, fontWeight: 600 }}>
                Permanent change
              </Typography>
              Setting a script makes your asset a Smart Asset. This operation is irreversible and
              cannot be removed or modified later.
            </Alert>
          </>
        ) : (
          <EmptyState
            compact
            icons={[Code]}
            title="No script required"
            description="Your token will be created as a standard asset without custom validation rules. You can skip this step if you don't need smart asset functionality."
          />
        )}
      </Box>
    ),
    // Step 3: Review
    () => (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Preview */}
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 2 }}>
          <Box
            aria-hidden
            sx={{
              alignItems: 'center',
              bgcolor: 'primary.main',
              borderRadius: '50%',
              color: 'primary.contrastText',
              display: 'flex',
              flexShrink: 0,
              fontSize: 22,
              fontWeight: 600,
              height: 56,
              justifyContent: 'center',
              width: 56,
            }}
          >
            {name ? name.charAt(0).toUpperCase() : '?'}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: typeScale.headingSm.size,
                fontWeight: 600,
                letterSpacing: typeScale.headingSm.tracking,
              }}
            >
              {name || 'Token Name'}
            </Typography>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: typeScale.body.size,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {count
                ? `${parseFloat(count).toLocaleString()} ${name || 'tokens'}`
                : 'Quantity not set'}
            </Typography>
          </Box>
          {isNFT && <StatusPill tone="accent">NFT</StatusPill>}
        </Box>

        <SettingsGroup title="Token details">
          <SettingsRow label="Name" control={name || '-'} />
          <SettingsRow
            label="Quantity"
            control={count ? parseFloat(count).toLocaleString() : '-'}
          />
          <SettingsRow label="Decimals" control={precision} />
          <SettingsRow label="Reissuable" control={reissuable ? 'Yes' : 'No'} />
          <SettingsRow label="Smart Asset" control={hasAssetScript ? 'Yes' : 'No'} />
          {description && <SettingsRow label="Description" description={description} />}
        </SettingsGroup>

        <Alert severity="warning">
          <Typography sx={{ fontSize: typeScale.bodySm.size, fontWeight: 600 }}>
            Important notice
          </Typography>
          Make sure all the information is correct. The name and description of the token cannot be
          changed after creation.
        </Alert>

        <SettingsGroup title="Transaction fees">
          <SettingsRow
            label="Token creation (Issue)"
            description="One-time fee to register your token on the blockchain"
            control={<AnimatedNumber value={issueFeeInDCC} decimals={8} suffix=" DCC" />}
          />
          {hasAssetScript && (
            <SettingsRow
              label="Smart asset script"
              description="Fee for attaching a script to your token"
              control={
                <AnimatedNumber value={scriptFeeInDCC} decimals={8} prefix="+" suffix=" DCC" />
              }
            />
          )}
          <SettingsRow
            label={<strong style={{ fontWeight: 600 }}>Total cost</strong>}
            control={
              <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
                <AnimatedNumber value={totalFeeInDCC} decimals={8} suffix=" DCC" />
              </Box>
            }
          />
          {user && (
            <SettingsRow
              label="Your available balance"
              control={
                <Box
                  component="span"
                  sx={{
                    color: hasInsufficientBalance ? 'error.main' : 'success.main',
                    fontWeight: 500,
                  }}
                >
                  <AnimatedNumber value={userBalanceInDCC} decimals={8} suffix=" DCC" />
                </Box>
              }
            />
          )}
        </SettingsGroup>

        {/* Insufficient Balance Warning */}
        {hasInsufficientBalance && user && (
          <Alert severity="error">
            <Typography sx={{ fontSize: typeScale.bodySm.size, fontWeight: 600 }}>
              Insufficient balance
            </Typography>
            You need at least {formatAmount(totalFeeInDCC)} DCC to create this token. Your current
            balance is {formatAmount(userBalanceInDCC)} DCC. Please add funds to your wallet to
            continue.
          </Alert>
        )}

        {/* Terms */}
        <FormControlLabel
          sx={{ alignItems: 'center', ml: -1 }}
          control={
            <Checkbox
              checked={agreeConditions}
              onChange={(e) => setAgreeConditions(e.target.checked)}
            />
          }
          label={
            <Typography sx={{ fontSize: typeScale.body.size }}>
              I have read and agree to the{' '}
              <Typography
                component="a"
                href="#"
                sx={{ color: 'primary.main', fontSize: 'inherit' }}
              >
                Terms of Token Creation
              </Typography>
            </Typography>
          }
        />
      </Box>
    ),
  ];

  const panelVariants = {
    center: { opacity: 1, x: 0 },
    enter: (d: 1 | -1) => (reduced ? { opacity: 0 } : { opacity: 0, x: d * 22 }),
    exit: (d: 1 | -1) =>
      reduced
        ? { opacity: 0, transition: { duration: 0 } }
        : { opacity: 0, transition: { duration: 0.14 }, x: d * -22 },
  };

  return (
    <PageFrame title="Create token" subtitle="Issue a new asset on DecentralChain.">
      {/*
          Progress rail. On a phone this is the one piece of the form worth
          keeping in view: it says where you are in a long flow. So it runs edge
          to edge on its own surface and pins directly beneath the band, which
          publishes its height because it shrinks as it collapses.
        */}
      <Box
        ref={stepsRef}
        sx={
          compact
            ? {
                /*
                 * Sitting in the page, the rail is part of it and reads on
                 * the canvas. Pinned, it is chrome laid over content passing
                 * underneath, and needs its own surface to stay legible — so
                 * the surface arrives with the pinning.
                 */
                bgcolor: stuck ? mobileSurface.card : 'transparent',
                // Transparent rather than absent, so gaining the rule costs
                // no height and shifts nothing below it.
                borderBottom: `1px solid ${stuck ? mobileSurface.border : 'transparent'}`,
                mb: 2,
                // Break out of the shell's gutter to reach both edges.
                ml: `-${mobileLayout.gutter}px`,
                mr: `-${mobileLayout.gutter}px`,
                pb: 1.5,
                position: 'sticky',
                pt: 1.5,
                top: 'var(--mobile-band-height, 0px)',
                transition: 'background-color 160ms ease, border-color 160ms ease',
                // Under the band, so it can never cover it.
                zIndex: 1050,
              }
            : { maxWidth: 760, mb: 3 }
        }
      >
        {/* The gutter is restored inside, so the pinned surface can run edge to edge. */}
        <Box
          style={
            compact
              ? { paddingLeft: mobileLayout.gutter, paddingRight: mobileLayout.gutter }
              : undefined
          }
        >
          <WizardRail
            steps={steps.map((s) => s.label)}
            index={activeStep}
            onStepClick={handleStepClick}
            label="Token creation steps"
          />
        </Box>
      </Box>

      <Grid container spacing={{ md: 4, xs: 3 }}>
        {/* The form */}
        <Grid size={{ md: 8, xs: 12 }} sx={{ maxWidth: { md: 760 } }}>
          <Card sx={{ overflow: 'hidden' }}>
            <CardContent>
              <Typography
                component="h2"
                sx={{
                  fontSize: typeScale.subheading.size,
                  fontWeight: 600,
                  letterSpacing: typeScale.subheading.tracking,
                  mb: 1,
                }}
              >
                {steps[activeStep]?.title}
              </Typography>
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={activeStep}
                  custom={direction}
                  variants={panelVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={reduced ? { duration: 0 } : PANEL}
                >
                  {panels[activeStep]?.()}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.5, mt: 2.5 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowLeft size={18} />}
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{ minWidth: 112 }}
            >
              Back
            </Button>
            <Box sx={{ flex: 1 }} />
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                endIcon={<ArrowRight size={18} />}
                onClick={handleNext}
                disabled={!isStepValid()}
                sx={{ minWidth: 112 }}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={handleSubmit}
                disabled={!agreeConditions || isSubmitting || submitSuccess}
                sx={{ minWidth: 160 }}
              >
                {isSubmitting ? 'Creating...' : submitSuccess ? 'Created!' : 'Create Token'}
              </Button>
            )}
          </Box>

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
                symbol={symbolFromName(name)}
                issuer={user?.address ?? ''}
              />
            </>
          )}
        </Grid>

        {/* Guidance: quiet text beside the form, not a second panel. */}
        <Grid size={{ md: 4, xs: 12 }}>
          <Box
            component="aside"
            aria-label="Guidance"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              position: { md: 'sticky' },
              pt: 0.5,
              top: 24,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: typeScale.bodySm.size,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                Step {activeStep + 1} of {steps.length}
              </Typography>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: typeScale.body.size,
                  lineHeight: 1.5,
                  mt: 0.75,
                }}
              >
                {steps[activeStep]?.description}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box
                aria-hidden
                sx={{
                  alignItems: 'center',
                  bgcolor: 'action.hover',
                  borderRadius: '50%',
                  color: 'text.secondary',
                  display: 'flex',
                  flexShrink: 0,
                  height: 32,
                  justifyContent: 'center',
                  width: 32,
                }}
              >
                {activeStep === 3 ? <Coins size={16} /> : <Lightbulb size={16} />}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: typeScale.body.size, fontWeight: 600 }}>
                  {tip?.title}
                </Typography>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: typeScale.bodySm.size,
                    lineHeight: 1.5,
                    mt: 0.25,
                  }}
                >
                  {tipText}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </PageFrame>
  );
};
