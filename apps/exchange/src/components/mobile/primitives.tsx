import { Box, type BoxProps, ButtonBase, Typography, useTheme } from '@mui/material';
import { type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/atoms/Icon';
import { Avatar, ListRow } from '@/components/premium/GroupedList';
import { hasContent } from '@/components/premium/hasContent';
import { PressAction } from '@/components/premium/PressAction';
import { SegmentedControl } from '@/components/premium/SegmentedControl';
import {
  mobileAccent,
  mobileElevation,
  mobileFluid,
  mobileLayout,
  mobileMarket,
  mobileRadius,
  mobileSurface,
  mobileText,
  mobileType,
} from '@/styles/mobileTokens';
import { tokens } from '@/theme/tokens/semantic';

/**
 * Mobile UI primitives.
 *
 * The mobile screens are assembled from these rather than being a narrower
 * rendering of the desktop layout. Each maps to a native iOS pattern: a
 * large title on the grouped ground, grouped inset lists, round tinted
 * actions under a hero figure, a search field in the system fill, and a
 * full-width primary button.
 */

/* ------------------------------------------------------------------ header */

interface MobileHeaderProps {
  /** Greeting or screen title */
  title: ReactNode;
  /** Rendered to the left of the title — a logo mark or back control */
  leading?: ReactNode;
  /** Rendered at the far right — usually a notification or menu action */
  trailing?: ReactNode;
  children?: ReactNode;
}

/** A static large-title header, for screens outside the app shell. */
export function MobileHeader({ title, leading, trailing, children }: MobileHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        color: mobileText.primary,
        pb: 2,
        pt: 'calc(env(safe-area-inset-top) + 8px)',
        px: `${mobileLayout.gutter}px`,
      }}
    >
      {hasContent(leading) || hasContent(trailing) ? (
        <Box sx={{ alignItems: 'center', display: 'flex', minHeight: 44, mx: -1 }}>
          {leading}
          <Box sx={{ flex: 1 }} />
          {trailing}
        </Box>
      ) : null}
      <Typography
        component="h1"
        sx={{
          fontSize: mobileFluid.largeTitle,
          fontWeight: mobileType.largeTitle.weight,
          letterSpacing: mobileType.largeTitle.tracking,
          lineHeight: mobileType.largeTitle.lineHeight,
          overflowWrap: 'anywhere',
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

/* -------------------------------------------------------------------- card */

interface MobileCardProps extends BoxProps {
  children: ReactNode;
  padded?: boolean;
}

/** The elevated surface: shadow in light mode, hairline in dark. */
export function MobileCard({ children, padded = true, sx, ...rest }: MobileCardProps) {
  return (
    <Box
      sx={{
        ...mobileElevation.card,
        bgcolor: mobileSurface.card,
        borderRadius: mobileRadius.card,
        /*
         * The card carries its ink as well as its fill. Without this, anything
         * inside it that does not set its own `color` inherits MUI's
         * `text.primary` from the `<body>` rule `CssBaseline` writes, which
         * only agrees with this theme-variable fill while the two mode sources
         * agree — the balance figures of `MobileHome` and `MobilePortfolio`
         * and `MobileAccount`'s wallet name are all `Typography` with no
         * colour of their own. Ink and fill now read the same variables.
         */
        color: mobileText.primary,
        p: padded ? `${mobileLayout.cardPadding}px` : 0,
        position: 'relative',
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
        mb: 1,
        mt: 3.5,
        pl: 0.5,
      }}
    >
      <Typography
        component="h2"
        sx={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px', lineHeight: 1.25 }}
      >
        {title}
      </Typography>
      {action}
    </Box>
  );
}

/** Plain accent text action for a section header, e.g. "See all". */
export function MobileTextAction({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        '&:active': { opacity: 0.5 },
        '&:focus-visible': { boxShadow: '0 0 0 2px var(--color-indigo-ink)' },
        borderRadius: mobileRadius.sm,
        color: mobileAccent.base,
        fontSize: 15,
        fontWeight: 400,
        letterSpacing: '-0.15px',
        minHeight: mobileLayout.minTapTarget,
        px: 1,
        transition: 'opacity 160ms var(--ease)',
      }}
    >
      {children}
    </ButtonBase>
  );
}

/* -------------------------------------------------------------------- hero */

interface MobileHeroProps {
  /** Quiet label above the figure */
  label: ReactNode;
  /** The figure itself, usually an AnimatedNumber */
  children: ReactNode;
  /** Unit set beside the figure in secondary type */
  unit?: string | undefined;
  /** Control beside the label, e.g. hide-balance */
  labelAction?: ReactNode;
  /** Secondary figures beneath */
  footer?: ReactNode;
}

/** The hero figure, set straight on the ground as iOS Wallet and Stocks do. */
export function MobileHero({ label, children, unit, labelAction, footer }: MobileHeroProps) {
  return (
    <Box>
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 0.25, minHeight: 32 }}>
        <Typography sx={{ color: mobileText.secondary, fontSize: 15, letterSpacing: '-0.15px' }}>
          {label}
        </Typography>
        {labelAction}
      </Box>
      <Box
        sx={{
          alignItems: 'baseline',
          display: 'flex',
          flexWrap: 'wrap',
          fontSize: mobileFluid.hero,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: mobileType.display.weight,
          gap: 1,
          letterSpacing: mobileType.display.tracking,
          lineHeight: mobileType.display.lineHeight,
          minWidth: 0,
        }}
      >
        {children}
        {unit ? (
          <Box
            component="span"
            sx={{
              color: mobileText.secondary,
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: '-0.3px',
            }}
          >
            {unit}
          </Box>
        ) : null}
      </Box>
      {footer}
    </Box>
  );
}

/** One secondary figure under the hero: label above, value beneath. */
export function MobileStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box>
      <Typography sx={{ color: mobileText.secondary, fontSize: 13 }}>{label}</Typography>
      <Typography
        component="div"
        sx={{
          fontSize: 17,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 500,
          letterSpacing: '-0.3px',
        }}
      >
        {value}
      </Typography>
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
 * The action row under the balance: round 56px tinted keys with the label
 * beneath, spread evenly. Each column is the tap target, not just the circle.
 */
export function MobileQuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${actions.length}, 1fr)`,
        justifyItems: 'center',
        mt: 3,
      }}
    >
      {actions.map((action) => (
        <PressAction
          key={action.label}
          label={action.label}
          icon={<Icon name={action.icon} size={22} strokeWidth={2} />}
          {...(action.onClick ? { onClick: action.onClick } : {})}
        />
      ))}
    </Box>
  );
}

/* ------------------------------------------------------------ search field */

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
 * charting library into a 32px-tall slot. Draws nothing without two points.
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

  const stroke = positive ? mobileMarket.up : mobileMarket.down;

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
  price: ReactNode;
  change: string;
  positive: boolean;
  onClick?: () => void;
}

/**
 * Holdings row: mark, identity, then the figure right-aligned in tabular
 * numerals. A grouped-list row; place it inside a `GroupedList`.
 */
export function MobileAssetRow({
  logo,
  name,
  subtitle,
  price,
  change,
  positive,
  onClick,
}: AssetRowProps) {
  return (
    <ListRow
      leading={logo}
      title={name}
      subtitle={subtitle}
      value={price}
      {...(change ? { detail: change, detailTone: positive ? 'up' : 'down' } : {})}
      {...(onClick ? { onClick } : {})}
    />
  );
}

/* -------------------------------------------------------- segmented control */

interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}

/** Range selector — the kit's iOS segmented control, stretched to the row. */
export function MobileSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label = 'Range',
}: SegmentedControlProps<T>) {
  return (
    <SegmentedControl
      fullWidth
      label={label}
      value={value}
      onValueChange={onChange}
      options={options.map((option) => ({ label: option, value: option }))}
    />
  );
}

/* ------------------------------------------------------------------ button */

interface MobileButtonProps {
  children: ReactNode;
  onClick?: () => void;
  /** `accent` is the filled primary; `dark` and `outline` are the grey-fill secondary */
  variant?: 'accent' | 'dark' | 'outline';
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

/**
 * The full-width iOS button. The accent variant is the mobile primary action.
 *
 * The accent fill takes the accent's own ink (`accent.onPrimary`): white on
 * the light-mode indigo, black on the light dark-mode one, where white would
 * be 3.71:1. Fill, hover and ink all come from the same mode so they cannot
 * disagree. `dark` and `outline` share the grey system fill, whose ink follows
 * the same theme variables as the fill.
 */
export function MobileButton({
  children,
  onClick,
  variant = 'accent',
  fullWidth = true,
  disabled = false,
  type = 'button',
}: MobileButtonProps) {
  const t = tokens(useTheme().palette.mode);
  const accent = variant === 'accent';

  return (
    <ButtonBase
      type={type}
      onClick={onClick}
      disabled={disabled}
      sx={{
        '@media (hover: hover)': {
          '&:hover': accent ? { bgcolor: t.accent.primaryHover } : { filter: 'brightness(0.97)' },
        },
        '@media (prefers-reduced-motion: reduce)': { '&:active': { transform: 'none' } },
        '&:active': { transform: 'scale(0.97)' },
        '&:focus-visible': { boxShadow: '0 0 0 3px var(--focus-ring-color)' },
        '&.Mui-disabled': { opacity: 0.45 },
        bgcolor: accent ? t.accent.primary : mobileSurface.chip,
        borderRadius: '14px',
        color: accent ? t.accent.onPrimary : mobileText.primary,
        fontSize: 17,
        fontWeight: 500,
        letterSpacing: '-0.3px',
        minHeight: 50,
        px: 3,
        transition: 'transform 160ms var(--ease), background-color 160ms var(--ease)',
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      {children}
    </ButtonBase>
  );
}

/* -------------------------------------------------------------- asset mark */

/**
 * Circular mark for a token or an identity. Token logos are conventionally
 * round, so this is one of the few circular elements the system keeps.
 */
export function AssetMark({
  children,
  size = 40,
  tone = 'neutral',
}: {
  children: ReactNode;
  size?: number;
  tone?: 'accent' | 'neutral';
}) {
  return (
    <Avatar size={size} tone={tone}>
      {children}
    </Avatar>
  );
}

/** Initials for a mark that has no logo of its own. */
export function initialsFor(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

/** Visually hidden text, for context a sighted reader gets from layout. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        clip: 'rect(0 0 0 0)',
        height: 1,
        overflow: 'hidden',
        position: 'absolute',
        whiteSpace: 'nowrap',
        width: 1,
      }}
    >
      {children}
    </Box>
  );
}
