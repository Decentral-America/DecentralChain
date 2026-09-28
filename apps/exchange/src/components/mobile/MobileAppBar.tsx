import { Box, ButtonBase, Typography } from '@mui/material';
import { Bell } from 'lucide-react';
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  mobileFluid,
  mobileLayout,
  mobileMaterial,
  mobileText,
  mobileType,
} from '@/styles/mobileTokens';

/**
 * The large-title navigation header every mobile screen opens with.
 *
 * Two layers, as in iOS: a compact bar pinned to the top (leading control,
 * a centred inline title, trailing control) and, beneath it, the screen's
 * large title on the page ground. The large title scrolls away with the
 * content; once it has passed under the bar, the bar takes on the translucent
 * chrome material with a hairline and the inline title fades in.
 *
 * The bar never changes height, so the page length is constant and scrolling
 * cannot feed back into the header's own state.
 */

interface MobileAppBarProps {
  /** The screen's title, rendered as the large title */
  title: ReactNode;
  /** One line stating what the screen is for */
  subtitle?: string | undefined;
  /** Replaces the leading slot, e.g. with a back button on sub-screens */
  leading?: ReactNode | undefined;
  /** Shows the unread indicator on the bell. Pass only from real message state. */
  unread?: boolean;
  /** Replaces the trailing notification control */
  trailing?: ReactNode | undefined;
}

export function MobileAppBar({
  title,
  subtitle,
  leading,
  unread = false,
  trailing,
}: MobileAppBarProps) {
  const navigate = useNavigate();
  const barRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  /*
   * Published so a screen can pin something of its own directly beneath the
   * bar (CreateToken's sticky step header reads it).
   */
  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const measure = () =>
      document.documentElement.style.setProperty(
        '--mobile-band-height',
        `${el.getBoundingClientRect().height}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--mobile-band-height');
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const bar = barRef.current?.getBoundingClientRect();
      const heading = titleRef.current?.getBoundingClientRect();
      if (!bar || !heading) return;
      // Collapsed once the large title's baseline has slid under the bar.
      setCollapsed(heading.bottom - 6 <= bar.bottom);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <>
      <Box
        component="header"
        ref={barRef}
        sx={{
          '@supports not (backdrop-filter: blur(1px))': {
            bgcolor: collapsed ? 'var(--surface-canvas)' : 'transparent',
          },
          alignItems: 'center',
          backdropFilter: collapsed ? mobileMaterial.filter : 'none',
          bgcolor: collapsed ? mobileMaterial.chrome : 'transparent',
          boxShadow: collapsed ? 'inset 0 -0.5px 0 var(--border-strong)' : 'none',
          display: 'grid',
          gap: 1,
          gridTemplateColumns: '1fr auto 1fr',
          minHeight: `calc(${mobileLayout.headerHeight}px + env(safe-area-inset-top))`,
          position: 'sticky',
          pt: 'env(safe-area-inset-top)',
          px: 1,
          top: 0,
          transition:
            'background-color 200ms var(--ease), box-shadow 200ms var(--ease), backdrop-filter 200ms var(--ease)',
          WebkitBackdropFilter: collapsed ? mobileMaterial.filter : 'none',
          // Above the page content, which scrolls beneath the pinned bar.
          zIndex: 1100,
        }}
      >
        <Box sx={{ alignItems: 'center', display: 'flex', justifySelf: 'start', minWidth: 0 }}>
          {leading}
        </Box>

        <Typography
          aria-hidden="true"
          sx={{
            color: mobileText.primary,
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: '-0.3px',
            maxWidth: '56vw',
            opacity: collapsed ? 1 : 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transform: collapsed ? 'none' : 'translateY(4px)',
            transition: 'opacity 180ms var(--ease), transform 220ms var(--ease)',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </Typography>

        <Box sx={{ alignItems: 'center', display: 'flex', justifySelf: 'end' }}>
          {trailing ?? (
            <ButtonBase
              aria-label="Notifications"
              onClick={() => navigate('/desktop/messages')}
              sx={{
                '@media (hover: hover)': { '&:hover': { bgcolor: 'var(--surface-fill)' } },
                '&:active': { bgcolor: 'var(--surface-fill)' },
                '&:focus-visible': { boxShadow: '0 0 0 2px var(--color-indigo-ink)' },
                borderRadius: '50%',
                color: 'var(--color-indigo-ink)',
                height: mobileLayout.minTapTarget,
                position: 'relative',
                transition: 'background-color 160ms var(--ease)',
                width: mobileLayout.minTapTarget,
              }}
            >
              <Bell size={22} strokeWidth={1.8} aria-hidden="true" />
              {unread ? (
                <Box
                  sx={{
                    bgcolor: 'var(--color-danger)',
                    border: '2px solid var(--surface-ground)',
                    borderRadius: '50%',
                    height: 10,
                    position: 'absolute',
                    right: 10,
                    top: 9,
                    width: 10,
                  }}
                />
              ) : null}
            </ButtonBase>
          )}
        </Box>
      </Box>

      {/* The large title, on the page ground; it scrolls away with the content. */}
      <Box sx={{ pb: 2.5, pt: 0.5, px: `${mobileLayout.gutter}px` }}>
        <Typography
          ref={titleRef}
          component="h1"
          sx={{
            color: mobileText.primary,
            fontSize: mobileFluid.largeTitle,
            fontWeight: mobileType.largeTitle.weight,
            letterSpacing: mobileType.largeTitle.tracking,
            lineHeight: mobileType.largeTitle.lineHeight,
            overflowWrap: 'anywhere',
          }}
        >
          {title}
        </Typography>

        {subtitle ? (
          <Typography
            sx={{
              color: mobileText.secondary,
              fontSize: 15,
              letterSpacing: '-0.15px',
              lineHeight: 1.4,
              mt: 0.5,
            }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>
    </>
  );
}
