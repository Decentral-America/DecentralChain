import {
  alpha,
  Box,
  Container,
  Divider,
  Grid,
  Link,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import Logo from '@/components/atoms/Logo';
import { config } from '@/config';
import { onCanvas } from '@/theme/landingTheme';
import { tokens } from '@/theme/tokens/semantic';

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
  const mode = useTheme().palette.mode;
  const tk = tokens(mode);
  const isDark = mode === 'dark';
  return (
    <Box
      component="footer"
      sx={{
        /*
         * No forced ink on `.MuiTypography-root[class*="body2"]`/`a` here:
         * every body2/link element below already carries
         * `color="text.secondary"`, which now resolves through the real app
         * theme (`tokens(mode).text.secondary`) — the same value this footer
         * sits on top of, since it paints directly on the page canvas with no
         * surface of its own. A blunt class-selector override used to
         * outrank that prop with a fixed `onCanvas.secondary`
         * (white-at-82%), which cleared AA on the old pinned night canvas
         * but went invisible the moment the canvas itself went light — the
         * exact "mode-aware ink overridden by a fixed value" failure mode
         * task 11 exists to remove.
         */
        borderTop: `1px solid ${isDark ? alpha(onCanvas.primary, 0.12) : tk.border.subtle}`,
        color: tk.text.primary,
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
            {/* Follows the same canvas the footer's own `color` above reads. */}
            <Box sx={{ mb: 2 }}>
              <Logo onDark={isDark} sx={{ height: 32 }} />
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
              <Typography component="h3" variant="subtitle2" sx={{ color: tk.text.primary, mb: 2 }}>
                {t(`app.landing.footer.categories.${category}`)}
              </Typography>
              <Stack spacing={1}>
                {/* Ledger support isn't finished yet — drop that one link
                    rather than send visitors to an unready flow. */}
                {links
                  .filter((link) => config.ledgerEnabled || link.key !== 'ledgerSupport')
                  .map((link) => (
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

        <Divider
          sx={{ borderColor: isDark ? alpha(onCanvas.primary, 0.12) : tk.border.subtle, my: 4 }}
        />

        <Stack
          direction={{ sm: 'row', xs: 'column' }}
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography variant="caption" sx={{ color: tk.text.tertiary }}>
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
          Opacity is the floor for 3:1 contrast against the canvas at this
          weight/size (WCAG large-text threshold) — aria-hidden exempts it from
          the accessibility tree, but axe still (correctly) checks contrast for
          sighted low-vision users, so it can't go as faint as pure decoration.
          Dark mode's 0.36-opacity white composites to ~3.2:1 on the night
          canvas; light mode needs a heavier 0.5-opacity dark ink to clear the
          same floor on the near-white canvas — the same alpha cannot serve
          both (computed: 0.36 on `tokens('light').surface.base` is ~1.0:1).
        */}
        <Typography
          aria-hidden="true"
          sx={{
            color: isDark ? alpha(onCanvas.primary, 0.36) : alpha(tk.text.primary, 0.5),
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
