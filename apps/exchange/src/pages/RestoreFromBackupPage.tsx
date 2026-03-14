import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogContent,
  Snackbar,
  Alert,
  Fade,
  Grow,
  CircularProgress,
  Chip,
  Tooltip,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

/**
 * RestoreFromBackupPage Component
 * 
 * Stunning file upload experience with drag-and-drop, validation, and progress feedback
 */

// Animations
const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const confetti = keyframes`
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
  100% { transform: scale(1) rotate(360deg); opacity: 1; }
`;

// Styled Components
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(4),
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)'
    : 'linear-gradient(180deg, #f5f7fa 0%, #e8f0fe 100%)',
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const FloatingOrb = styled(Box)(({ theme }) => ({
  position: 'absolute',
  borderRadius: '50%',
  background: theme.palette.mode === 'dark'
    ? 'radial-gradient(circle, rgba(31, 90, 246, 0.2) 0%, rgba(31, 90, 246, 0) 70%)'
    : 'radial-gradient(circle, rgba(31, 90, 246, 0.1) 0%, rgba(31, 90, 246, 0) 70%)',
  animation: `${pulse} 5s ease-in-out infinite`,
  pointerEvents: 'none',
}));

const ContentWrapper = styled(Box)({
  maxWidth: '600px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 1,
});

const MainCard = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? 'rgba(26, 31, 58, 0.9)'
    : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  borderRadius: theme.spacing(3),
  padding: theme.spacing(4),
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 32px rgba(0, 0, 0, 0.4)'
    : '0 8px 32px rgba(0, 0, 0, 0.06)',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

const DropzoneBox = styled(Box)<{ isDragActive?: boolean }>(({ theme, isDragActive }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  background: isDragActive
    ? theme.palette.mode === 'dark'
      ? 'rgba(31, 90, 246, 0.1)'
      : 'rgba(31, 90, 246, 0.05)'
    : 'transparent',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    background: theme.palette.mode === 'dark'
      ? 'rgba(31, 90, 246, 0.05)'
      : 'rgba(31, 90, 246, 0.03)',
    '& .upload-icon': {
      animation: `${bounce} 0.6s ease-in-out`,
    },
  },
}));

const FilePreviewCard = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  background: theme.palette.mode === 'dark'
    ? 'rgba(31, 90, 246, 0.1)'
    : 'rgba(31, 90, 246, 0.05)',
  border: `1px solid ${theme.palette.primary.main}`,
  borderRadius: theme.spacing(1.5),
}));

const SuccessIcon = styled(CheckCircleIcon)(({ theme }) => ({
  fontSize: '80px',
  color: theme.palette.success.main,
  animation: `${confetti} 0.6s ease-out`,
}));

/**
 * RestoreFromBackupPage Component
 */
export const RestoreFromBackupPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [_success, setSuccess] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Validate file type
    if (!selectedFile.name.endsWith('.json') && !selectedFile.name.endsWith('.backup')) {
      setError('Please select a valid .json or .backup file');
      setSnackbar({ open: true, message: 'Invalid file type. Only .json or .backup files are accepted.', severity: 'error' });
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      setSnackbar({ open: true, message: 'File too large. Maximum size is 10MB.', severity: 'error' });
      return;
    }

    setFile(selectedFile);
    setError(null);
    setActiveStep(1);
    setSnackbar({ open: true, message: 'File uploaded successfully!', severity: 'success' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const handleRestore = async () => {
    if (!file) {
      setError('Please select a backup file');
      setSnackbar({ open: true, message: 'Please select a backup file', severity: 'error' });
      return;
    }

    if (!password) {
      setError('Please enter the backup password');
      setSnackbar({ open: true, message: 'Please enter the backup password', severity: 'error' });
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveStep(2);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const backupData = JSON.parse(content);

          // Validate backup structure
          if (!backupData.address || !backupData.encryptedSeed) {
            throw new Error('Invalid backup file structure');
          }

          // Simulate restore process
          await new Promise(resolve => setTimeout(resolve, 1500));

          // TODO: Implement actual restore logic
          setActiveStep(3);
          setSuccess(true);
          setShowSuccess(true);
          
          setTimeout(() => {
            navigate('/wallet');
          }, 3000);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to restore from backup';
          setError(errorMessage);
          setSnackbar({ open: true, message: errorMessage, severity: 'error' });
          setActiveStep(1);
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read backup file');
        setSnackbar({ open: true, message: 'Failed to read backup file', severity: 'error' });
        setIsLoading(false);
        setActiveStep(1);
      };

      reader.readAsText(file);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore from backup';
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      setIsLoading(false);
      setActiveStep(1);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setActiveStep(0);
    setSnackbar({ open: true, message: 'File removed', severity: 'info' });
  };

  const steps = ['Upload File', 'Verify Password', 'Restore Complete'];

  return (
    <Fade in={isVisible} timeout={600}>
      <PageContainer>
        {/* Floating Orbs */}
        <FloatingOrb sx={{ width: '400px', height: '400px', top: '-100px', left: '-100px' }} />
        <FloatingOrb sx={{ width: '350px', height: '350px', bottom: '-80px', right: '-80px', animationDelay: '2s' }} />

        <ContentWrapper>
          {/* Title */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 1,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2rem', sm: '2.5rem' },
            }}
          >
            Restore from Backup
          </Typography>

          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              mb: 4,
              px: 2,
            }}
          >
            Upload your encrypted backup file and enter your password to restore your wallet
          </Typography>

          {/* Progress Stepper */}
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Main Card */}
          <MainCard>
            {/* File Upload Section */}
            <input
              type="file"
              accept=".json,.backup"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="backup-file-input"
            />

            {!file ? (
              <label htmlFor="backup-file-input">
                <DropzoneBox
                  isDragActive={isDragActive}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <CloudUploadIcon
                    className="upload-icon"
                    sx={{
                      fontSize: '64px',
                      color: isDragActive ? 'primary.main' : 'text.secondary',
                      mb: 2,
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      background: isDragActive
                        ? 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)'
                        : 'inherit',
                      WebkitBackgroundClip: isDragActive ? 'text' : 'unset',
                      WebkitTextFillColor: isDragActive ? 'transparent' : 'inherit',
                    }}
                  >
                    {isDragActive ? 'Drop your file here' : 'Drag & drop your backup file here'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    or click to browse
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip label=".json" size="small" sx={{ mr: 1 }} />
                    <Chip label=".backup" size="small" />
                  </Box>
                </DropzoneBox>
              </label>
            ) : (
              <Grow in timeout={600}>
                <FilePreviewCard>
                  <FileIcon sx={{ fontSize: '40px', color: 'primary.main' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {file.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {formatFileSize(file.size)}
                    </Typography>
                  </Box>
                  <IconButton onClick={handleRemoveFile} size="small">
                    <CloseIcon />
                  </IconButton>
                </FilePreviewCard>
              </Grow>
            )}

            {/* Password Input */}
            {file && (
              <Fade in timeout={800}>
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Backup Password
                    </Typography>
                    <Tooltip title="This is the password you used when creating the backup. It's required to decrypt and restore your wallet.">
                      <InfoIcon sx={{ fontSize: '16px', color: 'text.secondary' }} />
                    </Tooltip>
                  </Box>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter backup password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                    error={!!error}
                    helperText={error || 'Enter the password used to encrypt this backup'}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Fade>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleRestore}
                disabled={!file || !password || isLoading}
                sx={{
                  background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                  boxShadow: '0 4px 16px rgba(31, 90, 246, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1a4dd4 0%, #4a6fd9 100%)',
                    boxShadow: '0 6px 20px rgba(31, 90, 246, 0.4)',
                  },
                }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={24} sx={{ color: 'white', mr: 1 }} />
                    Restoring...
                  </>
                ) : (
                  'Restore Wallet'
                )}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => navigate('/import')}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </Box>

            {/* Info Box */}
            <Paper
              sx={{
                mt: 3,
                p: 2,
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.03)',
                border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                📌 Important Information:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                <Typography component="li" variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Backup files are encrypted with your password
                </Typography>
                <Typography component="li" variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Make sure you remember the correct password
                </Typography>
                <Typography component="li" variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Only use backup files from trusted sources
                </Typography>
                <Typography component="li" variant="body2" sx={{ color: 'text.secondary' }}>
                  Maximum file size: 10MB
                </Typography>
              </Box>
            </Paper>
          </MainCard>
        </ContentWrapper>

        {/* Success Dialog */}
        <Dialog open={showSuccess} maxWidth="xs" fullWidth>
          <DialogContent sx={{ textAlign: 'center', py: 4 }}>
            <SuccessIcon />
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
              Restore Successful!
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Your wallet has been restored successfully. Redirecting to wallet...
            </Typography>
            <CircularProgress size={32} />
          </DialogContent>
        </Dialog>

        {/* Snackbar for Notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </PageContainer>
    </Fade>
  );
};

export default RestoreFromBackupPage;
