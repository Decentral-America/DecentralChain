import { Box, Container, Grid, Typography, Link, Stack, Divider } from '@mui/material';

const footerLinks = {
  Resources: [
    { label: 'Documentation', href: 'https://docs.decentralchain.io' },
    { label: 'DecentralChain', href: 'https://decentralchain.io' },
    { label: 'Block Explorer', href: 'https://decentralscan.com' },
  ],
  Wallet: [
    { label: 'Create Wallet', href: '/create-account' },
    { label: 'Import Account', href: '/import' },
    { label: 'Ledger Support', href: '/import/ledger' },
  ],
  Trading: [
    { label: 'DEX Trading', href: '/dex' },
    { label: 'Staking', href: '/leasing' },
    { label: 'Portfolio', href: '/wallet' },
  ],
  Support: [
    { label: 'Help Center', href: 'https://docs.decentralchain.io' },
    { label: 'Report Issue', href: 'https://github.com/Decentral-America/DCCGUI/issues' },
  ],
};

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid #E6EAF2',
        bgcolor: 'background.default',
        pt: { xs: 7, md: 9 },
        pb: { xs: 5, md: 6 },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand */}
          <Grid item xs={12} md={4}>
            <Box
              component="img"
              src="/assets/decentralexchange.svg"
              alt="Decentral Exchange"
              sx={{
                height: 32,
                width: 'auto',
                mb: 2,
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
              Non-custodial wallet and DEX platform for DecentralChain blockchain. Trade, stake, and manage your DCC tokens securely.
            </Typography>
          </Grid>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <Grid item xs={6} sm={3} md={2} key={title}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                {title}
              </Typography>
              <Stack spacing={1}>
                {links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    underline="hover"
                    color="text.secondary"
                    sx={{ fontSize: 14 }}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Typography variant="caption" color="text.secondary">
            © 2025 Decentral Exchange. Built on DecentralChain.
          </Typography>
          <Stack direction="row" spacing={3}>
            <Link
              href="https://decentralchain.io/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              color="text.secondary"
              sx={{ fontSize: 12 }}
            >
              Privacy
            </Link>
            <Link
              href="https://decentralchain.io/terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              color="text.secondary"
              sx={{ fontSize: 12 }}
            >
              Terms
            </Link>
            <Link
              href="https://docs.decentralchain.io"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              color="text.secondary"
              sx={{ fontSize: 12 }}
            >
              Docs
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
