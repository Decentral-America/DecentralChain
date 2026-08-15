/**
 * Icon Component System
 *
 * Built on Lucide: geometric line-art with a configurable stroke, which is what
 * the design system specifies — 1.5px strokes in the accent colour or
 * currentColor, never filled glyphs and never emoji.
 *
 * Icons are imported by name rather than with a namespace import. The previous
 * implementation pulled in three complete icon sets (`import * as MdIcons`
 * etc.), which defeats tree-shaking and ships thousands of unused paths.
 */

import {
  AlertTriangle,
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUp,
  ArrowUpRight,
  Ban,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Info,
  Key,
  KeyRound,
  Landmark,
  LineChart,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  type LucideIcon,
  Menu,
  Moon,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Save,
  ScrollText,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  TrendingUp,
  Unlock,
  Upload,
  User,
  Wallet,
  X,
} from 'lucide-react';
import React from 'react';
import { logger } from '@/lib/logger';

/**
 * The curated icon set. Keeping the surface small is deliberate: it keeps the
 * visual language uniform and makes the bundle cost explicit.
 */
export const ICONS = {
  add: Plus,
  alert: AlertTriangle,
  arrowBack: ArrowLeft,
  arrowForward: ArrowRight,
  arrowUpRight: ArrowUpRight,
  bank: Landmark,
  bell: Bell,
  burn: Flame,
  card: CreditCard,
  chart: LineChart,
  check: Check,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  clipboard: Clipboard,
  close: X,
  copy: Copy,
  delete: Trash2,
  deny: Ban,
  download: Download,
  edit: Pencil,
  error: AlertTriangle,
  externalLink: ExternalLink,
  eye: Eye,
  eyeOff: EyeOff,
  globe: Globe,
  import: ArrowDownToLine,
  info: Info,
  key: Key,
  lock: Lock,
  login: LogIn,
  logout: LogOut,
  menu: Menu,
  moon: Moon,
  privateKey: KeyRound,
  qr: QrCode,
  refresh: RefreshCw,
  save: Save,
  search: Search,
  seed: ScrollText,
  send: Send,
  settings: Settings,
  shield: Shield,
  sparkle: Sparkles,
  spinner: Loader2,
  success: Check,
  sun: Sun,
  swap: ArrowRightLeft,
  trendDown: ArrowDown,
  trending: TrendingUp,
  trendUp: ArrowUp,
  unlock: Unlock,
  upload: Upload,
  user: User,
  wallet: Wallet,
  warning: AlertTriangle,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name' | 'ref'> {
  name: IconName;
  /** Rendered size in pixels. Defaults to 20 — the system's inline icon size. */
  size?: number | string;
  /** Overrides `currentColor`. Prefer inheriting from the parent. */
  color?: string;
  /** Stroke weight. 1.5 is the system default; do not thicken it casually. */
  strokeWidth?: number;
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, size = 20, color, strokeWidth = 1.5, ...props }, ref) => {
    const LucideComponent = ICONS[name];

    if (!LucideComponent) {
      logger.warn(`Icon "${name}" is not in the curated icon set`);
      return null;
    }

    return (
      <LucideComponent
        ref={ref}
        size={size}
        color={color ?? 'currentColor'}
        strokeWidth={strokeWidth}
        aria-hidden={props['aria-label'] ? undefined : true}
        focusable="false"
        {...props}
      />
    );
  },
);

Icon.displayName = 'Icon';

/**
 * Legacy name map.
 *
 * Existing call sites use `CommonIcons.Info` and similar; these now resolve to
 * the Lucide set so no consumer needs to change to get the new rendering.
 */
export const CommonIcons = {
  AccountBalanceWallet: 'wallet',
  Add: 'add',
  ArrowBack: 'arrowBack',
  ArrowForward: 'arrowForward',
  Check: 'check',
  Close: 'close',
  Delete: 'delete',
  Edit: 'edit',
  Error: 'error',
  Home: 'wallet',
  Info: 'info',
  Menu: 'menu',
  Person: 'user',
  Remove: 'close',
  Save: 'save',
  Search: 'search',
  Send: 'send',
  Settings: 'settings',
  Warning: 'warning',
} satisfies Record<string, IconName>;
