import { Box, Drawer } from '@mui/material';
import { type ReactNode } from 'react';
import {
  mobileAccent,
  mobileLayout,
  mobileRadius,
  mobileSurface,
  mobileText,
} from '@/styles/mobileTokens';

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
            /*
             * The sheet's fill is a fixed `#ffffff`, so its ink is pinned to
             * match. `Drawer`'s paper is a `Paper`, which sets no `color` of
             * its own, so without this every unstyled line inside the sheet
             * inherited MUI's mode-aware `text.primary` from `CssBaseline`'s
             * `<body>` rule: `#f5f4ff` on `#ffffff`, 1.09:1 in dark. That was
             * live on `MobileReceiveSheet`'s "Receive" heading and — through
             * the sunken well nested in it — on the wallet address itself.
             */
            color: mobileText.primary,
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
          // Same reason as the ink below — a fixed fill takes a fixed border.
          borderColor: mobileAccent.base,
          borderRadius: '50%',
          /*
           * `mobileAccent.base`, not MUI's `primary.main`: the step plate sits
           * on the sheet's fixed `#ffffff`, and `primary.main` is mode-aware
           * (`#5b4bdb` light, `#8b7dff` dark) — 6.04:1 turning into 3.24:1 the
           * moment the toggle moves, on a 12px numeral. The mobile accent is
           * the same hue with no mode dimension: 6.19:1 either way, and it is
           * the token every other mobile accent already reads.
           */
          color: mobileAccent.base,
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
