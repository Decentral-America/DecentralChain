/**
 * The hand-off from "your token exists" to "your token has a logo".
 *
 * The image never renders in a trading surface from here: it is normalised,
 * downloaded and handed to a GitHub issue. A logo only appears in the app once
 * its pull request is merged, which is what makes a logo mean "reviewed" rather
 * than "uploaded" — and is why nobody can issue a look-alike token wearing a
 * well-known mark.
 */
import { Alert, Box, Button, Link, Stack, Typography, useTheme } from '@mui/material';
import { useState } from 'react';
import { config } from '@/config';
import { normalizeLogo } from '@/lib/tokenLogos/normalize';
import { logoIssueUrl } from '@/lib/tokenLogos/submission';
import { tokens } from '@/theme/tokens/semantic';

interface LogoSubmissionCardProps {
  assetId: string;
  name: string;
  symbol: string;
  issuer: string;
}

export const LogoSubmissionCard: React.FC<LogoSubmissionCardProps> = ({
  assetId,
  name,
  symbol,
  issuer,
}) => {
  const t = tokens(useTheme().palette.mode);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issueUrl = logoIssueUrl(config.logoRepo, { assetId, issuer, name, symbol });

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const blob = await normalizeLogo(file);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'logo.png';
      anchor.click();
      URL.revokeObjectURL(url);
      setReady(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not prepare that image.');
    }
  };

  return (
    <Box
      sx={{
        bgcolor: t.surface.raised,
        border: `1px solid ${t.border.subtle}`,
        borderRadius: 2,
        mt: 2,
        p: 3,
      }}
    >
      <Stack spacing={2}>
        <Typography sx={{ color: t.text.primary, fontWeight: 600 }}>Add a logo</Typography>
        <Typography variant="body2" sx={{ color: t.text.secondary }}>
          Your token shows its initials until a logo is added. Submit one and it will appear across
          the exchange after it is reviewed.
        </Typography>

        <Button component="label" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
          Choose an image
          <input
            hidden
            type="file"
            accept="image/*"
            aria-label="Choose an image"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </Button>

        {error && <Alert severity="error">{error}</Alert>}

        {ready && issueUrl && (
          <Alert severity="success">
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>logo.png</strong> has been downloaded. Open the submission and drag it in.
            </Typography>
            <Link href={issueUrl} target="_blank" rel="noopener noreferrer">
              Open the submission on GitHub
            </Link>
          </Alert>
        )}
      </Stack>
    </Box>
  );
};
