/**
 * MobileAuthShell
 * Full-screen mobile-app-like wrapper for auth pages.
 * Shows a sticky top bar with back button (left) and an action link (right).
 * Only renders on mobile (<md). Desktop uses the standard 2-column layout.
 */

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { Box, Button, IconButton, useMediaQuery, useTheme } from '@mui/material';
import type React from 'react';
import { useNavigate } from 'react-router';
import { mobileAccent, mobileSurface, mobileText } from '@/styles/mobileTokens';

interface MobileAuthShellProps {
  /** The form component to render */
  children: React.ReactNode;
  /** Label for the top-right action button (e.g. "Sign In", "Create Wallet") */
  actionLabel: string;
  /** Route to navigate to when the action button is pressed */
  actionRoute: string;
  /** Optional secondary action label (e.g. "Import") shown as a smaller link next to the primary */
  secondaryActionLabel?: string;
  /** Route for the secondary action */
  secondaryActionRoute?: string;
  /** Optional callback for the back button. Defaults to navigate(-1). */
  onBack?: () => void;
}

export const MobileAuthShell: React.FC<MobileAuthShellProps> = ({
  children,
  actionLabel,
  actionRoute,
  secondaryActionLabel,
  secondaryActionRoute,
  onBack,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) return null;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      void navigate(-1);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: '#FFFFFF',
        /*
         * The safe default ink for this permanently-white surface. Content
         * rendered inside the shell (`children`) is page content that often
         * paints plain, colourless MUI `Typography` expecting to inherit a
         * sane ambient colour — without this, it inherits whatever
         * `CssBaseline` set on `<body>` instead, which follows the app's
         * light/dark toggle. In dark mode that is `tokens('dark')
         * .text.primary` (near white) on this same white sheet — the same
         * defect class as the icon/action-label fix above, one level up.
         * See task-5-report.md.
         */
        color: mobileText.primary,
        display: 'flex',
        flexDirection: 'column',
        inset: 0,
        overflow: 'hidden',
        position: 'fixed',
        zIndex: 1300, // above everything
      }}
    >
      {/* ── Sticky Top Bar ── */}
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid',
          /*
           * This shell's canvas is permanently white — the same fixed mobile
           * chrome identity `MobileAuthScreen` and `styles/mobileTokens` use,
           * not the app-wide light/dark toggle. `divider`/`text.primary`/
           * `primary.main` are ambient MUI theme roles that used to be pinned
           * to safe light values only because the page wrapped itself in
           * `landingTheme` (hardcoded `mode: 'light'`). Once that wrapper is
           * gone, dark mode resolves `text.primary` to `tokens('dark')
           * .text.primary` (`#f5f4ff`, near white) painted on this same
           * white bar — effectively invisible. Pinned to the fixed
           * `mobileTokens` set instead, so the ink can never drift from the
           * background it actually sits on. See task-5-report.md.
           */
          borderColor: mobileSurface.border,
          display: 'flex',
          flexShrink: 0,
          justifyContent: 'space-between',
          minHeight: 52,
          px: 1,
          py: 0.5,
        }}
      >
        {/* Back button */}
        <IconButton
          onClick={handleBack}
          size="medium"
          aria-label="Back"
          sx={{
            color: mobileText.primary,
          }}
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 20 }} />
        </IconButton>

        {/* Center logo */}
        <Box
          component="img"
          src="/assets/decentralexchange.svg"
          alt="Decentral Exchange"
          sx={{ height: 24, width: 'auto' }}
        />

        {/* Action link(s) */}
        <Box sx={{ alignItems: 'center', display: 'flex', flexShrink: 0, gap: 0.5 }}>
          {secondaryActionLabel && secondaryActionRoute && (
            <>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate(secondaryActionRoute)}
                sx={{
                  color: mobileText.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: 0.5,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {secondaryActionLabel}
              </Button>
              <Box
                sx={{
                  bgcolor: mobileSurface.border,
                  flexShrink: 0,
                  height: 16,
                  width: '1px',
                }}
              />
            </>
          )}
          <Button
            variant="text"
            size="small"
            onClick={() => navigate(actionRoute)}
            sx={{
              color: mobileAccent.base,
              fontSize: '0.8rem',
              fontWeight: 700,
              minWidth: 'auto',
              px: secondaryActionLabel ? 0.5 : 1,
              textTransform: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {actionLabel}
          </Button>
        </Box>
      </Box>

      {/* ── Scrollable Form Content ── */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          // Scrolling the form must not chain to the page behind the shell.
          overscrollBehavior: 'contain',
          px: 2,
          py: 2,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
