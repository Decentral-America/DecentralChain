import { Box, Container, Divider, Grid, Link, Stack, Typography } from '@mui/material';

const footerLinks = {
  Resources: [
    { href: 'https://docs.decentralchain.io', label: 'Documentation' },
    { href: 'https://decentralchain.io', label: 'DecentralChain' },
    { href: 'https://decentralscan.com', label: 'Block Explorer' },
  ],
  Support: [
    { href: 'https://docs.decentralchain.io', label: 'Help Center' },
    { href: 'https://github.com/Decentral-America/DecentralChain/issues', label: 'Report Issue' },
  ],
  Trading: [
    { href: '/dex', label: 'DEX Trading' },
    { href: '/leasing', label: 'Staking' },
    { href: '/wallet', label: 'Portfolio' },
  ],
  Wallet: [
    { href: '/create-account', label: 'Create Wallet' },
    { href: '/import', label: 'Import Account' },
    { href: '/import/ledger', label: 'Ledger Support' },
  ],
};

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.default',
        borderTop: '1px solid #E6EAF2',
        pb: { md: 6, xs: 5 },
        pt: { md: 9, xs: 7 },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand */}
          <Grid
            size={{
              md: 4,
              xs: 12,
            }}
          >
            <Box
              component="img"
              src="/assets/decentralexchange.svg"
              alt="Decentral Exchange"
              sx={{
                height: 32,
                mb: 2,
                width: 'auto',
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
              Non-custodial wallet and DEX platform for DecentralChain blockchain. Trade, stake, and
              manage your DCC tokens securely.
            </Typography>
          </Grid>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <Grid
              key={title}
              size={{
                md: 2,
                sm: 3,
                xs: 6,
              }}
            >
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
          direction={{ sm: 'row', xs: 'column' }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} Decentral Exchange. Built on DecentralChain.
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
