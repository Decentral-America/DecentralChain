/**
 * Swap Page
 * Token swap interface with modern UI matching landing page theme
 */

import {
  History,
  InfoOutlined,
  KeyboardArrowDown,
  Security,
  Settings,
  Speed,
  SwapVert,
  TrendingUp,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import type React from 'react';
import { landingTheme } from '@/theme/landingTheme';

export const Swap: React.FC = () => {
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
              Token Swap
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: 18 }}>
              Instantly exchange tokens with the best rates
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* Left Column - Feature Cards */}
            <Grid
              size={{
                md: 4,
                xs: 12,
              }}
            >
              <Stack spacing={3}>
                {/* Feature 1 */}
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #5940d4 0%, #3d26be 100%)',
                    color: 'white',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '50%',
                        display: 'flex',
                        height: 48,
                        justifyContent: 'center',
                        mb: 2,
                        width: 48,
                      }}
                    >
                      <TrendingUp sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                      Best Rates
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.95 }}>
                      Get the most competitive exchange rates powered by our advanced aggregation
                      engine
                    </Typography>
                  </CardContent>
                </Card>

                {/* Feature 2 */}
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'primary.main',
                        borderRadius: '50%',
                        color: 'white',
                        display: 'flex',
                        height: 48,
                        justifyContent: 'center',
                        mb: 2,
                        width: 48,
                      }}
                    >
                      <Speed sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                      Instant Swaps
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Execute swaps in seconds with our high-performance infrastructure
                    </Typography>
                  </CardContent>
                </Card>

                {/* Feature 3 */}
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'secondary.main',
                        borderRadius: '50%',
                        color: 'white',
                        display: 'flex',
                        height: 48,
                        justifyContent: 'center',
                        mb: 2,
                        width: 48,
                      }}
                    >
                      <Security sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                      Secure Trading
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Non-custodial swaps mean you always maintain control of your assets
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>

            {/* Right Column - Swap Interface */}
            <Grid
              size={{
                md: 8,
                xs: 12,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  p: 4,
                }}
              >
                {/* Settings Header */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 3 }}
                >
                  <Typography variant="h5" fontWeight={700}>
                    Swap Tokens
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small">
                      <History />
                    </IconButton>
                    <IconButton size="small">
                      <Settings />
                    </IconButton>
                  </Stack>
                </Stack>

                {/* From Token */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    From
                  </Typography>
                  <Paper
                    sx={{
                      bgcolor: '#F9FAFB',
                      border: '2px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 2.5,
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Button
                        variant="outlined"
                        endIcon={<KeyboardArrowDown />}
                        sx={{
                          borderColor: 'divider',
                          justifyContent: 'space-between',
                          minWidth: 140,
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ bgcolor: '#8A63D2', height: 24, width: 24 }}>D</Avatar>
                          <Typography fontWeight={600}>DCC</Typography>
                        </Stack>
                      </Button>
                      <TextField
                        fullWidth
                        placeholder="0.00"
                        variant="standard"
                        InputProps={{
                          disableUnderline: true,
                          sx: {
                            fontSize: '2rem',
                            fontWeight: 700,
                            textAlign: 'right',
                          },
                        }}
                      />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        ≈ $0.00
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Balance: 0.00 DCC
                      </Typography>
                    </Stack>
                  </Paper>
                </Box>

                {/* Swap Direction Button */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    my: -1,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <IconButton
                    sx={{
                      '&:hover': {
                        bgcolor: 'primary.main',
                        borderColor: 'primary.main',
                        color: 'white',
                      },
                      bgcolor: 'white',
                      border: '2px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <SwapVert />
                  </IconButton>
                </Box>

                {/* To Token */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    To
                  </Typography>
                  <Paper
                    sx={{
                      bgcolor: '#F9FAFB',
                      border: '2px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 2.5,
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Button
                        variant="outlined"
                        endIcon={<KeyboardArrowDown />}
                        sx={{
                          borderColor: 'divider',
                          justifyContent: 'space-between',
                          minWidth: 140,
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ bgcolor: '#F7931A', height: 24, width: 24 }}>U</Avatar>
                          <Typography fontWeight={600}>USDT</Typography>
                        </Stack>
                      </Button>
                      <TextField
                        fullWidth
                        placeholder="0.00"
                        variant="standard"
                        InputProps={{
                          disableUnderline: true,
                          sx: {
                            fontSize: '2rem',
                            fontWeight: 700,
                            textAlign: 'right',
                          },
                        }}
                      />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        ≈ $0.00
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Balance: 0.00 USDT
                      </Typography>
                    </Stack>
                  </Paper>
                </Box>

                {/* Swap Details */}
                <Paper
                  sx={{
                    bgcolor: '#EEF2FF',
                    border: '1px solid #5940d4',
                    borderRadius: 2,
                    mb: 3,
                    p: 2,
                  }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Exchange Rate
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        1 DCC = 0.00 USDT
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Price Impact
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="success.main">
                        &lt; 0.01%
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Network Fee
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ~0.005 DCC
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>

                {/* Info Box */}
                <Paper
                  sx={{
                    bgcolor: '#FFF7ED',
                    borderRadius: 2,
                    mb: 3,
                    p: 2,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <InfoOutlined sx={{ color: 'warning.main', fontSize: 20, mt: 0.2 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                        Coming Soon
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        This feature is currently under development. Advanced token swap
                        functionality will be available soon with support for multiple liquidity
                        sources and optimal routing.
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {/* Swap Button */}
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled
                  sx={{
                    '&:disabled': {
                      background: '#E5E7EB',
                      color: '#9CA3AF',
                    },
                    '&:hover': {
                      background: 'linear-gradient(180deg, #4a35c0 0%, #32219f 100%)',
                    },
                    background: 'linear-gradient(180deg, #5940d4 0%, #3d26be 100%)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    py: 2,
                  }}
                >
                  Connect Wallet to Swap
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};
