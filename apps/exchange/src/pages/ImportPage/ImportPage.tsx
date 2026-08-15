/**
 * ImportPage
 *
 * The hub for "how do you want to get in" — one card per import method,
 * routed to the real page that handles it. `/import` used to have nothing
 * behind it (a dead link from the footer and from ImportLedger's own cancel
 * button); this is that missing page.
 */

import ExtensionIcon from '@mui/icons-material/Extension';
import FolderIcon from '@mui/icons-material/Folder';
import SecurityIcon from '@mui/icons-material/Security';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import {
  Box,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import type React from 'react';
import { useNavigate } from 'react-router';
import { MobileAuthShell } from '@/components/layout/MobileAuthShell';
import { landingTheme } from '@/theme/landingTheme';

interface ImportMethod {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: React.ReactNode;
}

const IMPORT_METHODS: ImportMethod[] = [
  {
    description: 'Restore your wallet using a 15-word seed phrase.',
    icon: <VpnKeyIcon sx={{ fontSize: 32 }} />,
    id: 'seed',
    route: '/import-account',
    title: 'Seed Phrase',
  },
  {
    description: 'Restore from an encrypted backup file (.json).',
    icon: <FolderIcon sx={{ fontSize: 32 }} />,
    id: 'backup',
    route: '/restore-backup',
    title: 'Backup File',
  },
  {
    description: 'Connect and import accounts from your Ledger device.',
    icon: <SecurityIcon sx={{ fontSize: 32 }} />,
    id: 'ledger',
    route: '/import/ledger',
    title: 'Ledger Hardware Wallet',
  },
  {
    description: 'Import from the Cubensis Connect browser extension.',
    icon: <ExtensionIcon sx={{ fontSize: 32 }} />,
    id: 'cubensis-connect',
    route: '/import/cubensis-connect',
    title: 'Cubensis Connect',
  },
];

function MethodCard({ method, onSelect }: { method: ImportMethod; onSelect: () => void }) {
  return (
    <Paper
      elevation={0}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect();
      }}
      sx={{
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-4px)',
        },
        border: '2px solid',
        borderColor: 'divider',
        borderRadius: 3,
        cursor: 'pointer',
        p: 3,
        textAlign: 'center',
        transition: 'all 0.2s ease',
      }}
    >
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: 'primary.main',
          borderRadius: '50%',
          color: 'white',
          display: 'flex',
          height: 64,
          justifyContent: 'center',
          mb: 2,
          mx: 'auto',
          width: 64,
        }}
      >
        {method.icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        {method.title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {method.description}
      </Typography>
    </Paper>
  );
}

const ImportInner: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const content = (
    <Grid container spacing={3}>
      {IMPORT_METHODS.map((method) => (
        <Grid key={method.id} size={{ sm: 6, xs: 12 }}>
          <MethodCard method={method} onSelect={() => navigate(method.route)} />
        </Grid>
      ))}
    </Grid>
  );

  if (isMobile) {
    return (
      <MobileAuthShell actionLabel="Sign In" actionRoute="/sign-in">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Choose your import method
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              How do you want to get in?
            </Typography>
          </Box>
          {content}
        </Stack>
      </MobileAuthShell>
    );
  }

  return (
    <Box
      sx={{
        alignItems: 'center',
        bgcolor: 'background.default',
        display: 'flex',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5 }}>
            Import Account
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400 }}>
            Choose your import method to get started
          </Typography>
        </Box>
        {content}
      </Container>
    </Box>
  );
};

export const ImportPage: React.FC = () => (
  <ThemeProvider theme={landingTheme}>
    <ImportInner />
  </ThemeProvider>
);
