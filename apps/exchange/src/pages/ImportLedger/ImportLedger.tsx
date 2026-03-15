/**
 * ImportLedger Page
 * Modern Ledger import page with 2-column layout matching signup/signin theme
 */

import SecurityIcon from '@mui/icons-material/Security';
import UsbIcon from '@mui/icons-material/Usb';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { Box, Container, Grid, Stack, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import type React from 'react';
import { ImportLedger as ImportLedgerForm } from '@/features/auth/ImportLedger';
import { landingTheme } from '@/theme/landingTheme';

export const ImportLedger: React.FC = () => {
  return (
    <ThemeProvider theme={landingTheme}>
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: 'background.default',
          display: 'flex',
          minHeight: '100vh',
        }}
      >
        <Container maxWidth="xl" sx={{ py: 8 }}>
          <Grid container spacing={6} alignItems="center">
            {/* Left Column - Branding & Features */}
            <Grid
              size={{
                md: 5,
                xs: 12,
              }}
            >
              <Box sx={{ pr: { md: 4 } }}>
                {/* Logo/Title */}
                <Box sx={{ mb: 3 }}>
                  <Box
                    component="img"
                    src="/assets/decentralexchange.svg"
                    alt="Decentral Exchange"
                    sx={{
                      height: 40,
                      width: 'auto',
                    }}
                  />
                </Box>

                {/* Headline */}
                <Typography
                  variant="h2"
                  fontWeight={800}
                  sx={{
                    fontSize: { md: '2.5rem', xs: '2rem' },
                    lineHeight: 1.2,
                    mb: 2,
                  }}
                >
                  Maximum security with Ledger
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ fontSize: 18, mb: 4 }}>
                  Import your wallet using a Ledger hardware device for bank-grade security. Your
                  private keys never leave the device.
                </Typography>

                {/* Feature highlights */}
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'primary.main',
                        borderRadius: '50%',
                        color: 'white',
                        display: 'flex',
                        flexShrink: 0,
                        height: 40,
                        justifyContent: 'center',
                        width: 40,
                      }}
                    >
                      <SecurityIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Hardware Security
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Private keys stored in secure element chip, never exposed to the internet or
                        your computer.
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'secondary.main',
                        borderRadius: '50%',
                        color: 'white',
                        display: 'flex',
                        flexShrink: 0,
                        height: 40,
                        justifyContent: 'center',
                        width: 40,
                      }}
                    >
                      <UsbIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Easy Connection
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Simply connect your Ledger device via USB and follow the on-screen
                        instructions.
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'primary.main',
                        borderRadius: '50%',
                        color: 'white',
                        display: 'flex',
                        flexShrink: 0,
                        height: 40,
                        justifyContent: 'center',
                        width: 40,
                      }}
                    >
                      <VerifiedUserIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Transaction Approval
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Review and approve every transaction directly on your Ledger device for
                        complete control.
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>

                {/* Device requirements */}
                <Box
                  sx={{
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mt: 4,
                    p: 2,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    Before you start:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    • Connect your Ledger device via USB
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    • Unlock it with your PIN
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Open the DecentralChain app on your device
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Right Column - Import Form */}
            <Grid
              size={{
                md: 7,
                xs: 12,
              }}
            >
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 3,
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                  p: 4,
                }}
              >
                <ImportLedgerForm />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};
