import { Box } from '@mui/material';
import { type ReactNode } from 'react';
import { Sheet } from '@/components/premium/Sheet';
import { mobileAccent, mobileText } from '@/styles/mobileTokens';

/**
 * Bottom sheet.
 *
 * The mobile counterpart to a desktop dialog: it rises from the bottom edge,
 * carries a grab handle, and can be dragged or flicked away. The mechanics
 * live in the premium `Sheet` (focus trap, scroll lock, Escape and backdrop
 * dismissal come from MUI's Modal underneath it).
 */

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Visible heading; also names the dialog for assistive tech. */
  title?: ReactNode;
  description?: ReactNode;
  /** Accessible name when there is no visible title. */
  label?: string;
  /** Caps the sheet height; content scrolls within it beyond this point. */
  maxHeightRatio?: number;
  /** Uses the grouped background, for sheets made of inset lists. */
  grouped?: boolean;
  /** Accessible name of the close control. */
  closeLabel?: string;
}

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  description,
  label,
  maxHeightRatio = 0.9,
  grouped = false,
  closeLabel = 'Close',
}: BottomSheetProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      {...(label ? { label } : {})}
      maxHeightRatio={maxHeightRatio}
      grouped={grouped}
      closeLabel={closeLabel}
    >
      {/*
       * The sheet's fill is a theme variable, so its ink is pinned to the
       * matching variable. Without this every unstyled line inside the sheet
       * inherited MUI's `text.primary` from `CssBaseline`'s `<body>` rule,
       * which only agrees with the fill while the two mode sources agree.
       */}
      <Box sx={{ color: mobileText.primary }}>{children}</Box>
    </Sheet>
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
          bgcolor: 'var(--surface-lavender)',
          borderRadius: '50%',
          /*
           * The deeper accent step: on the lavender plate the base indigo is
           * 4.46:1 in dark mode, just under AA for a 13px numeral; the hover
           * step clears it in both modes (5.99:1 light, 6.2:1 dark).
           */
          color: mobileAccent.hover,
          display: 'flex',
          flexShrink: 0,
          fontSize: 13,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
          height: 28,
          justifyContent: 'center',
          width: 28,
        }}
      >
        {index}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ fontSize: 15, fontWeight: 600, mb: 0.5 }}>{title}</Box>
        <Box sx={{ color: mobileText.secondary, fontSize: 13, lineHeight: 1.5 }}>{description}</Box>
      </Box>
    </Box>
  );
}
