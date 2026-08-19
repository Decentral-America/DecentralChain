import { Box, ButtonBase, Typography } from '@mui/material';
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '@/components/atoms/Icon';
import { mobileBrand, mobileGradient, mobileLayout, mobileText } from '@/styles/mobileTokens';
import { palette } from '@/styles/tokens';
import { contourStroke } from '@/theme/landingTheme';

/**
 * The branded band every mobile screen opens with.
 *
 * Carries the product identity (mark and wordmark), the notification control,
 * then the screen's own title and one line of purpose. Its bottom corners are
 * rounded so the first content card reads as sitting on top of the band rather
 * than butting against a hard edge.
 *
 * Giving every screen the same band is what makes the app feel like one
 * product; the title and subtitle are what keep each screen distinct.
 */

/** Precomputed so each path carries a stable identity rather than an index. */
const CONTOURS = Array.from(
  { length: 9 },
  (_, i) =>
    `M ${210 - i * 6} -20 C ${150 - i * 12} ${40 + i * 6}, ${150 - i * 10} ${120 + i * 4}, ${215 - i * 4} 220`,
);

/**
 * Decorative contour lines in the band's top-right, drawn inline so the header
 * costs no image request and stays within the app's strict CSP.
 */
function BandTexture() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        bottom: 0,
        // `maskImage` reads the gradient's luminance, not its hue — any
        // opaque colour masks identically to `#000` here. Same reasoning as
        // the landing `BandTexture` this band's texture mirrors.
        maskImage: `linear-gradient(to left, ${palette.midnightInk} 10%, transparent 75%)`,
        opacity: 0.5,
        overflow: 'hidden',
        pointerEvents: 'none',
        position: 'absolute',
        right: 0,
        top: 0,
        width: '68%',
      }}
    >
      <svg viewBox="0 0 200 200" preserveAspectRatio="xMaxYMid slice">
        <title>Decorative contours</title>
        {CONTOURS.map((d) => (
          <path key={d} d={d} fill="none" stroke={contourStroke} strokeWidth="0.7" />
        ))}
      </svg>
    </Box>
  );
}

interface MobileAppBarProps {
  /** The screen's title, rendered large on the band */
  title: ReactNode;
  /** One line stating what the screen is for */
  subtitle?: string | undefined;
  /** Replaces the notification control, e.g. with a back button on sub-screens */
  leading?: ReactNode | undefined;
  /** Shows the unread indicator on the bell */
  unread?: boolean;
}

/** Scroll distance after which the band collapses to its compact form. */
const COLLAPSE_AT = 48;

/** Breathing room between the band and the first element below it. */
const GAP = 20;

/**
 * Scroll room a page needs before the band is allowed to collapse at all —
 * comfortably more than the threshold, so entering the collapsed state is
 * never the last thing that happens at the bottom of a short page.
 */
const MIN_ROOM = 140;

export function MobileAppBar({ title, subtitle, leading, unread = false }: MobileAppBarProps) {
  const navigate = useNavigate();
  const bandRef = useRef<HTMLElement>(null);
  /** Largest scroll room this screen has offered — see the note in onScroll. */
  const roomRef = useRef(0);

  /*
   * The band is pinned, but at full height it would occupy a third of a phone
   * screen. So it collapses on scroll: the large title and subtitle fold away
   * and the title moves inline beside the mark, leaving a compact bar that
   * keeps the brand and the notification control reachable at all times.
   */
  const [collapsed, setCollapsed] = useState(false);

  /*
   * Collapsing makes the band shorter, which makes the page shorter. On a
   * screen with only a little to scroll that pushed the scroll position back
   * under the threshold, which expanded the band, which lengthened the page
   * again — the two states flickered against each other.
   *
   * The spacer below gives back exactly the height the band gives up, so the
   * page length never changes and the loop cannot start. It also stops the
   * content jumping upwards the moment the band shrinks.
   */
  const [height, setHeight] = useState(0);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = bandRef.current;
    if (!el) return;
    const measure = () => {
      const next = el.getBoundingClientRect().height;
      setHeight(next);
      // The tallest the band has been is what the spacer works back from.
      setExpandedHeight((prev) => (prev === null || next > prev ? next : prev));
      /*
       * Published so a screen can pin something of its own directly beneath the
       * band — the band's height is not a constant, it shrinks as it collapses,
       * and anything sticking below it has to follow.
       */
      document.documentElement.style.setProperty('--mobile-band-height', `${next}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--mobile-band-height');
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      /*
       * The spacer resizes an observer tick behind the band, so mid-transition
       * the page is briefly shorter than it settles at. Reading that transient
       * would drop a page sitting just above MIN_ROOM below it, expand the
       * band, and start the cycle again — which is the flicker itself. The
       * largest room seen is the honest figure; it only grows as content loads.
       */
      const room = document.documentElement.scrollHeight - window.innerHeight;
      if (room > roomRef.current) roomRef.current = room;
      const y = window.scrollY;
      setCollapsed((was) => {
        /*
         * A page that can only scroll a little has no room to hold the
         * collapsed state: the band would enter it in the last few pixels of
         * travel and flip straight back. Leave it expanded instead.
         */
        if (roomRef.current < MIN_ROOM) return false;
        /*
         * Different thresholds each way, so a scroll position resting near the
         * boundary cannot toggle the band back and forth.
         */
        return was ? y > COLLAPSE_AT / 2 : y > COLLAPSE_AT;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const surrendered = expandedHeight === null ? 0 : Math.max(0, expandedHeight - height);

  return (
    <>
      <Box
        component="header"
        ref={bandRef}
        sx={{
          background: mobileGradient.header,
          // Square edges once collapsed so the pinned bar reads as chrome.
          borderBottomLeftRadius: collapsed ? 0 : 28,
          borderBottomRightRadius: collapsed ? 0 : 28,
          color: mobileText.onAccent,
          overflow: 'hidden',
          pb: collapsed ? 1.5 : 3.5,
          // Pinned so the brand and notifications stay reachable while scrolling.
          position: 'sticky',
          pt: 'calc(env(safe-area-inset-top) + 14px)',
          px: `${mobileLayout.gutter}px`,
          top: 0,
          transition: 'padding 180ms ease, border-radius 180ms ease',
          // Above the page content, which scrolls beneath the pinned band.
          zIndex: 1100,
        }}
      >
        <BandTexture />

        {/* Brand row */}
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            gap: 1.25,
            minHeight: 44,
            position: 'relative',
          }}
        >
          {leading}

          {!leading && (
            <>
              {/* The real brand mark, white ink for the band. */}
              <Box
                component="img"
                src="/brand/mark-on-dark.png"
                alt=""
                aria-hidden="true"
                sx={{ flexShrink: 0, height: 30, width: 30 }}
              />
              <Typography
                sx={{
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: '-0.2px',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {collapsed ? title : 'Decentral Exchange'}
              </Typography>
            </>
          )}

          <Box sx={{ flex: 1 }} />

          <ButtonBase
            aria-label="Notifications"
            onClick={() => navigate('/desktop/messages')}
            sx={{
              borderRadius: '50%',
              color: 'inherit',
              height: 44,
              position: 'relative',
              width: 44,
            }}
          >
            <Icon name="bell" size={22} strokeWidth={1.8} />
            {unread ? (
              <Box
                sx={{
                  bgcolor: mobileBrand.notification,
                  borderRadius: '50%',
                  height: 9,
                  position: 'absolute',
                  right: 9,
                  top: 9,
                  width: 9,
                }}
              />
            ) : null}
          </ButtonBase>
        </Box>

        {/* Screen identity — folds away once the band collapses */}
        <Box
          aria-hidden={collapsed}
          sx={{
            maxHeight: collapsed ? 0 : 200,
            opacity: collapsed ? 0 : 1,
            overflow: 'hidden',
            position: 'relative',
            pt: collapsed ? 0 : 1.5,
            transition: 'max-height 180ms ease, opacity 140ms ease, padding-top 180ms ease',
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontSize: 'clamp(26px, 7.4vw, 34px)',
              fontWeight: 700,
              letterSpacing: '-0.7px',
              lineHeight: 1.15,
              overflowWrap: 'anywhere',
            }}
          >
            {title}
          </Typography>

          {subtitle ? (
            <Typography
              sx={{
                color: mobileText.onBandMuted,
                fontSize: 15,
                lineHeight: 1.4,
                mt: 0.75,
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      </Box>

      {/* Holds the page length constant as the band collapses — see above. */}
      <Box aria-hidden="true" sx={{ height: `${GAP + surrendered}px` }} />
    </>
  );
}
