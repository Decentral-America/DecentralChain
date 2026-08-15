import { Box, type BoxProps, ButtonBase, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/atoms/Icon';
import {
  mobileAccent,
  mobileGradient,
  mobileLayout,
  mobileMarket,
  mobileRadius,
  mobileShadow,
  mobileSurface,
  mobileText,
  mobileType,
} from '@/styles/mobileTokens';

/**
 * Mobile UI primitives.
 *
 * These exist so the mobile screens are assembled from real components rather
 * than being a narrower rendering of the desktop layout. Each maps to a
 * recognisable native pattern: a branded header band, rounded cards, pill
 * actions, a segmented control, and dense list rows.
 */

/* ------------------------------------------------------------------ header */

interface MobileHeaderProps {
  /** Greeting or screen title */
  title: ReactNode;
  /** Rendered to the left of the title — a logo mark or back control */
  leading?: ReactNode;
  /** Rendered at the far right — usually a notification or menu action */
  trailing?: ReactNode;
  /** Uses the branded gradient band instead of the plain canvas */
  gradient?: boolean;
  /** Extra bottom padding so an overlapping card can sit on the band */
  overlap?: boolean;
  children?: ReactNode;
}

export function MobileHeader({
  title,
  leading,
  trailing,
  gradient = false,
  overlap = false,
  children,
}: MobileHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        background: gradient ? mobileGradient.header : mobileSurface.canvas,
        color: gradient ? mobileText.onAccent : mobileText.primary,
        // When a card overlaps the band, the band must extend past the title.
        pb: overlap ? 9 : 2,
        // Room for the status bar on notched devices.
        pt: 'calc(env(safe-area-inset-top) + 12px)',
        px: `${mobileLayout.gutter}px`,
      }}
    >
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.5, minHeight: 44 }}>
        {leading}
        <Typography
          component="h1"
          sx={{
            display: '-webkit-box',
            flex: 1,
            fontSize: 'clamp(18px, 5.2vw, 22px)',
            fontWeight: mobileType.title.weight,
            letterSpacing: mobileType.title.tracking,
            lineHeight: 1.25,
            minWidth: 0,
            overflow: 'hidden',
            overflowWrap: 'anywhere',
            WebkitBoxOrient: 'vertical',
            // Wraps to a second line rather than clipping a long account name.
            WebkitLineClamp: 2,
          }}
        >
          {title}
        </Typography>
        {trailing}
      </Box>
      {children}
    </Box>
  );
}

/* -------------------------------------------------------------------- card */

interface MobileCardProps extends BoxProps {
  children: ReactNode;
  padded?: boolean;
}

export function MobileCard({ children, padded = true, sx, ...rest }: MobileCardProps) {
  return (
    <Box
      sx={{
        bgcolor: mobileSurface.card,
        borderRadius: mobileRadius.card,
        boxShadow: mobileShadow.card,
        p: padded ? `${mobileLayout.cardPadding}px` : 0,
        position: 'relative',
        zIndex: 1,
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
}

/* ----------------------------------------------------------- page sections */

/** Horizontal gutter shared by every mobile screen section. */
export function MobileSection({ children, sx, ...rest }: BoxProps) {
  return (
    <Box sx={{ px: `${mobileLayout.gutter}px`, ...sx }} {...rest}>
      {children}
    </Box>
  );
}

interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
}

export function MobileSectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'space-between',
        mb: 1.5,
        mt: 3,
      }}
    >
      <Typography
        component="h2"
        sx={{
          fontSize: mobileType.heading.size,
          fontWeight: mobileType.heading.weight,
          letterSpacing: mobileType.heading.tracking,
        }}
      >
        {title}
      </Typography>
      {action}
    </Box>
  );
}

/* ----------------------------------------------------------- quick actions */

export interface QuickAction {
  icon: IconName;
  label: string;
  onClick?: () => void;
}

/**
 * The three-up action row under the balance. Each target is a full column so
 * the tap area comfortably exceeds the minimum, even though the icon is small.
 */
export function MobileQuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${actions.length}, 1fr)`,
        mt: 2.5,
      }}
    >
      {actions.map((action) => (
        <ButtonBase
          key={action.label}
          onClick={action.onClick}
          sx={{
            borderRadius: mobileRadius.md,
            flexDirection: 'column',
            gap: 0.75,
            minHeight: mobileLayout.minTapTarget,
            py: 1,
          }}
        >
          <Box
            sx={{
              alignItems: 'center',
              bgcolor: mobileAccent.wash,
              border: `1px solid ${mobileAccent.wash}`,
              borderRadius: '50%',
              color: mobileAccent.base,
              display: 'flex',
              height: 46,
              justifyContent: 'center',
              width: 46,
            }}
          >
            <Icon name={action.icon} size={20} strokeWidth={1.9} />
          </Box>
          <Typography
            sx={{
              color: mobileText.secondary,
              fontSize: mobileType.label.size,
              fontWeight: mobileType.label.weight,
            }}
          >
            {action.label}
          </Typography>
        </ButtonBase>
      ))}
    </Box>
  );
}

/* --------------------------------------------------------------- sparkline */

interface SparklineProps {
  data: number[];
  /** Drives the stroke colour */
  positive?: boolean;
  width?: number;
  height?: number;
  /** Fills the area beneath the line with a soft wash */
  filled?: boolean;
}

/**
 * Inline trend line. Rendered as a plain SVG polyline rather than pulling a
 * charting library into a 32px-tall slot.
 */
export function Sparkline({
  data,
  positive = true,
  width = 96,
  height = 32,
  filled = false,
}: SparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  // A flat series would divide by zero; fall back to a centred line.
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((value, i) => {
    const x = i * step;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const stroke = positive ? mobileAccent.base : mobileMarket.down;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
    >
      {filled && (
        <polygon
          points={`0,${height} ${points.join(' ')} ${width},${height}`}
          fill={stroke}
          opacity={0.08}
        />
      )}
      <polyline
        points={points.join(' ')}
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* --------------------------------------------------------------- list rows */

interface AssetRowProps {
  logo: ReactNode;
  name: string;
  subtitle: string;
  price: string;
  change: string;
  positive: boolean;
  spark?: number[];
  onClick?: () => void;
}

/**
 * Dense row used by the wishlist and holdings lists: mark, identity, trend,
 * then the figures right-aligned with tabular numerals so columns line up.
 */
export function MobileAssetRow({
  logo,
  name,
  subtitle,
  price,
  change,
  positive,
  spark,
  onClick,
}: AssetRowProps) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        borderRadius: mobileRadius.md,
        display: 'flex',
        gap: 1.5,
        justifyContent: 'flex-start',
        minHeight: 64,
        px: 0.5,
        py: 1,
        textAlign: 'left',
        width: '100%',
      }}
    >
      {logo}

      {/* minWidth:0 lets long names truncate instead of pushing the figures off */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            color: mobileText.primary,
            fontSize: mobileType.body.size,
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </Typography>
        <Typography
          sx={{
            color: mobileText.muted,
            fontSize: mobileType.caption.size,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {subtitle}
        </Typography>
      </Box>

      {spark ? (
        <Box sx={{ flexShrink: 0, lineHeight: 0 }}>
          <Sparkline data={spark} positive={positive} width={56} height={26} />
        </Box>
      ) : null}

      <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
        <Typography
          sx={{
            color: mobileText.primary,
            fontSize: mobileType.body.size,
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 600,
          }}
        >
          {price}
        </Typography>
        <Typography
          sx={{
            color: positive ? mobileMarket.up : mobileMarket.down,
            fontSize: mobileType.caption.size,
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 500,
          }}
        >
          {change}
        </Typography>
      </Box>

      {/* Signals the row opens a detail view */}
      {onClick ? (
        <Box sx={{ color: mobileText.muted, flexShrink: 0, lineHeight: 0 }}>
          <Icon name="chevronRight" size={17} />
        </Box>
      ) : null}
    </ButtonBase>
  );
}

/* -------------------------------------------------------- segmented control */

interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}

/** Range selector for charts — a pill track with a filled active segment. */
export function MobileSegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <Box
      role="tablist"
      sx={{
        bgcolor: mobileSurface.sunken,
        border: `1px solid ${mobileSurface.border}`,
        borderRadius: mobileRadius.md,
        display: 'grid',
        gap: 0.5,
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
        p: 0.5,
      }}
    >
      {options.map((option) => {
        const active = option === value;
        return (
          <ButtonBase
            key={option}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option)}
            sx={{
              bgcolor: active ? mobileAccent.base : 'transparent',
              borderRadius: mobileRadius.sm,
              color: active ? mobileText.onAccent : mobileText.secondary,
              fontSize: mobileType.label.size,
              fontWeight: 600,
              minHeight: mobileLayout.minTapTarget,
              transition: 'background-color 150ms ease, color 150ms ease',
            }}
          >
            {option}
          </ButtonBase>
        );
      })}
    </Box>
  );
}

/* ------------------------------------------------------------------ button */

interface MobileButtonProps {
  children: ReactNode;
  onClick?: () => void;
  /** `accent` is the filled primary; `dark` is the compact secondary */
  variant?: 'accent' | 'dark' | 'outline';
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

/** Pill action. The accent variant is the mobile primary call to action. */
export function MobileButton({
  children,
  onClick,
  variant = 'accent',
  fullWidth = true,
  disabled = false,
  type = 'button',
}: MobileButtonProps) {
  const palette = {
    accent: { bg: mobileAccent.base, border: 'transparent', color: mobileText.onAccent },
    dark: { bg: mobileText.primary, border: 'transparent', color: mobileText.onAccent },
    outline: { bg: 'transparent', border: mobileSurface.border, color: mobileText.primary },
  }[variant];

  return (
    <ButtonBase
      type={type}
      onClick={onClick}
      disabled={disabled}
      sx={{
        bgcolor: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: mobileRadius.pill,
        color: palette.color,
        fontSize: 16,
        fontWeight: 600,
        minHeight: 54,
        opacity: disabled ? 0.5 : 1,
        px: 3,
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      {children}
    </ButtonBase>
  );
}

/* -------------------------------------------------------------- asset mark */

/**
 * Circular brand plate. Token logos are conventionally round, so this is one
 * of the few circular elements the system keeps.
 */
export function AssetMark({
  children,
  size = 40,
  bg = mobileSurface.chip,
}: {
  children: ReactNode;
  size?: number;
  bg?: string;
}) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        bgcolor: bg,
        borderRadius: '50%',
        display: 'flex',
        flexShrink: 0,
        fontSize: size * 0.42,
        fontWeight: 700,
        height: size,
        justifyContent: 'center',
        overflow: 'hidden',
        width: size,
      }}
    >
      {children}
    </Box>
  );
}
