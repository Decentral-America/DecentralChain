import { CheckCircle, Schedule, Update } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Container,
  Fade,
  keyframes,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  styled,
  Typography,
  useTheme,
} from '@mui/material';
import type React from 'react';
import { useEffect, useState } from 'react';

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
  alignItems: 'center',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)'
      : 'linear-gradient(180deg, #f5f7fa 0%, #e8f0fe 100%)',
  display: 'flex',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: theme.spacing(3),
}));

// Update card
const UpdateCard = styled(Paper)(({ theme }) => ({
  backdropFilter: 'blur(20px)',
  background:
    theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  borderRadius: theme.spacing(3),
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 12px 40px rgba(0, 0, 0, 0.5)'
      : '0 12px 40px rgba(0, 0, 0, 0.08)',
  maxWidth: 600,
  padding: theme.spacing(5),
  textAlign: 'center',
}));

// Icon with bounce
const IconBox = styled(Box)({
  animation: `${bounce} 2s ease-in-out infinite`,
  fontSize: 64,
  marginBottom: 24,
});

// Release notes section
const ReleaseNotesBox = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.08)' : 'rgba(31, 90, 246, 0.05)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.2)' : 'rgba(31, 90, 246, 0.15)'}`,
  borderRadius: theme.spacing(2),
  margin: theme.spacing(3, 0),
  maxHeight: 300,
  overflowY: 'auto',
  padding: theme.spacing(2.5),
  textAlign: 'left',
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
    } else if (
      typeof window !== 'undefined' &&
      (window as Window & { electron?: { installUpdate?: () => void } }).electron?.installUpdate
    ) {
      (
        window as Window & { electron?: { installUpdate?: () => void } }
      ).electron?.installUpdate?.();
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
              <Update sx={{ color: theme.palette.primary.main, fontSize: 'inherit' }} />
            </IconBox>

            <Typography
              variant="h3"
              sx={{
                background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                fontWeight: 800,
                mb: 2,
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
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    mb: 1.5,
                  }}
                >
                  What&apos;s New:
                </Typography>
                <List dense>
                  {features.map((feature) => (
                    <ListItem key={feature} disablePadding sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckCircle
                          sx={{
                            color: theme.palette.success.main,
                            fontSize: 18,
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={feature}
                        primaryTypographyProps={{
                          color: theme.palette.text.secondary,
                          fontSize: '0.95rem',
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
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    mb: 1.5,
                  }}
                >
                  Release Notes:
                </Typography>
                <Typography
                  component="pre"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontFamily: '"Roboto Mono", monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                  }}
                >
                  {releaseNotes}
                </Typography>
              </ReleaseNotesBox>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleInstall}
                startIcon={<Update />}
                sx={{
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1a4ed0 0%, #4a71e6 100%)',
                    boxShadow: '0 6px 20px rgba(31, 90, 246, 0.4)',
                  },
                  background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                  borderRadius: 2,
                  boxShadow: '0 4px 16px rgba(31, 90, 246, 0.3)',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
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
                  '&:hover': {
                    background:
                      theme.palette.mode === 'dark'
                        ? 'rgba(31, 90, 246, 0.1)'
                        : 'rgba(31, 90, 246, 0.05)',
                    borderWidth: 2,
                  },
                  borderRadius: 2,
                  borderWidth: 2,
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                }}
              >
                Later
              </Button>
            </Box>

            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                display: 'block',
                mt: 3,
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
