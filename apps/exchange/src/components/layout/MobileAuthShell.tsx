/**
 * MobileAuthShell
 * Full-screen mobile-app-like wrapper for auth pages.
 * Shows a sticky top bar with back button (left) and an action link (right).
 * Only renders on mobile (<md). Desktop uses the standard 2-column layout.
 */
import React from 'react';
import { Box, IconButton, Button, useMediaQuery, useTheme } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useNavigate } from 'react-router-dom';

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
      navigate(-1);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300, // above everything
        bgcolor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Sticky Top Bar ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          py: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: '#FFFFFF',
          flexShrink: 0,
          minHeight: 52,
        }}
      >
        {/* Back button */}
        <IconButton
          onClick={handleBack}
          size="medium"
          sx={{
            color: 'text.primary',
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          {secondaryActionLabel && secondaryActionRoute && (
            <>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate(secondaryActionRoute)}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  minWidth: 'auto',
                  px: 0.5,
                }}
              >
                {secondaryActionLabel}
              </Button>
              <Box
                sx={{
                  width: '1px',
                  height: 16,
                  bgcolor: 'divider',
                  flexShrink: 0,
                }}
              />
            </>
          )}
          <Button
            variant="text"
            size="small"
            onClick={() => navigate(actionRoute)}
            sx={{
              fontWeight: 700,
              fontSize: '0.8rem',
              color: 'primary.main',
              textTransform: 'none',
              whiteSpace: 'nowrap',
              minWidth: 'auto',
              px: secondaryActionLabel ? 0.5 : 1,
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
          WebkitOverflowScrolling: 'touch',
          px: 2,
          py: 2,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
