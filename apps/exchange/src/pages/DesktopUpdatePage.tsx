import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  styled,
  useTheme,
  Fade,
  keyframes,
} from '@mui/material';
import { CheckCircle, Update, Schedule } from '@mui/icons-material';

/**
 * DesktopUpdatePage Component
 *
 * Modern update notification for desktop Electron application
 */

// Bounce animation
const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
`;

// Container
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)'
      : 'linear-gradient(180deg, #f5f7fa 0%, #e8f0fe 100%)',
}));

// Update card
const UpdateCard = styled(Paper)(({ theme }) => ({
  maxWidth: 600,
  padding: theme.spacing(5),
  textAlign: 'center',
  background:
    theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  borderRadius: theme.spacing(3),
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 12px 40px rgba(0, 0, 0, 0.5)'
      : '0 12px 40px rgba(0, 0, 0, 0.08)',
}));

// Icon with bounce
const IconBox = styled(Box)({
  fontSize: 64,
  marginBottom: 24,
  animation: `${bounce} 2s ease-in-out infinite`,
});

// Release notes section
const ReleaseNotesBox = styled(Box)(({ theme }) => ({
  margin: theme.spacing(3, 0),
  padding: theme.spacing(2.5),
  background: theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.08)' : 'rgba(31, 90, 246, 0.05)',
  borderRadius: theme.spacing(2),
  textAlign: 'left',
  maxHeight: 300,
  overflowY: 'auto',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.2)' : 'rgba(31, 90, 246, 0.15)'}`,
}));

// Props Interface
export interface DesktopUpdatePageProps {
  version?: string;
  releaseNotes?: string;
  features?: string[];
  onInstall?: () => void;
  onLater?: () => void;
}

export const DesktopUpdatePage: React.FC<DesktopUpdatePageProps> = ({
  version = 'Latest',
  releaseNotes,
  features,
  onInstall,
  onLater,
}) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleInstall = () => {
    if (onInstall) {
      onInstall();
    } else if (typeof window !== 'undefined' && (window as any).electron?.installUpdate) {
      (window as any).electron.installUpdate();
    }
  };

  const handleLater = () => {
    if (onLater) {
      onLater();
    } else {
      window.history.back();
    }
  };

  return (
    <PageContainer>
      <Fade in={isVisible} timeout={600}>
        <Container maxWidth="sm">
          <UpdateCard elevation={0}>
            <IconBox>
              <Update sx={{ fontSize: 'inherit', color: theme.palette.primary.main }} />
            </IconBox>

            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 2,
                background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Update Available
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" color="text.secondary" component="span">
                Version{' '}
              </Typography>
              <Chip
                label={version}
                sx={{
                  background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                  color: 'white',
                  fontWeight: 600,
                  mx: 0.5,
                }}
              />
              <Typography variant="body1" color="text.secondary" component="span">
                {' '}
                is ready to install
              </Typography>
            </Box>

            {features && features.length > 0 && (
              <ReleaseNotesBox>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    mb: 1.5,
                    color: theme.palette.primary.main,
                  }}
                >
                  What's New:
                </Typography>
                <List dense>
                  {features.map((feature, index) => (
                    <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckCircle
                          sx={{
                            fontSize: 18,
                            color: theme.palette.success.main,
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={feature}
                        primaryTypographyProps={{
                          fontSize: '0.95rem',
                          color: theme.palette.text.secondary,
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </ReleaseNotesBox>
            )}

            {releaseNotes && !features && (
              <ReleaseNotesBox>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    mb: 1.5,
                    color: theme.palette.primary.main,
                  }}
                >
                  Release Notes:
                </Typography>
                <Typography
                  component="pre"
                  sx={{
                    fontFamily: '"Roboto Mono", monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    color: theme.palette.text.secondary,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                  }}
                >
                  {releaseNotes}
                </Typography>
              </ReleaseNotesBox>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleInstall}
                startIcon={<Update />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                  boxShadow: '0 4px 16px rgba(31, 90, 246, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1a4ed0 0%, #4a71e6 100%)',
                    boxShadow: '0 6px 20px rgba(31, 90, 246, 0.4)',
                  },
                }}
              >
                Install Update
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleLater}
                startIcon={<Schedule />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    background:
                      theme.palette.mode === 'dark'
                        ? 'rgba(31, 90, 246, 0.1)'
                        : 'rgba(31, 90, 246, 0.05)',
                  },
                }}
              >
                Later
              </Button>
            </Box>

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 3,
                color: theme.palette.text.secondary,
                opacity: 0.8,
              }}
            >
              The application will restart after the update is installed.
            </Typography>
          </UpdateCard>
        </Container>
      </Fade>
    </PageContainer>
  );
};

export default DesktopUpdatePage;
