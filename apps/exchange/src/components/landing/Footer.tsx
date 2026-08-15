import { Box, Container, Divider, Grid, Link, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Logo from '@/components/atoms/Logo';
import { onCanvas } from '@/theme/landingTheme';

const footerLinks = {
  resources: [
    { href: 'https://docs.decentralchain.io', key: 'documentation' },
    { href: 'https://decentralchain.io', key: 'decentralchain' },
    { href: 'https://decentralscan.com', key: 'blockExplorer' },
  ],
  support: [
    { href: 'https://docs.decentralchain.io', key: 'helpCenter' },
    { href: 'https://github.com/Decentral-America/DecentralChain/issues', key: 'reportIssue' },
  ],
  trading: [
    { href: '/dex', key: 'dexTrading' },
    { href: '/leasing', key: 'staking' },
    { href: '/wallet', key: 'portfolio' },
  ],
  wallet: [
    { href: '/create-account', key: 'createWallet' },
    { href: '/import', key: 'importAccount' },
    { href: '/import/ledger', key: 'ledgerSupport' },
  ],
} as const;

export default function Footer() {
  const { t } = useTranslation();
  return (
    <Box
      component="footer"
      sx={{
        /*
         * White at 82% on the night canvas clears the 4.5:1 floor for the
         * footer's 14px links with room to spare — measured, as ever, not
         * assumed.
         */
        '& .MuiTypography-root[class*="body2"], & a': { color: onCanvas.secondary },
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        color: onCanvas.primary,
        overflow: 'hidden',
        pb: { md: 4, xs: 3 },
        pt: { md: 9, xs: 7 },
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Brand */}
          <Grid
            size={{
              md: 4,
              xs: 12,
            }}
          >
            {/*
              The text mark, not the SVG: the image is drawn in ink and
              disappears on the night canvas, while the atom inherits white
              and keeps its lavender accent.
            */}
            <Box sx={{ mb: 2 }}>
              <Logo onDark sx={{ height: 32 }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
              {t('app.landing.footer.tagline')}
            </Typography>
          </Grid>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <Grid
              key={category}
              size={{
                md: 2,
                sm: 3,
                xs: 6,
              }}
            >
              <Typography
                component="h3"
                variant="subtitle2"
                sx={{ color: onCanvas.primary, mb: 2 }}
              >
                {t(`app.landing.footer.categories.${category}`)}
              </Typography>
              <Stack spacing={1}>
                {links.map((link) => (
                  <Link
                    key={link.key}
                    href={link.href}
                    underline="hover"
                    color="text.secondary"
                    sx={{ fontSize: 14 }}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {t(`app.landing.footer.links.${link.key}`)}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)', my: 4 }} />

        <Stack
          direction={{ sm: 'row', xs: 'column' }}
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography variant="caption" sx={{ color: onCanvas.muted }}>
            {t('app.landing.footer.copyright')}
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
              {t('app.landing.footer.links.privacy')}
            </Link>
            <Link
              href="https://decentralchain.io/terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              color="text.secondary"
              sx={{ fontSize: 12 }}
            >
              {t('app.landing.footer.links.terms')}
            </Link>
            <Link
              href="https://docs.decentralchain.io"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              color="text.secondary"
              sx={{ fontSize: 12 }}
            >
              {t('app.landing.footer.links.docs')}
            </Link>
          </Stack>
        </Stack>

        {/*
          The giant wordmark: the page signs off with the brand set larger
          than anything above it, cropped by the fold like a signature.
        */}
        <Typography
          aria-hidden="true"
          sx={{
            color: 'rgba(255, 255, 255, 0.08)',
            fontSize: 'clamp(64px, 13vw, 210px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 0.8,
            mb: '-0.12em',
            mt: { md: 6, xs: 4 },
            textAlign: 'center',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Decentral.Exchange
        </Typography>
      </Container>
    </Box>
  );
}
