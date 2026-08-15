import { Box, Drawer } from '@mui/material';
import { type ReactNode } from 'react';
import { mobileLayout, mobileRadius, mobileSurface, mobileText } from '@/styles/mobileTokens';

/**
 * Bottom sheet.
 *
 * The mobile counterpart to a desktop dialog: it enters from the bottom edge,
 * rounds only its top corners, and carries a grab handle so the affordance to
 * dismiss is visible without instruction.
 *
 * Built on MUI's Drawer to inherit focus trapping, scroll locking and the
 * escape/backdrop dismissal behaviour rather than reimplementing them.
 */

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Caps the sheet height; content scrolls within it beyond this point. */
  maxHeightRatio?: number;
}

export function BottomSheet({ open, onClose, children, maxHeightRatio = 0.9 }: BottomSheetProps) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            backgroundImage: 'none',
            bgcolor: mobileSurface.card,
            borderTopLeftRadius: mobileRadius.sheet,
            borderTopRightRadius: mobileRadius.sheet,
            boxShadow: 'none',
            maxHeight: `${maxHeightRatio * 100}dvh`,
            // Content must clear the home indicator.
            pb: 'calc(env(safe-area-inset-bottom) + 8px)',
          },
        },
      }}
    >
      {/* Grab handle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pb: 1, pt: 1.5 }}>
        <Box
          sx={{
            bgcolor: mobileSurface.border,
            borderRadius: mobileRadius.pill,
            height: 5,
            width: 44,
          }}
        />
      </Box>

      <Box
        sx={{
          overflowY: 'auto',
          // Keeps momentum scrolling contained to the sheet.
          overscrollBehavior: 'contain',
          pt: 1,
          px: `${mobileLayout.gutter}px`,
        }}
      >
        {children}
      </Box>
    </Drawer>
  );
}

/** Numbered step used by explanatory sheets. */
export function SheetStep({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
      <Box
        sx={{
          alignItems: 'center',
          border: '1.5px solid',
          borderColor: 'primary.main',
          borderRadius: '50%',
          color: 'primary.main',
          display: 'flex',
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 700,
          height: 26,
          justifyContent: 'center',
          width: 26,
        }}
      >
        {index}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ fontSize: 15, fontWeight: 700, mb: 0.5 }}>{title}</Box>
        <Box sx={{ color: mobileText.secondary, fontSize: 13, lineHeight: 1.5 }}>{description}</Box>
      </Box>
    </Box>
  );
}
