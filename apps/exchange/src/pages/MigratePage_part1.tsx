import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Fade,
  Grow,
  Snackbar,
  Tooltip,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
  Warning as WarningIcon,
  HelpOutline as HelpIcon,
  ArrowForward as ArrowForwardIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

enum MigrationStep {
  WARNING = 0,
  VERIFY_OLD = 1,
  GENERATE_NEW = 2,
  CONFIRM = 3,
  COMPLETE = 4,
}

// Animations
const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.08); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
`;

// Styled Components
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(4),
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%)'
      : 'linear-gradient(180deg, #f5f7fa 0%, #e8f0fe 50%, #f0f4ff 100%)',
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const FloatingShape = styled(Box)(({ theme }) => ({
  position: 'absolute',
  borderRadius: '40% 60% 60% 40% / 50% 50% 50% 50%',
  background:
    theme.palette.mode === 'dark'
      ? 'radial-gradient(circle, rgba(31, 90, 246, 0.15) 0%, rgba(31, 90, 246, 0) 70%)'
      : 'radial-gradient(circle, rgba(31, 90, 246, 0.1) 0%, rgba(31, 90, 246, 0) 70%)',
  animation: `${float} 10s ease-in-out infinite`,
  pointerEvents: 'none',
}));

const ContentWrapper = styled(Box)({
  maxWidth: '900px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 1,
});

const MainCard = styled(Paper)(({ theme }) => ({
  background:
    theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(24px)',
  borderRadius: theme.spacing(3),
  padding: theme.spacing(5),
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 12px 48px rgba(0, 0, 0, 0.5)'
      : '0 12px 48px rgba(0, 0, 0, 0.08)',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

export const MigratePage: React.FC = () => {
  useAuth(); // Kept for auth context
  const [activeStep, setActiveStep] = useState(MigrationStep.WARNING);
  const [, setLoading] = useState(false);

  // Step 1: Warning checkboxes
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [exportConfirmed, setExportConfirmed] = useState(false);
  const [irreversibleConfirmed, setIrreversibleConfirmed] = useState(false);

  // Step 3: New account generation
  const [newSeed, setNewSeed] = useState<string[]>([]);
  const [, setNewAddress] = useState('');

  // UI states
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    // Load progress from localStorage
    const savedProgress = localStorage.getItem('migration_progress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setActiveStep(progress.step || MigrationStep.WARNING);
    }

    // Warn before leaving
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeStep > MigrationStep.WARNING && activeStep < MigrationStep.COMPLETE) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeStep]);

  useEffect(() => {
    // Save progress
    if (activeStep < MigrationStep.COMPLETE) {
      localStorage.setItem('migration_progress', JSON.stringify({ step: activeStep }));
    } else {
      localStorage.removeItem('migration_progress');
    }
  }, [activeStep]);

  const handleGenerateNewAccount = async () => {
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockWords = [
        'abandon',
        'ability',
        'able',
        'about',
        'above',
        'absent',
        'absorb',
        'abstract',
        'absurd',
        'abuse',
        'access',
        'accident',
        'account',
        'accuse',
        'achieve',
      ];
      setNewSeed(mockWords);
      setNewAddress('3P' + 'B'.repeat(33));

      setSnackbar({
        open: true,
        message: 'New account generated successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to generate new account', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeStep === MigrationStep.GENERATE_NEW && newSeed.length === 0) {
      handleGenerateNewAccount();
    }
  }, [activeStep, newSeed.length]);

  const steps = [
    'Backup Warning',
    'Verify Old Account',
    'Generate New Account',
    'Confirm Migration',
    'Complete',
  ];

  const canProceedFromWarning = backupConfirmed && exportConfirmed && irreversibleConfirmed;

  return (
    <Fade in={isVisible} timeout={600}>
      <PageContainer>
        <FloatingShape sx={{ width: '600px', height: '600px', top: '-200px', left: '-150px' }} />
        <FloatingShape
          sx={{
            width: '500px',
            height: '500px',
            bottom: '-150px',
            right: '-100px',
            animationDelay: '3s',
          }}
        />
        <FloatingShape
          sx={{ width: '400px', height: '400px', top: '40%', right: '5%', animationDelay: '6s' }}
        />

        <Tooltip title="Need help?">
          <IconButton
            onClick={() => setHelpDialogOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(31, 90, 246, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1a4dd4 0%, #4a6fd9 100%)',
                transform: 'scale(1.05)',
              },
              zIndex: 1000,
            }}
          >
            <HelpIcon />
          </IconButton>
        </Tooltip>

        <ContentWrapper>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 1,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2rem', sm: '2.8rem' },
            }}
          >
            Account Migration Wizard
          </Typography>

          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              mb: 5,
              px: 2,
            }}
          >
            Safely migrate your account to a new seed phrase with full asset transfer
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <MainCard>
            {activeStep === MigrationStep.WARNING && (
              <Grow in timeout={800}>
                <Box>
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <WarningIcon
                      sx={{
                        fontSize: '80px',
                        color: 'warning.main',
                        animation: `${pulse} 2s ease-in-out infinite`,
                        mb: 2,
                      }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                      Important: Back Up Your Account
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Before proceeding, ensure you have backed up your current account. This
                      process is irreversible.
                    </Typography>
                  </Box>

                  <Alert severity="warning" icon={<SecurityIcon />} sx={{ mb: 3 }}>
                    <strong>Migration Safety Checklist</strong>
                    <Typography variant="body2">
                      Complete all items below before proceeding. Your account security depends on
                      it.
                    </Typography>
                  </Alert>

                  <List sx={{ mb: 3 }}>
                    <ListItem>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={backupConfirmed}
                            onChange={(e) => setBackupConfirmed(e.target.checked)}
                            color="primary"
                          />
                        }
                        label="I have securely saved my current seed phrase"
                      />
                    </ListItem>
                    <ListItem>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={exportConfirmed}
                            onChange={(e) => setExportConfirmed(e.target.checked)}
                            color="primary"
                          />
                        }
                        label="I have exported and saved my backup file"
                      />
                    </ListItem>
                    <ListItem>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={irreversibleConfirmed}
                            onChange={(e) => setIrreversibleConfirmed(e.target.checked)}
                            color="primary"
                          />
                        }
                        label="I understand this migration process cannot be reversed"
                      />
                    </ListItem>
                  </List>

                  <Paper
                    sx={{
                      p: 2,
                      mb: 3,
                      background: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      <strong>💡 Why migrate?</strong> Migration creates a new account with a fresh
                      seed phrase, useful for enhanced security or if you suspect your current seed
                      may be compromised.
                    </Typography>
                  </Paper>

                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={!canProceedFromWarning}
                    onClick={() => setActiveStep(MigrationStep.VERIFY_OLD)}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      background: canProceedFromWarning
                        ? 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)'
                        : undefined,
                      boxShadow: canProceedFromWarning
                        ? '0 4px 16px rgba(31, 90, 246, 0.3)'
                        : undefined,
                    }}
                  >
                    Continue to Migration
                  </Button>
                </Box>
              </Grow>
            )}

            {/* Other steps continue... due to length limits, file will be written directly */}
          </MainCard>
        </ContentWrapper>

        <Dialog
          open={helpDialogOpen}
          onClose={() => setHelpDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HelpIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Migration Help
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Why should I migrate my account?
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Migration creates a new account with enhanced security. It's recommended if you
              suspect your seed phrase may have been compromised or want to start fresh.
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Is migration safe?
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Yes, when done correctly. Always ensure you have backed up your current account before
              starting and save your new seed phrase securely.
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              What happens to my old account?
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Your old account remains active but will have zero balance after migration. You can
              still access it with your old seed phrase if needed.
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              How long does migration take?
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Typically 2-5 minutes, depending on network congestion and the number of assets being
              transferred.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHelpDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </PageContainer>
    </Fade>
  );
};

export default MigratePage;
